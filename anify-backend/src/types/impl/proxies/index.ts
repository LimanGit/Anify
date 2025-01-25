/**
 * @fileoverview Proxies types
 */

import { ProviderType } from "../..";

/**
 * @description Proxy interface
 */
export interface IProxy {
    ip: string;
    port: number;
    country: string;
    type: string;
    anonymity: string;
}

/**
 * @description Custom request config
 */
export interface IRequestConfig extends RequestInit {
    isChecking?: boolean;
    proxy?: string;
    useGoogleTranslate?: boolean;
    timeout?: number;
    providerType?: ProviderType;
    providerId?: string;
    maxRetries?: number;
}

export interface IProxyCheckInfo {
    lastChecked: string;
    validProxiesFound: number;
    lastCheckedIndex?: number; // Track where we left off in the proxy list
}

export interface IProxyChecksConfig {
    proxyChecks: {
        [key in ProviderType]?: {
            [providerId: string]: IProxyCheckInfo;
        };
    };
}
