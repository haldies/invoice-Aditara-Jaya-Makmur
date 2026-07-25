import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import { requireApiUser } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireApiUser(req, res);
  if (!user) return;

  switch (req.method) {
    case "GET": {
      const apiKeyRecord = await prisma.apiKey.findFirst({
        where: { user_id: user.id },
      });
      return res.status(200).json({ apiKey: apiKeyRecord?.key || null });
    }

    case "POST": {
      // Delete existing API keys first to enforce single-active-key limit
      await prisma.apiKey.deleteMany({
        where: { user_id: user.id },
      });

      // Generate a new secure API Key
      const keyBytes = crypto.randomBytes(24).toString("hex");
      const newKey = `lh_${keyBytes}`;

      const created = await prisma.apiKey.create({
        data: {
          id: crypto.randomUUID(),
          user_id: user.id,
          key: newKey,
          created_at: new Date().toISOString(),
        },
      });

      return res.status(201).json({ apiKey: created.key });
    }

    case "DELETE": {
      await prisma.apiKey.deleteMany({
        where: { user_id: user.id },
      });
      return res.status(200).json({ success: true });
    }

    default:
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      return res.status(405).json({ error: "Method not allowed" });
  }
}
