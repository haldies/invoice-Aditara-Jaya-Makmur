import type { NextApiRequest, NextApiResponse } from "next";
import { deleteSessionToken, getSessionCookieName } from "@/lib/authLocal";

function readCookie(req: NextApiRequest, name: string) {
  const cookie = req.headers.cookie ?? "";
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const token = readCookie(req, getSessionCookieName());
  if (token) {
    await deleteSessionToken(token);
  }
  res.setHeader(
    "Set-Cookie",
    `${getSessionCookieName()}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return res.status(200).json({ success: true });
}
