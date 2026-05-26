import { prisma } from "./prisma";
import { auth } from "./auth";

export async function logAudit(opts: {
  action: string;
  entity?: string;
  entityId?: string;
  meta?: unknown;
}) {
  const session = await auth();
  try {
    await prisma.auditLog.create({
      data: {
        userId: session?.user?.id ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        meta: opts.meta ? JSON.stringify(opts.meta).slice(0, 4000) : null,
      },
    });
  } catch {
    // Don't fail the parent operation if audit logging fails.
  }
}
