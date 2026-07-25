import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionCookieName, getUserFromSessionToken } from "./authLocal";
import { prisma } from "./prisma";
import type { AppRole } from "@/types/invoice";

export interface RequestUser {
  id: string;
  email: string | null;
  role: AppRole;
}

function getCookieToken(req: NextApiRequest): string | null {
  const cookie = req.headers.cookie ?? "";
  const match = cookie.match(
    new RegExp(`${getSessionCookieName()}=([^;]+)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function getBearerToken(req: NextApiRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export async function requireApiUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<RequestUser | null> {
  try {
    // 1. Check API Key authentication
    const apiKeyHeader = req.headers["x-api-key"];
    const bearerToken = getBearerToken(req);
    const providedKey = (typeof apiKeyHeader === "string" ? apiKeyHeader : bearerToken) || null;

    if (providedKey && providedKey.startsWith("lh_")) {
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { key: providedKey },
        include: { user: true },
      });
      if (apiKeyRecord?.user) {
        return {
          id: apiKeyRecord.user.id,
          email: apiKeyRecord.user.email,
          role: apiKeyRecord.user.role as AppRole,
        };
      }
    }

    // 2. Cookie authentication
    const token = getCookieToken(req);
    const user = token ? await getUserFromSessionToken(token) : null;

    if (!user) {
      res.status(401).json({ error: "Sesi telah berakhir atau tidak valid. Silakan login kembali." });
      return null;
    }

    return { id: user.id, email: user.email, role: user.role as AppRole };
  } catch (error: any) {
    console.error("Auth check failed:", error);
    res.status(503).json({ error: "Koneksi ke database terputus. Silakan coba lagi dalam beberapa detik." });
    return null;
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
