import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/apiAuth";
import { defaultCompanyProfile, type CompanyProfile } from "@/lib/companyProfile";

const companyProfileModel = (prisma as any).companyProfileSetting;

function toProfile(row: any): CompanyProfile {
  return {
    companyName: row.company_name,
    address: row.address,
    city: row.city,
    phone: row.phone,
    email: row.email,
    npwp: row.npwp,
    bankName: row.bank_name,
    bankAccount: row.bank_account,
    bankAccountHolder: row.bank_account_holder,
    logoBase64: row.logo_base64,
    logoRightBase64: row.logo_right_base64,
    signatureBase64: row.signature_base64,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireApiUser(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const row = await companyProfileModel.findFirst();
    return res.status(200).json({ profile: row ? toProfile(row) : defaultCompanyProfile });
  }

  if (req.method === "PUT") {
    const body = req.body as Partial<CompanyProfile>;
    const now = new Date().toISOString();
    const data = {
      company_name: body.companyName ?? defaultCompanyProfile.companyName,
      address: body.address ?? defaultCompanyProfile.address,
      city: body.city ?? defaultCompanyProfile.city,
      phone: body.phone ?? defaultCompanyProfile.phone,
      email: body.email ?? defaultCompanyProfile.email,
      npwp: body.npwp ?? defaultCompanyProfile.npwp,
      bank_name: body.bankName ?? defaultCompanyProfile.bankName,
      bank_account: body.bankAccount ?? defaultCompanyProfile.bankAccount,
      bank_account_holder: body.bankAccountHolder ?? defaultCompanyProfile.bankAccountHolder,
      logo_base64: body.logoBase64 ?? "",
      logo_right_base64: body.logoRightBase64 ?? "",
      signature_base64: body.signatureBase64 ?? "",
      updated_at: now,
    };

    const existing = await companyProfileModel.findFirst();
    const row = existing
      ? await companyProfileModel.update({
          where: { id: existing.id },
          data,
        })
      : await companyProfileModel.create({
          data: {
            id: crypto.randomUUID(),
            ...data,
            created_at: now,
          },
        });

    return res.status(200).json({ success: true, profile: toProfile(row) });
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).json({ error: "Method not allowed" });
}
