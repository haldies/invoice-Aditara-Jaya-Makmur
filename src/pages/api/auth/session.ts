import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionCookieName, getUserFromSessionToken } from "@/lib/authLocal";

function readCookie(req: NextApiRequest, name: string) {
  const cookie = req.headers.cookie ?? "";
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = readCookie(req, getSessionCookieName());
  if (!token) return res.status(200).json({ session: null });
  const user = await getUserFromSessionToken(token);
  if (!user) return res.status(200).json({ session: null });
  return res.status(200).json({
    session: { user: { id: user.id, email: user.email, role: user.role } },
  });
}
