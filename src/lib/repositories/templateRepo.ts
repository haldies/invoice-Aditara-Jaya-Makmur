import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { InvoiceTemplate, InvoiceTemplateInput, AppRole } from "../../types/invoice";

export interface Actor {
  id: string;
  role: AppRole;
}

function canManageAll(role: AppRole) {
  return role === "owner" || role === "manager" || role === "admin";
}

function ownershipWhere(actor: Actor): Prisma.InvoiceTemplateWhereInput {
  return canManageAll(actor.role) ? {} : { user_id: actor.id };
}

export async function listTemplates(actor: Actor): Promise<InvoiceTemplate[]> {
  const rows = await prisma.invoiceTemplate.findMany({
    where: ownershipWhere(actor),
    orderBy: { created_at: "desc" },
  });
  return rows;
}

export async function findTemplateById(actor: Actor, id: string): Promise<InvoiceTemplate | null> {
  return prisma.invoiceTemplate.findFirst({
    where: { id, ...ownershipWhere(actor) },
  });
}

export async function createTemplate(actor: Actor, data: InvoiceTemplateInput): Promise<InvoiceTemplate> {
  const now = new Date().toISOString();

  if (data.is_default) {
    await prisma.invoiceTemplate.updateMany({
      where: { user_id: actor.id },
      data: { is_default: false },
    });
  }

  return prisma.invoiceTemplate.create({
    data: {
      user_id: actor.id,
      name: data.name.trim(),
      html_content: data.html_content,
      is_default: data.is_default ?? false,
      created_at: now,
      updated_at: now,
    },
  });
}

export async function updateTemplate(
  actor: Actor,
  id: string,
  data: Partial<InvoiceTemplateInput>
): Promise<InvoiceTemplate | null> {
  const existing = await findTemplateById(actor, id);
  if (!existing) return null;

  if (data.is_default) {
    await prisma.invoiceTemplate.updateMany({
      where: { user_id: actor.id, id: { not: id } },
      data: { is_default: false },
    });
  }

  return prisma.invoiceTemplate.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.html_content !== undefined ? { html_content: data.html_content } : {}),
      ...(data.is_default !== undefined ? { is_default: data.is_default } : {}),
      updated_at: new Date().toISOString(),
    },
  });
}

export async function deleteTemplate(actor: Actor, id: string): Promise<boolean> {
  const result = await prisma.invoiceTemplate.deleteMany({
    where: { id, ...ownershipWhere(actor) },
  });
  return result.count > 0;
}
