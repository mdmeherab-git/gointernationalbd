"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Circular = {
  id: number;
  country: string;
  flag: string;
  title: string;
  category: string;
  salary: string;
  vacancy: number;
  deadline: string;
  status: "Active" | "Inactive";
  posted: string;
};

type Notice = {
  id: number;
  bn: string;
  en: string;
  status: "Active" | "Inactive";
};

/* =========================================================
   DEMO DATA
   পরে API / DATABASE থেকে এই data আসবে
========================================================= */

const circulars: Circular[] = [
  {
    id: 1,
    country: "Saudi Arabia",
    flag: "🇸🇦",
    title: "Driver",
    category: "Driver",
    salary: "SAR 1,500",
    vacancy: 20,
    deadline: "30 Aug 2026",
    status: "Active",
    posted: "19 Aug 2026",
  },
  {
    id: 2,
    country: "Saudi Arabia",
    flag: "🇸🇦",
    title: "Factory Worker",
    category: "Factory Worker",
    salary: "SAR 1,300",
    vacancy: 50,
    deadline: "02 Sep 2026",
    status: "Active",
    posted: "19 Aug 2026",
  },
  {
    id: 3,
    country: "Malaysia",
    flag: "🇲🇾",
    title: "Factory Worker",
    category: "Factory Worker",
    salary: "RM 1,700",
    vacancy: 100,
    deadline: "10 Sep 2026",
    status: "Active",
    posted: "19 Aug 2026",
  },
  {
    id: 4,
    country: "UAE",
    flag: "🇦🇪",
    title: "Electrician",
    category: "Electrician",
    salary: "AED 1,500",
    vacancy: 30,
    deadline: "08 Sep 2026",
    status: "Inactive",
    posted: "18 Aug 2026",
  },
];

