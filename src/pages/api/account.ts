import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName } from "@/lib/authLocal";
import { v4 as uuidv4 } from "uuid";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const user = await requireApiUser(req, res);
    if (!user) return;

    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" }
    });

    return res.status(200).json({
      apiKey: apiKeyRecord?.key || null,
      mcpUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mcp`
    });
  }

  // Generate a new API Key
  if (req.method === "POST") {
    const user = await requireApiUser(req, res);
    if (!user) return;

    // Delete existing keys for this user to only have 1 active
    await prisma.apiKey.deleteMany({
      where: { user_id: user.id }
    });

    const newKey = `lh_${uuidv4().replace(/-/g, "")}`;
    const newApiKeyRecord = await prisma.apiKey.create({
      data: {
        id: uuidv4(),
        user_id: user.id,
        key: newKey,
        created_at: new Date().toISOString()
      }
    });

    return res.status(200).json({
      apiKey: newApiKeyRecord.key,
      mcpUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mcp`
    });
  }

  if (req.method === "DELETE") {
    const user = await requireApiUser(req, res);
    if (!user) return;

    await prisma.appUser.delete({ where: { id: user.id } });
    res.setHeader(
      "Set-Cookie",
      `${getSessionCookieName()}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );

    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}

