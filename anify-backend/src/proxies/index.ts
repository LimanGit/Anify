/**
 * @fileoverview Proxies configuration. Used for fetching CORS proxies to avoid rate limits and IP bans.
 */

/**
 * @description Target body hash for all public CORS proxies.
 */
export const TARGET_HASH = "c7d96235df80ea051e9d57f3ab6d3e4da289fd3b";
/**
 * @description Maximum timeout length for a proxy before it is considered dead.
 */
export const TIMEOUT_MS = 5000;
