"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiGet, apiSend } from "./api";

/* ============================ language context ============================ */

type Lang = "bn" | "en";

type LangCtx = {
  lang: Lang;
  isBn: boolean;
  toggle: () => void;
  t: (bn: string, en: string) => string;
};

const Ctx = createContext<LangCtx | null>(null);

export function useAdminLang(): LangCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminLang must be used inside <AdminShell>");
  return v;
}

/* ================================ nav ==================================== */

const NAV: { href: string; icon: string; bn: string; en: string; badge?: "circ" | "notice" | "app" }[] = [
  { href: "/admin", icon: "📊", bn: "ড্যাশবোর্ড", en: "Dashboard" },
  { href: "/admin/circulars", icon: "📄", bn: "সার্কুলার", en: "Circulars", badge: "circ" },
  { href: "/admin/notices", icon: "📢", bn: "নোটিশ", en: "Notices", badge: "notice" },
  { href: "/admin/applications", icon: "👤", bn: "আবেদনসমূহ", en: "Applications", badge: "app" },
  { href: "/admin/popular-countries", icon: "🌍", bn: "জনপ্রিয় দেশ", en: "Popular Countries" },
  { href: "/admin/settings", icon: "⚙️", bn: "সেটিংস", en: "Settings" },
];

type Stats = {
  circularsActive: number;
  noticesActive: number;
  applicationsNew: number;
};

/* ============================== component =============================== */

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  const [lang, setLang] = useState<Lang>("bn");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dbReady, setDbReady] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gib_admin_lang");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "bn" || saved === "en") setLang(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (isLogin) return;
    apiGet<{ stats: Stats; dbReady: boolean }>("/api/admin/stats")
      .then((d) => {
        setStats(d.stats);
        setDbReady(d.dbReady);
      })
      .catch(() => {
        /* 401 handled inside apiGet */
      });
  }, [isLogin, pathname]);

  const ctx = useMemo<LangCtx>(
    () => ({
      lang,
      isBn: lang === "bn",
      toggle: () =>
        setLang((c) => {
          const next = c === "bn" ? "en" : "bn";
          try {
            localStorage.setItem("gib_admin_lang", next);
          } catch {
            /* ignore */
          }
          return next;
        }),
      t: (bn, en) => (lang === "bn" ? bn : en),
    }),
    [lang],
  );

  if (isLogin) {
    return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
  }

  const isBn = lang === "bn";
  const badgeFor = (b?: "circ" | "notice" | "app") => {
    if (!b || !stats) return null;
    const n =
      b === "circ" ? stats.circularsActive : b === "notice" ? stats.noticesActive : stats.applicationsNew;
    if (!n) return null;
    return (
      <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
        {n}
      </span>
    );
  };

  return (
    <Ctx.Provider value={ctx}>
      <div className="min-h-screen bg-[#f5f7fb] text-[#172033]">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-gray-200 bg-white transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex h-[72px] items-center border-b border-gray-100 px-5">
            <Link href="/admin" className="flex items-center gap-3">
              <img src="/logo.svg" alt="" className="h-9 w-auto" />
              <div>
                <div className="text-sm font-extrabold tracking-tight">
                  <span className="text-[#0B4DBB]">GO INTERNATIONAL</span>{" "}
                  <span className="text-red-500">BD</span>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  {isBn ? "অ্যাডমিন প্যানেল" : "Admin Panel"}
                </p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {isBn ? "মূল মেনু" : "Main Menu"}
            </p>
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-50 text-[#0B4DBB]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${
                      active ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {isBn ? item.bn : item.en}
                  {badgeFor(item.badge)}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-1 border-t border-gray-100 p-3">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              🌐 {isBn ? "ওয়েবসাইট দেখুন" : "View Website"}
            </Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  await apiSend("/api/admin/auth/logout", "POST");
                } catch {
                  /* ignore */
                }
                router.push("/admin/login");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              🚪 {isBn ? "লগ আউট" : "Log out"}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="lg:ml-[260px]">
          <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl lg:hidden"
                aria-label="Open menu"
              >
                ☰
              </button>
              <h1 className="text-base font-extrabold text-[#0B2A55] sm:text-lg">
                {isBn ? "অ্যাডমিন ড্যাশবোর্ড" : "Admin Dashboard"}
              </h1>
            </div>
            <button
              type="button"
              onClick={ctx.toggle}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-blue-300 hover:text-blue-600"
            >
              {isBn ? "English" : "বাংলা"}
            </button>
          </header>

          {dbReady === false && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 sm:px-6 lg:px-8">
              {isBn
                ? "Cloudflare D1 ডেটাবেস এখনো কনফিগার করা হয়নি — পরিবর্তন সেভ হবে না। SETUP_ADMIN.md দেখুন।"
                : "Cloudflare D1 database is not configured yet — changes will not be saved. See SETUP_ADMIN.md."}
            </div>
          )}

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </Ctx.Provider>
  );
}
