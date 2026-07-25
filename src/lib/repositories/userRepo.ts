import { prisma } from "../prisma";
import type { AppUser, AppRole } from "@/types/invoice";
import type { RequestUser } from "@/lib/apiAuth";

export async function listUsers(actor: RequestUser): Promise<AppUser[]> {
  // Only owner or admin/manager can list users
  if (actor.role !== "owner" && actor.role !== "admin" && actor.role !== "manager") {
    throw new Error("Unauthorized");
  }

  const rows = await prisma.appUser.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      commission_rate: true,
      created_at: true,
    },
  });

  return rows.map(r => ({
    ...r,
    role: r.role as AppRole,
  }));
}

export async function updateUserRole(
  actor: RequestUser,
  targetUserId: string,
  newRole: AppRole
): Promise<AppUser | null> {
  if (actor.role !== "owner" && actor.role !== "admin" && actor.role !== "manager") {
    throw new Error("Unauthorized");
  }

  const targetUser = await prisma.appUser.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) return null;

  // Cannot change an owner's role unless you are an owner (actually, let's just prevent demoting owner at all)
  if (targetUser.role === "owner" && newRole !== "owner") {
    throw new Error("Cannot change the role of an owner");
  }

  // A manager/admin cannot promote someone to owner
  if (actor.role !== "owner" && newRole === "owner") {
    throw new Error("Only an owner can grant owner privileges");
  }

  const updated = await prisma.appUser.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: {
      id: true,
      email: true,
      role: true,
      commission_rate: true,
      created_at: true,
    },
  });

  return { ...updated, role: updated.role as AppRole };
}

export async function updateUserCommissionRate(
  actor: RequestUser,
  targetUserId: string,
  newRate: number
): Promise<AppUser | null> {
  if (actor.role !== "owner" && actor.role !== "admin" && actor.role !== "manager") {
    throw new Error("Unauthorized");
  }

  const updated = await prisma.appUser.update({
    where: { id: targetUserId },
    data: { commission_rate: newRate },
    select: {
      id: true,
      email: true,
      role: true,
      commission_rate: true,
      created_at: true,
    },
  });

  return { ...updated, role: updated.role as AppRole };
}
