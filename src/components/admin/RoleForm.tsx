"use client";

import { useMemo, useState } from "react";
import { saveRole } from "@/lib/actions/roles";

type Permission = { id: string; key: string; module: string; action: string };

export default function RoleForm({
  initial,
  permissions,
}: {
  initial?: {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissionIds: string[];
  };
  permissions: Permission[];
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [perms, setPerms] = useState<Set<string>>(new Set(initial?.permissionIds ?? []));

  const isSystem = initial?.isSystem ?? false;

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of permissions) {
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  function toggle(id: string) {
    if (isSystem) return;
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleModule(modulePerms: Permission[]) {
    if (isSystem) return;
    setPerms((prev) => {
      const next = new Set(prev);
      const allSelected = modulePerms.every((p) => next.has(p.id));
      if (allSelected) modulePerms.forEach((p) => next.delete(p.id));
      else modulePerms.forEach((p) => next.add(p.id));
      return next;
    });
  }

  return (
    <form action={saveRole}>
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          id: initial?.id,
          name,
          description: description || undefined,
          permissionIds: Array.from(perms),
        })}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-3 rounded border bg-white p-4">
            <label className="block">
              <span className="text-sm font-medium">Role name *</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSystem}
                className="mt-1 w-full rounded border px-3 py-2 text-sm disabled:bg-slate-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Description</span>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </label>
            {isSystem && (
              <div className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
                This is a system role. Name and permissions cannot be modified — it always has full access.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Permissions</div>
            {grouped.map(([module, modulePerms]) => (
              <div key={module} className="rounded border bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{module}</div>
                  {!isSystem && (
                    <button
                      type="button"
                      onClick={() => toggleModule(modulePerms)}
                      className="text-xs text-brand-500 hover:underline"
                    >
                      Toggle all
                    </button>
                  )}
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {modulePerms.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 rounded px-1 py-1 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={isSystem ? true : perms.has(p.id)}
                        disabled={isSystem}
                        onChange={() => toggle(p.id)}
                      />
                      <span className="text-sm">{p.action}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded border bg-white p-4">
          <div className="text-sm">
            <div className="font-medium">Summary</div>
            <div className="mt-2 text-slate-600">
              {isSystem
                ? "All permissions (system role)"
                : `${perms.size} of ${permissions.length} permissions selected`}
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 w-full rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Save
          </button>
        </aside>
      </div>
    </form>
  );
}
