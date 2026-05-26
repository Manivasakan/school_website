import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { getEnabledLanguages } from "@/lib/i18n";
import EventForm from "@/components/admin/EventForm";

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Events.Manage");
  const languages = await getEnabledLanguages();

  return (
    <div>
      <h1 className="text-2xl font-bold">New event</h1>
      <div className="mt-6">
        <EventForm languages={languages.map((l) => ({ code: l.code, nativeName: l.nativeName }))} />
      </div>
    </div>
  );
}
