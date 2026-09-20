"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: number;
  created_at: string;
};

const TYPE_ICON: Record<string, string> = {
  application: "💼",
  visa: "🛂",
  medical: "🩺",
  flight: "✈️",
  general: "🔔",
};

export default function AccountNotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Notification[]>([]);

  async function load() {
    const res = await fetch("/api/account/notifications", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/account/login");
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { notifications?: Notification[] };
    setItems(data.notifications ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    await fetch("/api/account/notifications/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    await fetch("/api/account/notifications/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/account" className="mb-4 inline-block text-sm font-semibold text-gray-500 hover:text-blue-600">
          ← ড্যাশবোর্ড / Dashboard
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-[#0B2A55]">🔔 নোটিফিকেশন / Notifications</h1>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                সব পড়া হয়েছে চিহ্নিত করুন / Mark all read
              </button>
            )}
          </div>

          {loading && <p className="py-6 text-center text-sm text-gray-400">লোড হচ্ছে... / Loading...</p>}

          {!loading && items.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-4xl">🔔</p>
              <p className="mt-3 text-sm text-gray-500">কোনো নোটিফিকেশন নেই / No notifications yet</p>
            </div>
          )}

          <div className="space-y-2">
            {items.map((n) => {
              const body = (
                <div
                  className={`rounded-xl border p-4 transition ${
                    n.is_read ? "border-gray-100 bg-white" : "border-blue-100 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{TYPE_ICON[n.type] ?? "🔔"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-[#0B2A55]">{n.title}</p>
                        {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                      <p className="mt-2 text-xs text-gray-400">{n.created_at?.slice(0, 19).replace("T", " ")}</p>
                    </div>
                  </div>
                </div>
              );

              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.is_read) markRead(n.id);
                    if (n.link) router.push(n.link);
                  }}
                  className="block w-full text-left"
                >
                  {body}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
