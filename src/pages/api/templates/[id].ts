import { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/apiAuth";
import * as templateRepo from "@/lib/repositories/templateRepo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireApiUser(req, res);
    if (!user) return;
    const actor = { id: user.id, role: user.role };
    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    if (req.method === "GET") {
      const template = await templateRepo.findTemplateById(actor, id);
      if (!template) return res.status(404).json({ error: "Template not found" });
      return res.status(200).json(template);
    }

    if (req.method === "PUT") {
      const data = req.body;
      const updated = await templateRepo.updateTemplate(actor, id, data);
      if (!updated) return res.status(404).json({ error: "Template not found or could not be updated" });
      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      const success = await templateRepo.deleteTemplate(actor, id);
      if (!success) return res.status(404).json({ error: "Template not found" });
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error(`API error /templates/[id]:`, error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
