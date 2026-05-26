import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { getEnabledLanguages } from "@/lib/i18n";
import EventForm from "@/components/admin/EventForm";
import { deleteEvent } from "@/lib/actions/events";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Events.Manage");
  const { id } = await params;

  const [event, languages] = await Promise.all([
    prisma.event.findUnique({ where: { id }, include: { translations: true } }),
    getEnabledLanguages(),
  ]);
  if (!event) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit event</h1>
        <form action={deleteEvent}>
          <input type="hidden" name="id" value={event.id} />
          <button type="submit" className="text-sm text-red-600 hover:underline">Delete</button>
        </form>
      </div>
      <div className="mt-6">
        <EventForm
          initial={{
            id: event.id,
            slug: event.slug,
            // Send ISO strings so the client form can convert to local time.
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt ? event.endsAt.toISOString() : null,
            location: event.location,
            isPublished: event.isPublished,
            translations: event.translations.map((t) => ({
              languageCode: t.languageCode,
              title: t.title,
              description: t.description ?? "",
            })),
          }}
          languages={languages.map((l) => ({ code: l.code, nativeName: l.nativeName }))}
        />
      </div>
    </div>
  );
}
