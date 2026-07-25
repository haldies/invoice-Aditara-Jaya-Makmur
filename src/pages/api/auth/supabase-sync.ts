import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import { getSessionCookieName, getUserFromSessionToken } from "@/lib/authLocal";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/appMetadata";

const OAUTH_STATE_COOKIE = "lokerhub_oauth_authorization_id";

function readCookie(req: NextApiRequest, name: string) {
  const cookie = req.headers.cookie ?? "";
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "no-store");

  const authorizationId = req.query.authorization_id;
  if (!authorizationId || typeof authorizationId !== "string") {
    return res.status(400).json({ error: "Missing authorization_id" });
  }

  // 1. Verify local LokerHub session
  const token = readCookie(req, getSessionCookieName());
  if (!token) {
    return res.redirect(`/login?next=${encodeURIComponent(`/oauth/consent?authorization_id=${authorizationId}`)}`);
  }

  const user = await getUserFromSessionToken(token);
  if (!user || !user.email) {
    return res.redirect(`/login?next=${encodeURIComponent(`/oauth/consent?authorization_id=${authorizationId}`)}`);
  }

  let admin;
  try {
    admin = getSupabaseAdminClient();
  } catch (error) {
    console.error("Failed to initialize Supabase admin:", error);
    return res.status(500).json({ error: "Konfigurasi Supabase Admin (SERVICE_ROLE_KEY) belum diatur di server." });
  }

  // 2. Ensure user exists in Supabase Auth
  // We use a random password since local auth handles the real password
  try {
    await admin.auth.admin.createUser({
      email: user.email,
      email_confirm: true,
      password: crypto.randomUUID() + "A1!",
    });
  } catch (err: unknown) {
    const authError = err as { status?: number; message?: string };
    // Ignore error if user already exists
    if (
      authError.status !== 422 &&
      !authError.message?.includes("already exists")
    ) {
      console.error("Warning: Failed to ensure Supabase user exists:", err);
    }
  }

  // 3. Generate Magic Link to log the user into Supabase silently
  // The magic link will redirect the user to the consent page with the session set
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol =
    typeof forwardedProto === "string"
      ? forwardedProto.split(",")[0]
      : process.env.NODE_ENV === "production"
        ? "https"
        : "http";
  const requestOrigin = req.headers.host
    ? `${protocol}://${req.headers.host}`
    : getAppUrl();
  const appUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    requestOrigin;
  const redirectTo = `${appUrl}/oauth/consent?authorization_id=${authorizationId}`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
    options: {
      redirectTo,
    },
  });

  if (error || !data?.properties?.action_link) {
    console.error("Failed to generate Supabase sync link:", error);
    return res.status(500).json({ error: "Gagal mensinkronisasi sesi Supabase." });
  }

  res.setHeader(
    "Set-Cookie",
    `${OAUTH_STATE_COOKIE}=${encodeURIComponent(authorizationId)}; Path=/; Max-Age=600; SameSite=Lax; Secure`
  );

  // 4. Redirect browser to the magic link to set the Supabase cookies
  return res.redirect(data.properties.action_link);
}
