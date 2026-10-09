/**
 * Shared LIVE-PREVIEW OAuth client configuration (server-only).
 *
 * Credentials are intentionally NOT stored in this public repository.
 * The deployer/preview environment must inject GROK_AUTH_CLIENT_ID and
 * GROK_AUTH_CLIENT_SECRET when federated authentication is enabled.
 *
 * The preview callback remains restricted to *.grok-sandbox.com.
 */
export const GROK_ISSUER_DEFAULT = "https://auth.grok.me";

/**
 * Host patterns whose callbacks the preview client accepts. Better Auth derives
 * the live preview's real origin from the request host and validates it against
 * this list (wildcard-matched), so the OAuth `redirect_uri` becomes the concrete
 * `https://<preview-host>/api/auth/oauth2/callback/...` the broker allows.
 */
export const PREVIEW_ALLOWED_HOSTS = ["*.grok-sandbox.com"] as const;
