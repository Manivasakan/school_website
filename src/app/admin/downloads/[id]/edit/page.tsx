import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import DownloadForm from "@/components/admin/DownloadForm";

export default async function EditDownloadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Downloads.Manage");
  const { id } = await params;
  const dl = await prisma.download.findUnique({ where: { id } });
  if (!dl) notFound();
  return (
    <div>
      <h1 className="text-2xl font-bold">Edit download</h1>
      <div className="mt-6"><DownloadForm initial={dl} /></div>
    </div>
  );
}