const notices: Notice[] = [
  {
    id: 1,
    bn: "সৌদি আরবের নতুন চাকরির সার্কুলার প্রকাশিত হয়েছে।",
    en: "A new Saudi Arabia job circular has been published.",
    status: "Active",
  },
  {
    id: 2,
    bn: "আবেদন করার আগে সার্কুলারের সকল শর্ত যাচাই করুন।",
    en: "Please verify all circular requirements before applying.",
    status: "Active",
  },
  {
    id: 3,
    bn: "নতুন চাকরির সুযোগ পেতে নিয়মিত Jobs page দেখুন।",
    en: "Check the Jobs page regularly for new opportunities.",
    status: "Inactive",
  },
];

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<"bn" | "en">("bn");

  const isBangla = language === "bn";

  const activeCirculars = useMemo(
    () => circulars.filter((item) => item.status === "Active").length,
    []
  );

  const inactiveCirculars = useMemo(
    () => circulars.filter((item) => item.status === "Inactive").length,
    []
  );

  const activeNotices = useMemo(
    () => notices.filter((item) => item.status === "Active").length,
    []
  );

  const totalVacancy = useMemo(
    () => circulars.reduce((total, item) => total + item.vacancy, 0),
    []
  );

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#172033]">

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-gray-200 bg-white transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >

        {/* LOGO */}

        <div className="flex h-[76px] items-center border-b border-gray-100 px-5">

          <Link
            href="/"
            className="flex items-center gap-3"
          >

            <div className="flex h-11 w-14 items-center justify-center">

              <img
                src="/logo.svg"
                alt="GO International BD"
                className="max-h-11 w-auto object-contain"
              />

            </div>

            <div>

              <div className="text-sm font-extrabold tracking-tight">

                <span className="text-[#0B4DBB]">
                  GO INTERNATIONAL
                </span>{" "}

                <span className="text-red-500">
                  BD
                </span>

              </div>

              <p className="mt-0.5 text-[10px] text-gray-500">
                Admin Panel
              </p>

            </div>

          </Link>

        </div>


        {/* MENU */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">

          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {isBangla ? "মূল মেনু" : "Main Menu"}
          </p>


          {/* DASHBOARD */}

          <Link
            href="/admin"
            onClick={() => setSidebarOpen(false)}
            className="mb-1 flex items-center gap-3 rounded-xl bg-blue-50 px-3 py-3 text-sm font-bold text-[#0B4DBB]"
          >

            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              📊
            </span>

            {isBangla ? "ড্যাশবোর্ড" : "Dashboard"}

          </Link>


          {/* CIRCULAR */}

          <Link
            href="/admin/circulars"
            onClick={() => setSidebarOpen(false)}
            className="mb-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >

            <span className="flex items-center gap-3">

              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                📄
              </span>

              {isBangla
                ? "সার্কুলার"
                : "Circulars"}

            </span>

            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
              {circulars.length}
            </span>

          </Link>


          {/* NOTICE */}

          <Link
            href="/admin/notices"
            onClick={() => setSidebarOpen(false)}
            className="mb-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >

            <span className="flex items-center gap-3">

              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                📢
              </span>

              {isBangla
                ? "নোটিশ"
                : "Notices"}

            </span>

            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">
              {activeNotices}
            </span>

          </Link>


          {/* APPLICATIONS */}

          <Link
            href="/admin/applications"
            onClick={() => setSidebarOpen(false)}
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >

            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              👤
            </span>

            {isBangla
              ? "আবেদনসমূহ"
              : "Applications"}

          </Link>


          <div className="my-5 border-t border-gray-100" />

          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {isBangla ? "সিস্টেম" : "System"}
          </p>


          {/* USERS */}

          <Link
            href="/admin/users"
            onClick={() => setSidebarOpen(false)}
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >

            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              👥
            </span>

            {isBangla
              ? "ইউজার"
              : "Users"}

          </Link>


          {/* SETTINGS */}

          <Link
            href="/admin/settings"
            onClick={() => setSidebarOpen(false)}
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >

            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              ⚙️
            </span>

            {isBangla
              ? "সেটিংস"
              : "Settings"}

          </Link>

        </nav>


        {/* SIDEBAR BOTTOM */}

        <div className="border-t border-gray-100 p-4">

          <Link
            href="/jobs"
            className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >

            <span>
              🌐
            </span>

            {isBangla
              ? "ওয়েবসাইট দেখুন"
              : "View Website"}

          </Link>

        </div>

      </aside>


      {/* =====================================================
          MAIN AREA
      ====================================================== */}

      <div className="lg:ml-[260px]">

        {/* TOP BAR */}

        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl lg:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div>

              <h1 className="text-lg font-extrabold text-[#0B2A55] sm:text-xl">

                {isBangla
                  ? "অ্যাডমিন ড্যাশবোর্ড"
                  : "Admin Dashboard"}

              </h1>

              <p className="hidden text-xs text-gray-500 sm:block">

                {isBangla
                  ? "GO International BD পরিচালনা করুন"
                  : "Manage GO International BD"}

              </p>

            </div>

          </div>


          <div className="flex items-center gap-2 sm:gap-3">

            {/* LANGUAGE */}

            <button
              type="button"
              onClick={() =>
                setLanguage((current) =>
                  current === "bn" ? "en" : "bn"
                )
              }
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-blue-300 hover:text-blue-600"
            >
              {isBangla ? "English" : "বাংলা"}
            </button>


            {/* WEBSITE */}

            <Link
              href="/jobs"
              className="hidden rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:border-blue-300 hover:text-blue-600 sm:block"
            >
              🌐 {isBangla ? "ওয়েবসাইট" : "Website"}
            </Link>


            {/* ADMIN */}

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg">
              👨‍💼
            </div>

          </div>

        </header>


        {/* ===================================================
            CONTENT
        ==================================================== */}

        <div className="p-4 sm:p-6 lg:p-8">

          {/* WELCOME */}

          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <p className="text-sm font-semibold text-blue-600">
                {isBangla
                  ? "স্বাগতম 👋"
                  : "Welcome back 👋"}
              </p>

              <h2 className="mt-1 text-2xl font-extrabold text-[#0B2A55] sm:text-3xl">

                {isBangla
                  ? "আজকের ওভারভিউ"
                  : "Today's Overview"}

              </h2>

              <p className="mt-2 text-sm text-gray-500">

                {isBangla
                  ? "আপনার ওয়েবসাইটের চাকরি ও নোটিশ সেকশন এখান থেকে পরিচালনা করুন।"
                  : "Manage your website jobs and notices from here."}

              </p>

            </div>


            {/* QUICK ADD */}

            <div className="flex gap-2">

              <Link
                href="/admin/circulars"
                className="rounded-xl bg-[#0B4DBB] px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#093f98]"
              >
                + {isBangla
                  ? "সার্কুলার যোগ"
                  : "Add Circular"}
              </Link>

              <Link
                href="/admin/notices"
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                + {isBangla
                  ? "নোটিশ যোগ"
                  : "Add Notice"}
              </Link>

            </div>

          </div>


          {/* =================================================
              STAT CARDS
          ================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* TOTAL */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-semibold text-gray-500">
                    {isBangla
                      ? "মোট সার্কুলার"
                      : "Total Circulars"}
                  </p>

                  <h3 className="mt-2 text-3xl font-extrabold text-[#0B2A55]">
                    {circulars.length}
                  </h3>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                  📄
                </div>

              </div>

              <p className="mt-4 text-xs text-gray-500">

                {isBangla
                  ? `${activeCirculars} টি বর্তমানে সক্রিয়`
                  : `${activeCirculars} currently active`}

              </p>

            </div>


            {/* ACTIVE */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-semibold text-gray-500">
                    {isBangla
                      ? "সক্রিয় সার্কুলার"
                      : "Active Circulars"}
                  </p>

                  <h3 className="mt-2 text-3xl font-extrabold text-green-600">
                    {activeCirculars}
                  </h3>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-xl">
                  ✓
                </div>

              </div>

              <p className="mt-4 text-xs text-gray-500">

                {isBangla
                  ? `${inactiveCirculars} টি নিষ্ক্রিয়`
                  : `${inactiveCirculars} inactive`}

              </p>

            </div>


            {/* VACANCY */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-semibold text-gray-500">
                    {isBangla
                      ? "মোট পদসংখ্যা"
                      : "Total Vacancies"}
                  </p>

                  <h3 className="mt-2 text-3xl font-extrabold text-purple-600">
                    {totalVacancy}
                  </h3>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-xl">
                  👥
                </div>

              </div>

              <p className="mt-4 text-xs text-gray-500">

                {isBangla
                  ? "সকল সক্রিয়/নিষ্ক্রিয় সার্কুলার"
                  : "Across all circulars"}

              </p>

            </div>


            {/* NOTICES */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-semibold text-gray-500">
                    {isBangla
                      ? "সক্রিয় নোটিশ"
                      : "Active Notices"}
                  </p>

                  <h3 className="mt-2 text-3xl font-extrabold text-orange-500">
                    {activeNotices}
                  </h3>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
                  📢
                </div>

              </div>

              <p className="mt-4 text-xs text-gray-500">

                {isBangla
                  ? `${notices.length} টি মোট নোটিশ`
                  : `${notices.length} total notices`}

              </p>

            </div>

          </div>


          {/* =================================================
              QUICK ACTIONS
          ================================================== */}

          <section className="mt-7">

            <div className="mb-4">

              <h2 className="text-lg font-extrabold text-[#0B2A55]">
                {isBangla
                  ? "দ্রুত কাজ"
                  : "Quick Actions"}
              </h2>

            </div>


            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <Link
                href="/admin/circulars"
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  📄
                </div>

                <h3 className="mt-4 font-bold">
                  {isBangla
                    ? "সার্কুলার পরিচালনা"
                    : "Manage Circulars"}
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {isBangla
                    ? "নতুন সার্কুলার যোগ, এডিট বা মুছে ফেলুন।"
                    : "Add, edit or remove job circulars."}
                </p>

                <span className="mt-4 inline-block text-xs font-bold text-blue-600">
                  {isBangla ? "খুলুন →" : "Open →"}
                </span>

              </Link>


              <Link
                href="/admin/notices"
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                  📢
                </div>

                <h3 className="mt-4 font-bold">
                  {isBangla
                    ? "নোটিশ পরিচালনা"
                    : "Manage Notices"}
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {isBangla
                    ? "Notice Board-এর লেখা যোগ বা পরিবর্তন করুন।"
                    : "Add or edit Notice Board messages."}
                </p>

                <span className="mt-4 inline-block text-xs font-bold text-orange-600">
                  {isBangla ? "খুলুন →" : "Open →"}
                </span>

              </Link>


              <Link
                href="/admin/applications"
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                  👤
                </div>

                <h3 className="mt-4 font-bold">
                  {isBangla
                    ? "আবেদন দেখুন"
                    : "View Applications"}
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {isBangla
                    ? "চাকরির আবেদনগুলো পরবর্তীতে এখান থেকে পরিচালনা করা যাবে।"
                    : "Manage job applications from here."}
                </p>

                <span className="mt-4 inline-block text-xs font-bold text-green-600">
                  {isBangla ? "খুলুন →" : "Open →"}
                </span>

              </Link>


              <Link
                href="/admin/settings"
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-md"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-2xl">
                  ⚙️
                </div>

                <h3 className="mt-4 font-bold">
                  {isBangla
                    ? "সেটিংস"
                    : "Settings"}
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {isBangla
                    ? "ওয়েবসাইটের প্রশাসনিক সেটিংস পরিচালনা করুন।"
                    : "Manage administrative settings."}
                </p>

                <span className="mt-4 inline-block text-xs font-bold text-purple-600">
                  {isBangla ? "খুলুন →" : "Open →"}
                </span>

              </Link>

            </div>

          </section>


          {/* =================================================
              RECENT CIRCULARS
          ================================================== */}

          <section className="mt-7">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-extrabold text-[#0B2A55]">
                  {isBangla
                    ? "সাম্প্রতিক সার্কুলার"
                    : "Recent Circulars"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {isBangla
                    ? "সর্বশেষ যোগ করা সার্কুলারসমূহ"
                    : "Recently added circulars"}
                </p>

              </div>

              <Link
                href="/admin/circulars"
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                {isBangla
                  ? "সব দেখুন →"
                  : "View All →"}
              </Link>

            </div>


            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[760px]">

                  <thead>

                    <tr className="border-b border-gray-100 bg-gray-50">

                      <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        {isBangla
                          ? "দেশ"
                          : "Country"}
                      </th>

                      <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        {isBangla
                          ? "পদ"
                          : "Position"}
                      </th>

                      <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        {isBangla
                          ? "বেতন"
                          : "Salary"}
                      </th>

                      <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        {isBangla
                          ? "পদসংখ্যা"
                          : "Vacancy"}
                      </th>

                      <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        {isBangla
                          ? "স্ট্যাটাস"
                          : "Status"}
                      </th>

                      <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        {isBangla
                          ? "অ্যাকশন"
                          : "Action"}
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {circulars.map((item) => (

                      <tr
                        key={item.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <span className="text-2xl">
                              {item.flag}
                            </span>

                            <div>

                              <p className="text-sm font-bold">
                                {item.country}
                              </p>

                              <p className="text-[11px] text-gray-500">
                                {item.posted}
                              </p>

                            </div>

                          </div>

                        </td>


                        <td className="px-5 py-4">

                          <p className="text-sm font-semibold">
                            {item.title}
                          </p>

                          <p className="mt-0.5 text-[11px] text-gray-500">
                            {item.category}
                          </p>

                        </td>


                        <td className="px-5 py-4">

                          <span className="text-sm font-bold text-gray-800">
                            {item.salary}
                          </span>

                        </td>


                        <td className="px-5 py-4">

                          <span className="text-sm font-bold">
                            {item.vacancy}
                          </span>

                        </td>


                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              item.status === "Active"
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >

                            {item.status === "Active"
                              ? isBangla
                                ? "সক্রিয়"
                                : "Active"
                              : isBangla
                                ? "নিষ্ক্রিয়"
                                : "Inactive"}

                          </span>

                        </td>


                        <td className="px-5 py-4 text-right">

                          <Link
                            href="/admin/circulars"
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-blue-200 hover:text-blue-600"
                          >
                            {isBangla
                              ? "ম্যানেজ"
                              : "Manage"}
                          </Link>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          </section>


          {/* =================================================
              NOTICE PREVIEW
          ================================================== */}

          <section className="mt-7">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-extrabold text-[#0B2A55]">
                  {isBangla
                    ? "Notice Board"
                    : "Notice Board"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {isBangla
                    ? "ওয়েবসাইটে দেখানো নোটিশসমূহ"
                    : "Notices displayed on the website"}
                </p>

              </div>

              <Link
                href="/admin/notices"
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                {isBangla
                  ? "ম্যানেজ করুন →"
                  : "Manage →"}
              </Link>

            </div>


            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

              <div className="overflow-hidden rounded-xl border border-blue-100">

                <div className="flex items-center gap-3 bg-blue-50 px-5 py-4">

                  <span className="text-xl">
                    📢
                  </span>

                  <span className="text-sm font-bold text-[#0B4DBB]">
                    {isBangla
                      ? "বিশেষ নোটিশ"
                      : "Special Notice"}
                  </span>

                </div>


                <div className="divide-y divide-gray-100">

                  {notices.map((notice) => (

                    <div
                      key={notice.id}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >

                      <div className="flex items-start gap-3">

                        <span className="mt-0.5">
                          🔔
                        </span>

                        <div>

                          <p className="text-sm font-medium text-gray-700">
                            {isBangla
                              ? notice.bn
                              : notice.en}
                          </p>

                          <p className="mt-1 text-[11px] text-gray-400">

                            {isBangla
                              ? notice.en
                              : notice.bn}

                          </p>

                        </div>

                      </div>


                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          notice.status === "Active"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >

                        {notice.status === "Active"
                          ? isBangla
                            ? "সক্রিয়"
                            : "Active"
                          : isBangla
                            ? "নিষ্ক্রিয়"
                            : "Inactive"}

                      </span>

                    </div>

                  ))}

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              FOOTER
          ================================================== */}

          <footer className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">

            © {new Date().getFullYear()} GO International BD.
            {" "}
            {isBangla
              ? "সকল অধিকার সংরক্ষিত।"
              : "All rights reserved."}

          </footer>

        </div>

      </div>

    </main>
  );
}