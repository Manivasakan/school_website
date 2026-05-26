import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import DownloadForm from "@/components/admin/DownloadForm";

export default async function NewDownloadPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Downloads.Manage");
  return (
    <div>
      <h1 className="text-2xl font-bold">New download</h1>
      <div className="mt-6"><DownloadForm /></div>
    </div>
  );
}
