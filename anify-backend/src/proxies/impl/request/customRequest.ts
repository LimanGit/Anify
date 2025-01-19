import type { IRequestConfig } from "../../../types/impl/proxies";
import { ProxyAgent } from "undici";
import { removeProviderProxy } from "../manager/impl/file/saveProviderProxies";
import { getRandomProxy } from "../manager/impl/getRandomProxy";
import { ProviderType } from "../../../types";

export async function customRequest(url: string, options: IRequestConfig = {}): Promise<Response> {
    const { useGoogleTranslate, timeout = 5000, providerType, providerId, maxRetries = 3 } = options;
    let currentProxy = options.proxy;
    let retryCount = 0;
    // Keep track of used proxies to avoid reusing them
    const usedProxies = new Set<string>();
    if (currentProxy) usedProxies.add(currentProxy);

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
                          }
                        : {
                              // For HTTP URLs, ensure connection is not upgraded to HTTPS
                              protocol: "http:",
                          }),
                });
            }

            const fetchPromise = fetch(finalURL, {
                ...currentOptions,
                signal: controller.signal,
                redirect: "manual", // Don't automatically follow redirects
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => {
                    controller.abort();
                    reject(new Error(`Request to ${url}${currentProxy && currentProxy.length > 0 ? ` with proxy ${currentProxy}` : ""} timed out after ${timeout} ms`));
                }, timeout),
            );

            const response = await Promise.race([fetchPromise, timeoutPromise]);
            clearTimeout(id);

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
            if (options.isChecking) {
                throw error;
            }

            clearTimeout(id);

            // Check if this is a retriable error (connection refused, timeout, abort, etc.)
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
                    error.name === "ConnectionClosedError");

            // Always retry if we have a proxy and it's a retriable error
            if (currentProxy && shouldRetryError) {
                // Only try to remove the proxy if we have provider info
                if (providerType && providerId) {
                    try {
                        await removeProviderProxy(providerType as ProviderType, providerId, currentProxy);
                    } catch (removeError) {
                        console.error("Failed to remove proxy:", removeError);
                    }

                    // Keep trying to get a new proxy until we get one we haven't used
                    let newProxy: string | null = null;
                    let attempts = 0;
                    const maxAttempts = 10; // Prevent infinite loops

                    while (attempts < maxAttempts) {
                        newProxy = getRandomProxy(providerType as ProviderType, providerId);
                        if (!newProxy || !usedProxies.has(newProxy)) {
                            break;
                        }
                        attempts++;
                    }

                    // If no more proxies available or all have been used, throw the error
                    if (!newProxy || attempts >= maxAttempts) {
                        throw new Error(`No more unused proxies available for ${providerType} ${providerId} after proxy failure: ${error instanceof Error ? error.message : String(error)}`);
                    }

                    // Update the proxy and track it as used
                    currentProxy = newProxy;
                    usedProxies.add(newProxy);
                }

                retryCount++;

                // If we've exhausted all retries, throw the last error
                if (retryCount >= maxRetries) {
                    throw new Error(`Max retries (${maxRetries}) reached for ${url}. Last error: ${error instanceof Error ? error.message : String(error)}`);
                }

                // Continue to next iteration to retry with new proxy
                continue;
            }

            // If it's not a retriable error or we don't have a proxy, just throw the error
            throw error;
        }
    }

    throw new Error("Unexpected end of request loop");
}
