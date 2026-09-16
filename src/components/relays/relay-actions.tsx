"use client";

import { FormEvent, useState } from "react";
import {
  Pencil,
  Power,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type RelayActionsProps = {
  relay: {
    id: number;
    name: string;
    destinationUrl: string;
    active: boolean;
  };
};

export function RelayActions({
  relay,
}: RelayActionsProps) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(relay.name);
  const [destinationUrl, setDestinationUrl] = useState(
    relay.destinationUrl
  );

  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function updateRelay(data: Record<string, unknown>) {
    const response = await fetch(`/api/relays/${relay.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to update relay"
      );
    }

    return result;
  }

  async function handleToggle() {
    setToggling(true);
    setError("");

    try {
      await updateRelay({
        active: !relay.active,
      });

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update relay"
      );
    } finally {
      setToggling(false);
    }
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      await updateRelay({
        name,
        destinationUrl,
      });

      setEditing(false);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update relay"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${relay.name}"?\n\nIts execution history will also be deleted.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/relays/${relay.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to delete relay"
        );
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete relay"
      );

      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleToggle}
          disabled={toggling}
          className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
            relay.active
              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          <Power className="h-4 w-4" />

          {toggling
            ? "Updating..."
            : relay.active
              ? "Deactivate"
              : "Activate"}
        </button>

        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />

          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Edit Relay
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the relay configuration.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="p-6"
            >
              <div>
                <label
                  htmlFor="relay-name"
                  className="text-sm font-medium text-slate-700"
                >
                  Relay name
                </label>

                <input
                  id="relay-name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="destination-url"
                  className="text-sm font-medium text-slate-700"
                >
                  Destination URL
                </label>

                <input
                  id="destination-url"
                  type="url"
                  value={destinationUrl}
                  onChange={(event) =>
                    setDestinationUrl(event.target.value)
                  }
                  required
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div className="mt-7 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}