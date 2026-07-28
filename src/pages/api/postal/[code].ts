import { NextApiRequest, NextApiResponse } from "next";
// @ts-ignore
import { search } from "geografis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  try {
    const postalStr = code as string;
    if (postalStr.length !== 5) {
      return res.status(400).json({ message: "Invalid postal code" });
    }
    const result = search(postalStr);
    const exactMatches = (result.data || []).filter((item: any) => item.postal === parseInt(postalStr, 10));
    return res.status(200).json(exactMatches);
  } catch (error) {
    console.error("Error fetching postal code:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
