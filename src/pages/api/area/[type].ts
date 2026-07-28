import { NextApiRequest, NextApiResponse } from "next";
import { getProvinces, getRegencies, getDistricts, getVillages } from "idn-area-data";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type, code } = req.query;

  try {
    if (type === "provinces") {
      const data = await getProvinces();
      return res.status(200).json(data);
    }
    
    if (type === "regencies") {
      const data = await getRegencies();
      if (code) {
        return res.status(200).json(data.filter((r) => r.province_code === code));
      }
      return res.status(200).json(data);
    }
    
    if (type === "districts") {
      const data = await getDistricts();
      if (code) {
        return res.status(200).json(data.filter((d) => d.regency_code === code));
      }
      return res.status(200).json(data);
    }

    if (type === "villages") {
      const data = await getVillages();
      if (code) {
        return res.status(200).json(data.filter((v) => v.district_code === code));
      }
      return res.status(200).json(data);
    }

    return res.status(404).json({ message: "Type not found" });
  } catch (error) {
    console.error("Error fetching idn-area-data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
