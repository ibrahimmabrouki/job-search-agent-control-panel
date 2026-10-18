// This file is responsible for holding Hermes-specific constant values that should not be repeated across the codebase.
// For example it will hold the URLs and the header names which get repeated everywhere
// So, HermesClient and services can import these contants and reuse one trusted definition and this important since later on we will have one single place to change these values
// ==> fewer typos
// ==> easier maintenance if Hermes changes an endpoint later

// 1. env.ts
//    → where Hermes is and what secret to use

// 2. hermes.constants.ts
//    → what Hermes endpoint/header names are

// 3. hermes.client.ts
//    → actually sends requests to Hermes

// Common Hermes contant which is used across the codebase in everyheader of any request to Hermes
// Authentication header name for Hermes API requests
export const HERMES_HEADERS = {
  SESSION_TOKEN: "X-Hermes-Session-Token",
} as const;

// Now instead of hardcoding it: headers: { "X-Hermes-Session-Token": token }
// Then: headers: { [HERMES_HEADERS.SESSION_TOKEN]: token }

// Feature one: Which is the satus endpoint
export const HERMES_ENDPOINTS = {
  STATUS: "/api/status",
} as const;

// Instead of hardcoding it: fetch(`${baseUrl}/api/status`)
// Then: fetch(`${baseUrl}${HERMES_ENDPOINTS.STATUS}`)