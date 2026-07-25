import { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/apiAuth";
import * as templateRepo from "@/lib/repositories/templateRepo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireApiUser(req, res);
    if (!user) return;
    const actor = { id: user.id, role: user.role };

    if (req.method === "GET") {
      const templates = await templateRepo.listTemplates(actor);
      return res.status(200).json({ templates });
    }

    if (req.method === "POST") {
      const data = req.body;
      if (!data.name || !data.html_content) {
        return res.status(400).json({ error: "Name and HTML content are required" });
      }
      const template = await templateRepo.createTemplate(actor, data);
      return res.status(201).json(template);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error("API error /templates:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
