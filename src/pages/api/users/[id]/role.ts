import { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/apiAuth";
import * as userRepo from "@/lib/repositories/userRepo";
import type { AppRole } from "@/types/invoice";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireApiUser(req, res);
    if (!user) return;

    const { id } = req.query;
    if (typeof id !== "string") {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (req.method === "PUT") {
      const { role } = req.body;
      if (!["owner", "admin", "manager", "user"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const updatedUser = await userRepo.updateUserRole(user, id, role as AppRole);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json(updatedUser);
    }

    res.setHeader("Allow", ["PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Cannot change") || error.message.includes("Only an owner")) {
      return res.status(403).json({ error: error.message });
    }
    console.error(`API error /users/[id]/role:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
}
