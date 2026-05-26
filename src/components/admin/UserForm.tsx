"use client";

import { useState } from "react";
import { createUser, updateUser } from "@/lib/actions/users";
import ImageUploader from "./ImageUploader";

type Role = { id: string; name: string; description: string | null };

export default function UserForm({
  initial,
  roles,
}: {
  initial?: {
    id: string;
    email: string;
    fullName: string;
    avatar: string | null;
    isActive: boolean;
    roleIds: string[];
  };
  roles: Role[];
}) {
  const [email, setEmail] = useState(initial?.email ?? "");
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [avatar, setAvatar] = useState<string | null>(initial?.avatar ?? null);
  const [roleIds, setRoleIds] = useState<string[]>(initial?.roleIds ?? []);

  function toggleRole(id: string) {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const action = initial ? updateUser : createUser;
  const payload = initial
    ? { id: initial.id, fullName, avatar: avatar || null, isActive, roleIds, password: password || undefined }
    : { email, fullName, avatar: avatar || null, password, isActive, roleIds };

  return (
    <form action={action}>
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3 rounded border bg-white p-4">
          <label className="block">
            <span className="text-sm font-medium">Email *</span>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              disabled={Boolean(initial)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Full name *</span>
            <input
              type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">
              {initial ? "New password (leave blank to keep current)" : "Password *"}
            </span>
            <input
              type="password" minLength={8} required={!initial}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
            {!initial && (
              <span className="mt-1 block text-xs text-slate-500">
                A welcome email will be sent to this address after creation.
              </span>
            )}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-sm">Active (can sign in)</span>
          </label>
        </div>

        <aside className="space-y-4">
          <div className="rounded border bg-white p-4">
            <ImageUploader
              value={avatar}
              album="avatars"
              alt={fullName}
              label="Avatar (optional)"
              onUploaded={(url) => setAvatar(url)}
            />
            {avatar && (
              <button type="button" onClick={() => setAvatar(null)} className="mt-2 text-xs text-red-600 hover:underline">
                Remove avatar
              </button>
            )}
          </div>
          <div className="rounded border bg-white p-4">
            <div className="text-sm font-medium">Roles</div>
            <div className="mt-2 space-y-1">
              {roles.map((r) => (
                <label key={r.id} className="flex items-start gap-2 rounded px-1 py-1 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={roleIds.includes(r.id)}
                    onChange={() => toggleRole(r.id)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">
                    <span className="font-medium">{r.name}</span>
                    {r.description && <span className="block text-xs text-slate-500">{r.description}</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Save
          </button>
        </aside>
      </div>
    </form>
  );
}
