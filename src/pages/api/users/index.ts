import { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/apiAuth";
import * as userRepo from "@/lib/repositories/userRepo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireApiUser(req, res);
    if (!user) return;

    if (req.method === "GET") {
      const users = await userRepo.listUsers(user);
      return res.status(200).json({ users });
    }

    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return res.status(403).json({ error: "Access denied" });
    }
    console.error("API error /users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
