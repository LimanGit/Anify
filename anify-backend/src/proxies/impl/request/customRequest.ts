import type { IRequestConfig } from "../../../types/impl/proxies";
import { ProxyAgent } from "undici";
import { removeProviderProxy } from "../manager/impl/file/saveProviderProxies";
import { getRandomProxy } from "../manager/impl/getRandomProxy";
import { ProviderType } from "../../../types";

export async function customRequest(url: string, options: IRequestConfig = {}): Promise<Response> {
    // Ensure isChecking is properly set from options
    const isChecking = options.isChecking ?? false;
    
    try {
        const { useGoogleTranslate, timeout = isChecking ? 10000 : 5000, providerType, providerId, maxRetries = 3 } = options;

        let currentProxy = options.proxy;
        let retryCount = 0;
        // Keep track of used proxies to avoid reusing them
        const usedProxies = new Set<string>();
        if (currentProxy) usedProxies.add(currentProxy);

        async function tryFetch(finalURL: string, fetchOptions: any): Promise<Response> {
            return new Promise<Response>(async (resolve) => {
                try {
                    // Create a new abort controller for this specific fetch
                    const abortController = new AbortController();
                    
                    // Handle abort signals from parent controller if it exists
                    if (fetchOptions.signal) {
                        fetchOptions.signal.addEventListener('abort', () => {
                            abortController.abort();
                        });
                    }

                    const timeoutId = setTimeout(() => {
                        if (isChecking) {
                            resolve(new Response(null, { status: 500 }));
                        } else {
                            abortController.abort();
                        }
                    }, fetchOptions.timeout || 5000);

                    try {
                        // Use our local abort controller but keep other options
                        const finalFetchOptions = {
                            ...fetchOptions,
                            signal: abortController.signal,
                            isChecking // Ensure isChecking is passed through
                        };
                        delete finalFetchOptions.timeout; // Remove timeout as we handle it separately

                        const response = await fetch(finalURL, finalFetchOptions).catch((fetchError: any) => {
                            // Immediately catch and handle fetch errors
                            if (isChecking) {
                                return new Response(null, { status: 500 });
                            }
                            throw fetchError;
                        });

                        clearTimeout(timeoutId);
                        resolve(response);
                    } catch (error: any) {
                        clearTimeout(timeoutId);
                        // Always resolve with 500 during proxy checks or connection errors
                        if (isChecking || 
                            error.code === "ConnectionClosed" || 
                            error.message?.includes("socket connection was closed") ||
                            error.message?.includes("The socket connection was closed unexpectedly") ||
                            error.name === "AbortError" ||
                            (error as any).code === "ABORT_ERR") {
                            resolve(new Response(null, { status: 500 }));
                            return;
                        }
                        throw error;
                    }
                } catch (error: any) {
                    // Final catch-all - always resolve with 500 during proxy checks
                    if (isChecking) {
                        resolve(new Response(null, { status: 500 }));
                        return;
                    }
                    throw error;
                }
            }).catch(error => {
                // Ultimate fallback - if we somehow get here during a proxy check, return 500
                if (isChecking) {
                    return new Response(null, { status: 500 });
                }
                throw error;
            });
        }

        while (retryCount < maxRetries) {
            const finalURL = useGoogleTranslate ? "http://translate.google.com/translate?sl=ja&tl=en&u=" + encodeURIComponent(url) : url;
            const isHttps = finalURL.startsWith("https://");

            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);

            try {
                // Create a fresh options object for each attempt, without the previous dispatcher
                const currentOptions = { ...options };
                delete currentOptions.dispatcher; // Remove any existing dispatcher

                // Set the current proxy
                currentOptions.proxy = currentProxy;

                if (currentProxy && currentProxy.length > 0) {
                    // Create a new ProxyAgent for each attempt with appropriate configuration for HTTP/HTTPS
                    // @ts-expect-error - ProxyAgent is compatible with Dispatcher but types are mismatched
                    currentOptions.dispatcher = new ProxyAgent({
                        uri: currentProxy,
                        // Only add TLS options for HTTPS URLs
                        ...(isHttps
                            ? {
                                  requestTls: {
                                      rejectUnauthorized: false,
                                  },
                                  connect: {
                                      timeout: timeout
                                  }
                              }
                            : {
                                  // For HTTP URLs, ensure connection is not upgraded to HTTPS
                                  protocol: "http:",
                                  connect: {
                                      timeout: timeout
                                  }
                              })
                    });
                }

                const response = await tryFetch(finalURL, {
                    ...currentOptions,
                    signal: controller.signal,
                    redirect: useGoogleTranslate ? "follow" : "manual"
                });

                clearTimeout(id);

                // If we got a 500 response from tryFetch, it means we had a connection error
                if (response.status === 500 && isChecking) {
                    // Try to get a new proxy
                    if (currentProxy && providerType && providerId) {
                        try {
                            await removeProviderProxy(providerType as ProviderType, providerId, currentProxy);
                        } catch (removeError) {
                            console.error("Failed to remove proxy:", removeError);
                        }

                        // Keep trying to get a new proxy until we get one we haven't used
                        let newProxy: string | null = null;
                        let attempts = 0;
                        const maxAttempts = 10;

                        while (attempts < maxAttempts) {
                            newProxy = getRandomProxy(providerType as ProviderType, providerId);
                            if (!newProxy || !usedProxies.has(newProxy)) {
                                break;
                            }
                            attempts++;
                        }

                        if (newProxy && attempts < maxAttempts) {
                            currentProxy = newProxy;
                            usedProxies.add(newProxy);
                            retryCount++;
                            continue;
                        }
                    }
                    return response;
                }

                // Handle redirects manually
                if (response.status === 301 || response.status === 302 || response.status === 303 || response.status === 307 || response.status === 308) {
                    const location = response.headers.get("location");
                    if (location) {
                        // Create new options for the redirect
                        const redirectOptions = { ...options };
                        // Copy over headers from the original response that should be preserved
                        if (response.headers.get("set-cookie")) {
                            redirectOptions.headers = {
                                ...redirectOptions.headers,
                                Cookie: response.headers.get("set-cookie") || "",
                            };
                        }
                        // Make a new request to the redirect location
                        return customRequest(location, redirectOptions);
                    }
                }

                return response;
            } catch (error) {
                clearTimeout(id);

                // During proxy checks, return a failed response for any error
                if (isChecking) {
                    return new Response(null, { status: 500 });
                }

                // Check if this is a retriable error
                const shouldRetryError =
                    error instanceof Error &&
                    (error.message.includes("ConnectionRefused") ||
                        error.message.includes("timed out") ||
                        error.message.includes("Unable to connect") ||
                        error.message.includes("aborted") ||
                        error.name === "AbortError" ||
                        (error as any).code === "ABORT_ERR" ||
                        error.message.includes("timeout") ||
                        error.message.includes("Timeout") ||
                        error.message.includes("Request to") ||
                        // Add connection closed errors
                        error.message.includes("ConnectionClosed") ||
                        error.message.includes("connection closed") ||
                        error.message.includes("socket connection was closed") ||
                        error.name === "ConnectionClosedError" ||
                        // Add SSL certificate errors
                        error.message.includes("unable to verify") ||
                        error.message.includes("UNABLE_TO_VERIFY_LEAF_SIGNATURE") ||
                        error.message.includes("CERT_HAS_EXPIRED") ||
                        error.message.includes("certificate") ||
                        (error as any).code === "CERT_NOT_YET_VALID");

                if (currentProxy && shouldRetryError && providerType && providerId) {
                    try {
                        await removeProviderProxy(providerType as ProviderType, providerId, currentProxy);
                    } catch (removeError) {
                        console.error("Failed to remove proxy:", removeError);
                    }

                    // Keep trying to get a new proxy until we get one we haven't used
                    let newProxy: string | null = null;
                    let attempts = 0;
                    const maxAttempts = 10;

                    while (attempts < maxAttempts) {
                        newProxy = getRandomProxy(providerType as ProviderType, providerId);
                        if (!newProxy || !usedProxies.has(newProxy)) {
                            break;
                        }
                        attempts++;
                    }

                    if (newProxy && attempts < maxAttempts) {
                        currentProxy = newProxy;
                        usedProxies.add(newProxy);
                        retryCount++;
                        continue;
                    }
                }

                throw error;
            }
        }

        // If we get here during a check, return failed response, otherwise throw error
        if (isChecking) {
            return new Response(null, { status: 500 });
        }
        throw new Error("Unexpected end of request loop");
    } catch (error: any) {
        // Top level error handler
        if (isChecking) {
            // During proxy checks, always return a failed response instead of throwing
            return new Response(null, { status: 500 });
        }
        
        // For connection closed errors, return a failed response
        if (error.code === "ConnectionClosed" || 
            error.message?.includes("socket connection was closed") ||
            error.message?.includes("The socket connection was closed unexpectedly")) {
            return new Response(null, { status: 500 });
        }
        
        throw error;
    }
}
