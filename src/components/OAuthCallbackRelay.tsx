import { useEffect } from "react";

const OAUTH_STATE_COOKIE = "lokerhub_oauth_authorization_id";

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
}

export function OAuthCallbackRelay() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token=") || !hash.includes("type=magiclink")) {
      return;
    }

    const authorizationId = readCookie(OAUTH_STATE_COOKIE);
    if (!authorizationId) return;

    document.cookie = `${OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    window.location.replace(
      `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}${hash}`
    );
  }, []);

  return null;
}
