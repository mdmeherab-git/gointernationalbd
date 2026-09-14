"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/components/admin/api";
import { useAdminLang } from "@/components/admin/AdminShell";
import {
  Card,
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  UserAvatar,
} from "@/components/admin/widgets";

type Stats = {
  circularsTotal: number;
  circularsActive: number;
  circularsInactive: number;
  totalVacancies: number;
  noticesActive: number;
  noticesTotal: number;
  applicationsTotal: number;
  applicationsNew: number;
  usersTotal: number;
  usersActive: number;
  usersDisabled: number;
  usersNewToday: number;
};

type Circular = {
  id: string;
  country: string;
  flag: string;
  title: string;
  salary: string;
  vacancy: number;
  status: string;
  posted: string;
};

type Application = {
  id: string;
  applicant_name: string;
  job_title: string;
  job_country: string;
  status: string;
  created_at: string;
};

type RecentUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  profile_photo_key: string;
  status: string;
  created_at: string;
};

export default function AdminOverview() {
  const { t, isBn } = useAdminLang();
  const [stats, setStats] = useState<Stats | null>(null);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [usersError, setUsersError] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGet<{ stats: Stats }>("/api/admin/stats")
        .then((d) => setStats(d.stats))
        .catch(() => setStatsError(true)),
      apiGet<{ circulars: Circular[] }>("/api/admin/circulars")
        .then((d) => setCirculars(d.circulars.slice(0, 6)))
        .catch(() => {}),
      apiGet<{ applications: Application[] }>("/api/admin/applications")
        .then((d) => setApps(d.applications.slice(0, 6)))
        .catch(() => {}),
      apiGet<{ users: RecentUser[] }>("/api/admin/users?status=active&page=1&limit=5")
        .then((d) => setRecentUsers(d.users))
        .catch(() => setUsersError(true)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title={t("আজকের ওভারভিউ", "Today's Overview")}
        subtitle={t(
          "চাকরি, নোটিশ ও আবেদন — সব এক নজরে।",
          "Jobs, notices and applications at a glance.",
        )}
        action={
          <div className="flex gap-2">
            <Link
              href="/admin/circulars"
              className="rounded-xl bg-[#0B4DBB] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#093f98]"
            >
              + {t("সার্কুলার", "Circular")}
            </Link>
            <Link
              href="/admin/notices"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              + {t("নোটিশ", "Notice")}
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("মোট সার্কুলার", "Total Circulars")}
          value={loading ? "—" : (stats?.circularsTotal ?? 0)}
          hint={t(
            `${stats?.circularsActive ?? 0} টি সক্রিয়`,
            `${stats?.circularsActive ?? 0} active`,
          )}
          icon="📄"
          tone="blue"
        />
        <StatCard
          label={t("সক্রিয় সার্কুলার", "Active Circulars")}
          value={loading ? "—" : (stats?.circularsActive ?? 0)}
          hint={t(
            `${stats?.circularsInactive ?? 0} টি নিষ্ক্রিয়`,
            `${stats?.circularsInactive ?? 0} inactive`,
          )}
          icon="✅"
          tone="green"
        />
        <StatCard
          label={t("মোট পদসংখ্যা", "Total Vacancies")}
          value={loading ? "—" : (stats?.totalVacancies ?? 0)}
          hint={t("সক্রিয় সার্কুলারে", "across active circulars")}
          icon="👥"
          tone="purple"
        />
        <StatCard
          label={t("নতুন আবেদন", "New Applications")}
          value={loading ? "—" : (stats?.applicationsNew ?? 0)}
          hint={t(
            `${stats?.applicationsTotal ?? 0} টি মোট`,
            `${stats?.applicationsTotal ?? 0} total`,
          )}
          icon="📥"
          tone="orange"
        />
      </div>

      {/* User statistics */}
      <section className="mt-7">
        <h3 className="mb-3 text-lg font-extrabold text-[#0B2A55]">
          {t("ইউজার পরিসংখ্যান", "User Statistics")}
        </h3>
        {statsError ? (
          <Card className="p-5 text-center text-sm text-red-600">
            {t("ডাটা লোড করা যায়নি", "Unable to load")}
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t("মোট ইউজার", "Total Users")}
              value={loading ? "—" : (stats?.usersTotal ?? 0)}
              icon="👥"
              tone="blue"
            />
            <StatCard
              label={t("সক্রিয় ইউজার", "Active Users")}
              value={loading ? "—" : (stats?.usersActive ?? 0)}
              icon="🟢"
              tone="green"
            />
            <StatCard
              label={t("নিষ্ক্রিয় ইউজার", "Disabled Users")}
              value={loading ? "—" : (stats?.usersDisabled ?? 0)}
              icon="🔴"
              tone="orange"
            />
            <StatCard
              label={t("আজকের নতুন ইউজার", "Today's New Users")}
              value={loading ? "—" : (stats?.usersNewToday ?? 0)}
              icon="🆕"
              tone="purple"
            />
          </div>
        )}
      </section>

      {/* Recent circulars */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#0B2A55]">
            {t("সাম্প্রতিক সার্কুলার", "Recent Circulars")}
          </h3>
          <Link
            href="/admin/circulars"
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            {t("সব দেখুন →", "View all →")}
          </Link>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">{t("দেশ", "Country")}</th>
                  <th className="px-5 py-3">{t("পদ", "Position")}</th>
                  <th className="px-5 py-3">{t("বেতন", "Salary")}</th>
                  <th className="px-5 py-3">{t("পদসংখ্যা", "Vacancy")}</th>
                  <th className="px-5 py-3">{t("স্ট্যাটাস", "Status")}</th>
                </tr>
              </thead>
              <tbody>
                {circulars.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-3">
                      <span className="mr-2">{c.flag}</span>
                      {c.country}
                    </td>
                    <td className="px-5 py-3 font-semibold">{c.title}</td>
                    <td className="px-5 py-3">{c.salary}</td>
                    <td className="px-5 py-3">{c.vacancy}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && circulars.length === 0 && (
            <EmptyState text={t("কোনো সার্কুলার নেই", "No circulars yet")} />
          )}
        </Card>
      </section>

      {/* Recent applications */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#0B2A55]">
            {t("সাম্প্রতিক আবেদন", "Recent Applications")}
          </h3>
          <Link
            href="/admin/applications"
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            {t("সব দেখুন →", "View all →")}
          </Link>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">{t("নাম", "Name")}</th>
                  <th className="px-5 py-3">{t("পদ", "Position")}</th>
                  <th className="px-5 py-3">{t("দেশ", "Country")}</th>
                  <th className="px-5 py-3">{t("তারিখ", "Date")}</th>
                  <th className="px-5 py-3">{t("স্ট্যাটাস", "Status")}</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-3 font-semibold">{a.applicant_name}</td>
                    <td className="px-5 py-3">{a.job_title || "—"}</td>
                    <td className="px-5 py-3">{a.job_country || "—"}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {(a.created_at || "").slice(0, 10)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && apps.length === 0 && (
            <EmptyState
              text={t("এখনো কোনো আবেদন আসেনি", "No applications received yet")}
            />
          )}
        </Card>
      </section>

      {/* Recent active users */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#0B2A55]">
            {t("সাম্প্রতিক Active Users", "Recent Active Users")}
          </h3>
          <Link
            href="/admin/users"
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            {t("সব দেখুন →", "View all →")}
          </Link>
        </div>
        {usersError ? (
          <Card className="p-5 text-center text-sm text-red-600">
            {t("ডাটা লোড করা যায়নি", "Unable to load")}
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">{t("প্রোফাইল", "Profile")}</th>
                    <th className="px-5 py-3">{t("নাম", "Name")}</th>
                    <th className="px-5 py-3">{t("মোবাইল", "Mobile")}</th>
                    <th className="px-5 py-3">Gmail</th>
                    <th className="px-5 py-3">{t("নিবন্ধনের তারিখ", "Registration Date")}</th>
                    <th className="px-5 py-3">{t("স্ট্যাটাস", "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-5 py-3">
                        <UserAvatar user={u} />
                      </td>
                      <td className="px-5 py-3 font-semibold">{u.name}</td>
                      <td className="px-5 py-3">{u.phone}</td>
                      <td className="px-5 py-3">{u.email || "—"}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {(u.created_at || "").slice(0, 10)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={u.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && recentUsers.length === 0 && (
              <EmptyState text={t("কোনো Active User নেই", "No active users yet")} />
            )}
          </Card>
        )}
      </section>

      <p className="mt-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} GO International BD.{" "}
        {isBn ? "সকল অধিকার সংরক্ষিত।" : "All rights reserved."}
      </p>
    </>
  );
}
