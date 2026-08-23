"use client";

import { useMemo, useState } from "react";

type Language = "bn" | "en";

type Job = {
  id: number;
  country: string;
  flag: string;
  category: string;
  title: string;
  sponsor: string;
  salary: string;
  vacancy: number;
  duty: string;
  accommodation: string;
  deadline: string;
  posted: string;
  description: string;
  requirements: string[];
  isNew?: boolean;
};

const jobs: Job[] = [
  {
    id: 1,
    country: "Saudi Arabia",
    flag: "🇸🇦",
    category: "Driver",
    title: "Driver",
    sponsor: "MCL Overseas",
    salary: "SAR 1,500",
    vacancy: 20,
    duty: "8 Hours",
    accommodation: "Provided",
    deadline: "30 Aug 2026",
    posted: "19 Aug 2026",
    description:
      "Experienced drivers are required for an overseas employment opportunity in Saudi Arabia.",
    requirements: [
      "Valid passport",
      "Driving experience",
      "Medical fitness",
      "Basic communication ability",
    ],
    isNew: true,
  },

  {
    id: 2,
    country: "Saudi Arabia",
    flag: "🇸🇦",
    category: "Factory Worker",
    title: "Factory Worker",
    sponsor: "MCL Overseas",
    salary: "SAR 1,300",
    vacancy: 50,
    duty: "8 Hours",
    accommodation: "Provided",
    deadline: "02 Sep 2026",
    posted: "19 Aug 2026",
    description:
      "Factory workers are required for a reputed company in Saudi Arabia.",
    requirements: [
      "Valid passport",
      "Physically fit",
      "Factory work ability",
      "Medical fitness",
    ],
    isNew: true,
  },

  {
    id: 3,
    country: "Saudi Arabia",
    flag: "🇸🇦",
    category: "Electrician",
    title: "Electrician",
    sponsor: "MCL Overseas",
    salary: "SAR 1,700",
    vacancy: 25,
    duty: "8 Hours",
    accommodation: "Provided",
    deadline: "05 Sep 2026",
    posted: "19 Aug 2026",
    description:
      "Skilled electricians are required for electrical installation and maintenance work.",
    requirements: [
      "Electrical work experience",
      "Valid passport",
      "Technical knowledge",
      "Medical fitness",
    ],
    isNew: true,
  },

  {
    id: 4,
    country: "Malaysia",
    flag: "🇲🇾",
    category: "Factory Worker",
    title: "Factory Worker",
    sponsor: "MCL Overseas",
    salary: "RM 1,700",
    vacancy: 100,
    duty: "8 Hours",
    accommodation: "Provided",
    deadline: "10 Sep 2026",
    posted: "19 Aug 2026",
    description:
      "Factory workers are required for a Malaysian industrial company.",
    requirements: [
      "Valid passport",
      "Physically fit",
      "Factory work ability",
      "Medical fitness",
    ],
    isNew: true,
  },

  {
    id: 5,
    country: "UAE",
    flag: "🇦🇪",
    category: "Electrician",
    title: "Electrician",
    sponsor: "MCL Overseas",
    salary: "AED 1,500",
    vacancy: 30,
    duty: "8 Hours",
    accommodation: "Provided",
    deadline: "08 Sep 2026",
    posted: "18 Aug 2026",
    description:
      "Experienced electricians are required for technical work in the UAE.",
    requirements: [
      "Electrical experience",
      "Technical knowledge",
      "Valid passport",
      "Medical fitness",
    ],
  },

  {
    id: 6,
    country: "Qatar",
    flag: "🇶🇦",
    category: "Welder",
    title: "Welder",
    sponsor: "MCL Overseas",
    salary: "QAR 1,500",
    vacancy: 15,
    duty: "8 Hours",
    accommodation: "Provided",
    deadline: "12 Sep 2026",
    posted: "18 Aug 2026",
    description:
      "Skilled welders are required for industrial and construction-related work.",
    requirements: [
      "Welding experience",
      "Technical skill",
      "Valid passport",
      "Medical fitness",
    ],
  },

  {
    id: 7,
    country: "Oman",
    flag: "🇴🇲",
    category: "Cleaner",
    title: "Cleaner",
    sponsor: "MCL Overseas",
    salary: "OMR 120",
    vacancy: 40,
    duty: "8 Hours",
    accommodation: "Provided",
    deadline: "15 Sep 2026",
    posted: "17 Aug 2026",
    description:
      "Cleaners are required for general cleaning and maintenance duties in Oman.",
    requirements: [
      "Valid passport",
      "Physically fit",
      "Responsible attitude",
      "Medical fitness",
    ],
  },
];

/* =========================
   COUNTRY TRANSLATION
========================= */

const countryBN: Record<string, string> = {
  "Saudi Arabia": "সৌদি আরব",
  Malaysia: "মালয়েশিয়া",
  UAE: "সংযুক্ত আরব আমিরাত",
  Qatar: "কাতার",
  Oman: "ওমান",
};

/* =========================
   CATEGORY TRANSLATION
========================= */

const categoryBN: Record<string, string> = {
  Driver: "ড্রাইভার",
  "Factory Worker": "ফ্যাক্টরি কর্মী",
  Electrician: "ইলেকট্রিশিয়ান",
  Plumber: "প্লাম্বার",
  Welder: "ওয়েল্ডার",
  Cleaner: "ক্লিনার",
  "Construction Worker": "নির্মাণ কর্মী",
  Technician: "টেকনিশিয়ান",
};

/* =========================
   REQUIREMENT TRANSLATION
========================= */

const requirementBN: Record<string, string> = {
  "Valid passport": "বৈধ পাসপোর্ট",
  "Driving experience": "ড্রাইভিং অভিজ্ঞতা",
  "Medical fitness": "মেডিকেল ফিটনেস",
  "Basic communication ability": "মৌলিক যোগাযোগের দক্ষতা",
  "Physically fit": "শারীরিকভাবে সুস্থ",
  "Factory work ability": "ফ্যাক্টরিতে কাজ করার সক্ষমতা",
  "Electrical work experience": "ইলেকট্রিক্যাল কাজের অভিজ্ঞতা",
  "Technical knowledge": "কারিগরি জ্ঞান",
  "Electrical experience": "ইলেকট্রিক্যাল অভিজ্ঞতা",
  "Welding experience": "ওয়েল্ডিংয়ের অভিজ্ঞতা",
  "Technical skill": "কারিগরি দক্ষতা",
  "Responsible attitude": "দায়িত্বশীল মনোভাব",
};

/* =========================
   JOB TITLE TRANSLATION
========================= */

const titleBN: Record<string, string> = {
  Driver: "ড্রাইভার",
  "Factory Worker": "ফ্যাক্টরি কর্মী",
  Electrician: "ইলেকট্রিশিয়ান",
  Welder: "ওয়েল্ডার",
  Cleaner: "ক্লিনার",
};

/* =========================
   DESCRIPTION TRANSLATION
========================= */

const descriptionBN: Record<string, string> = {
  "Experienced drivers are required for an overseas employment opportunity in Saudi Arabia.":
    "সৌদি আরবে বিদেশে কর্মসংস্থানের সুযোগের জন্য অভিজ্ঞ ড্রাইভার প্রয়োজন।",

  "Factory workers are required for a reputed company in Saudi Arabia.":
    "সৌদি আরবের একটি স্বনামধন্য প্রতিষ্ঠানের জন্য ফ্যাক্টরি কর্মী প্রয়োজন।",

  "Skilled electricians are required for electrical installation and maintenance work.":
    "ইলেকট্রিক্যাল ইনস্টলেশন ও রক্ষণাবেক্ষণের কাজের জন্য দক্ষ ইলেকট্রিশিয়ান প্রয়োজন।",

  "Factory workers are required for a Malaysian industrial company.":
    "মালয়েশিয়ার একটি শিল্প প্রতিষ্ঠানের জন্য ফ্যাক্টরি কর্মী প্রয়োজন।",

  "Experienced electricians are required for technical work in the UAE.":
    "সংযুক্ত আরব আমিরাতে কারিগরি কাজের জন্য অভিজ্ঞ ইলেকট্রিশিয়ান প্রয়োজন।",

  "Skilled welders are required for industrial and construction-related work.":
    "শিল্প ও নির্মাণ-সংক্রান্ত কাজের জন্য দক্ষ ওয়েল্ডার প্রয়োজন।",

  "Cleaners are required for general cleaning and maintenance duties in Oman.":
    "ওমানে সাধারণ পরিষ্কার-পরিচ্ছন্নতা ও রক্ষণাবেক্ষণের কাজের জন্য ক্লিনার প্রয়োজন।",
};

/* =========================
   COUNTRY FILTER
========================= */

const countries = [
  "All Countries",
  "Saudi Arabia",
  "Malaysia",
  "UAE",
  "Qatar",
  "Oman",
];

/* =========================
   CATEGORY FILTER
========================= */

const categories = [
  "All Categories",
  "Driver",
  "Factory Worker",
  "Electrician",
  "Plumber",
  "Welder",
  "Cleaner",
  "Construction Worker",
  "Technician",
];

export default function JobsPage() {
  const [language, setLanguage] = useState<Language>("bn");

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All Countries");
  const [category, setCategory] = useState("All Categories");

  const [startIndex, setStartIndex] = useState(0);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  /* =========================
     LANGUAGE HELPERS
  ========================= */

  const isBangla = language === "bn";

  const getCountryName = (value: string) => {
    return isBangla ? countryBN[value] || value : value;
  };

  const getCategoryName = (value: string) => {
    return isBangla ? categoryBN[value] || value : value;
  };

  const getTitle = (value: string) => {
    return isBangla ? titleBN[value] || value : value;
  };

  const getRequirement = (value: string) => {
    return isBangla ? requirementBN[value] || value : value;
  };

  const getDescription = (value: string) => {
    return isBangla ? descriptionBN[value] || value : value;
  };

  /* =========================
     SEARCH
  ========================= */

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const s = search.toLowerCase().trim();

      if (!s) {
        return (
          (country === "All Countries" || job.country === country) &&
          (category === "All Categories" || job.category === category)
        );
      }

      const searchableText = [
        job.country,
        countryBN[job.country] || "",
        job.category,
        categoryBN[job.category] || "",
        job.title,
        titleBN[job.title] || "",
        job.sponsor,
      ]
        .join(" ")
        .toLowerCase();

      return (
        searchableText.includes(s) &&
        (country === "All Countries" || job.country === country) &&
        (category === "All Categories" || job.category === category)
      );
    });
  }, [search, country, category]);

  const visibleJobs = filteredJobs.slice(startIndex, startIndex + 4);

  /* =========================
     CAROUSEL
  ========================= */

  const nextJobs = () => {
    if (filteredJobs.length <= 4) return;

    setStartIndex((current) => {
      return current + 1 >= filteredJobs.length ? 0 : current + 1;
    });
  };

  const previousJobs = () => {
    if (filteredJobs.length <= 4) return;

    setStartIndex((current) => {
      return current === 0 ? filteredJobs.length - 1 : current - 1;
    });
  };

  /* =========================
     RESET
  ========================= */

  const resetFilters = () => {
    setSearch("");
    setCountry("All Countries");
    setCategory("All Categories");
    setStartIndex(0);
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#0B2A55]">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-gray-200 bg-white">

        <div className="mx-[192px] flex items-center justify-between py-2 max-md:mx-0 max-md:px-4">

          {/* LOGO + COMPANY */}

          <div className="flex shrink-0 items-center">

            {/* LOGO SPACE */}

            <div className="mr-3 flex h-14 w-16 items-center justify-center">
              {/* এখানে Logo বসবে */}
            </div>

            <div>

              <div className="text-2xl font-bold tracking-tight">

                <span className="text-[#0B4DBB]">
                  GO INTERNATIONAL
                </span>{" "}

                <span className="text-red-500">
                  BD
                </span>

              </div>

              <p className="mt-1 text-xs text-gray-600">
                {isBangla
                  ? "অফিসিয়াল ভিসা চেক ও ইমিগ্রেশন সহায়তা"
                  : "Official Visa Check & Immigration Assistant"}
              </p>

            </div>

          </div>


          {/* NAVIGATION */}

          <nav className="hidden items-center gap-8 text-[16px] lg:flex">

            <a
              href="/"
              className="text-gray-800 hover:text-blue-600"
            >
              {isBangla ? "হোম" : "Home"}
            </a>

            <a
              href="#"
              className="text-gray-800 hover:text-blue-600"
            >
              {isBangla ? "ভিসা চেক" : "Visa Check"}
            </a>

            <a
              href="#"
              className="text-gray-800 hover:text-blue-600"
            >
              {isBangla ? "এআই সহায়ক" : "AI Assistant"}
            </a>

            <a
              href="/jobs"
              className="text-blue-600"
            >
              {isBangla ? "চাকরি" : "Jobs"}
            </a>

            <a
              href="#"
              className="text-gray-800 hover:text-blue-600"
            >
              {isBangla ? "সংবাদ" : "News"}
            </a>

            <a
              href="#"
              className="text-gray-800 hover:text-blue-600"
            >
              {isBangla ? "আমাদের সম্পর্কে" : "About Us"}
            </a>

            <a
              href="#"
              className="text-gray-800 hover:text-blue-600"
            >
              {isBangla ? "যোগাযোগ" : "Contact"}
            </a>

          </nav>


          {/* LANGUAGE + LOGIN */}

          <div className="flex items-center gap-3">

            <select
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value as Language)
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-[#0B2A55] outline-none"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>

            <button className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-600">
              {isBangla ? "লগইন" : "Login"}
            </button>

            <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700">
              {isBangla ? "রেজিস্টার" : "Register"}
            </button>

          </div>

        </div>

      </header>


      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="w-full bg-white">

        <div className="mx-[192px] max-md:mx-0">

          <div className="relative overflow-hidden rounded-b-2xl border-b border-gray-200 bg-[#f8fafc] px-6 py-10 md:px-10 md:py-14">

            {/* ভবিষ্যতে এখানে background image বসানো যাবে */}

            <div className="max-w-3xl">

              <span className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">

                🌍{" "}
                {isBangla
                  ? "বিদেশে কর্মসংস্থানের সুযোগ"
                  : "Overseas Employment Opportunities"}

              </span>

              <h1 className="text-3xl font-bold text-[#0B2A55] md:text-5xl">

                {isBangla
                  ? "বিদেশে চাকরির সার্কুলার"
                  : "Overseas Job Circulars"}

              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">

                {isBangla
                  ? "বিভিন্ন দেশের সর্বশেষ বিদেশি চাকরির সুযোগ খুঁজুন এবং আপনার জন্য উপযুক্ত পদে সহজেই আবেদন করুন।"
                  : "Find the latest overseas job opportunities from different countries and apply for suitable positions easily."}

              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          SEARCH
      ====================================================== */}

      <section className="relative z-10 mx-[192px] -mt-6 max-md:mx-4">

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-lg md:p-5">

          <div className="grid gap-4 lg:grid-cols-3">

            {/* SEARCH INPUT */}

            <div className="relative">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>

              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setStartIndex(0);
                }}
                placeholder={
                  isBangla
                    ? "চাকরি, দেশ বা ক্যাটাগরি খুঁজুন..."
                    : "Search job, country or category..."
                }
                className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500"
              />

            </div>


            {/* COUNTRY */}

            <div className="relative">

              <span className="absolute left-4 top-1/2 -translate-y-1/2">
                🌍
              </span>

              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setStartIndex(0);
                }}
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-10 text-sm outline-none focus:border-blue-500"
              >

                {countries.map((x) => (
                  <option key={x} value={x}>
                    {x === "All Countries"
                      ? isBangla
                        ? "সকল দেশ"
                        : "All Countries"
                      : getCountryName(x)}
                  </option>
                ))}

              </select>

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                ▼
              </span>

            </div>


            {/* CATEGORY */}

            <div className="relative">

              <span className="absolute left-4 top-1/2 -translate-y-1/2">
                💼
              </span>

              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setStartIndex(0);
                }}
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-10 text-sm outline-none focus:border-blue-500"
              >

                {categories.map((x) => (
                  <option key={x} value={x}>
                    {x === "All Categories"
                      ? isBangla
                        ? "সকল ক্যাটাগরি"
                        : "All Categories"
                      : getCategoryName(x)}
                  </option>
                ))}

              </select>

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                ▼
              </span>

            </div>

          </div>


          {/* SEARCH RESULT */}

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">

            <p className="text-sm text-gray-500">

              {isBangla ? "মোট " : "Showing "}

              <b className="text-[#0B2A55]">
                {filteredJobs.length}
              </b>

              {isBangla
                ? "টি চাকরির সার্কুলার"
                : " job circulars"}

            </p>


            {(search ||
              country !== "All Countries" ||
              category !== "All Categories") && (

              <button
                onClick={resetFilters}
                className="text-sm font-semibold text-blue-600"
              >
                {isBangla
                  ? "ফিল্টার পরিষ্কার করুন"
                  : "Clear Filters"}
              </button>

            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          JOBS
      ====================================================== */}

      <section className="mx-[192px] px-0 py-10 max-md:mx-4">

        <div className="mb-6">

          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            {isBangla
              ? "সর্বশেষ সুযোগ"
              : "Latest Opportunities"}
          </p>

          <div className="mt-1 flex items-end justify-between">

            <h2 className="text-2xl font-bold md:text-3xl">

              {isBangla
                ? "উপলব্ধ চাকরির সার্কুলার"
                : "Available Job Circulars"}

            </h2>

            <p className="hidden text-sm text-gray-500 sm:block">

              {filteredJobs.length}{" "}

              {isBangla
                ? "টি চাকরি পাওয়া গেছে"
                : "Jobs Found"}

            </p>

          </div>

        </div>


        {/* NO JOB */}

        {filteredJobs.length === 0 ? (

          <div className="rounded-2xl border bg-white p-12 text-center">

            <div className="text-5xl">
              🔎
            </div>

            <h3 className="mt-4 text-xl font-bold">

              {isBangla
                ? "কোনো চাকরি পাওয়া যায়নি"
                : "No Jobs Found"}

            </h3>

            <button
              onClick={resetFilters}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
            >
              {isBangla
                ? "ফিল্টার পরিষ্কার করুন"
                : "Clear Filters"}
            </button>

          </div>

        ) : (

          <div className="relative">

            {/* LEFT ARROW */}

            {filteredJobs.length > 4 && (

              <button
                onClick={previousJobs}
                className="absolute -left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-2xl text-blue-600 shadow-lg lg:flex"
              >
                ‹
              </button>

            )}


            {/* JOB GRID */}

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

              {visibleJobs.map((job) => (

                <article
                  key={job.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* CARD HEADER */}

                  <div className="border-b border-gray-100 px-5 pb-4 pt-5">

                    <div className="flex items-start justify-between gap-2">

                      <div>

                        <div className="flex items-center gap-2">

                          {/* FLAG / SA / MY COMPLETELY REMOVED */}

                          <h3 className="text-lg font-bold">
                            {getCountryName(job.country)}
                          </h3>

                        </div>

                        <p className="mt-1 text-xs text-gray-500">

                          {isBangla
                            ? "স্পনসর: "
                            : "Sponsor: "}

                          <span className="font-semibold text-blue-600">
                            {job.sponsor}
                          </span>

                        </p>

                      </div>


                      {job.isNew && (

                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">

                          {isBangla ? "নতুন" : "NEW"}

                        </span>

                      )}

                    </div>

                  </div>


                  {/* CIRCULAR PREVIEW */}

                  <div className="mx-4 mt-4 flex h-52 items-center justify-center rounded-xl border border-[#0B2A55] bg-gradient-to-br from-gray-50 to-blue-50">

                    <div className="text-center">

                      <div className="text-5xl">
                        📄
                      </div>

                      <p className="mt-3 font-bold">
                        {getCountryName(job.country)}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">

                        {getCategoryName(job.category)}{" "}

                        {isBangla
                          ? "চাকরির সার্কুলার"
                          : "Job Circular"}

                      </p>

                      <span className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-[11px] text-gray-500 shadow-sm">

                        {isBangla
                          ? "সার্কুলার দেখুন"
                          : "Circular Preview"}

                      </span>

                    </div>

                  </div>


                  {/* CATEGORY */}

                  <div className="px-5 pt-4">

                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">

                      {getCategoryName(job.category)}

                    </span>

                  </div>


                  {/* BASIC INFO */}

                  <div className="space-y-2 px-5 pt-4 text-xs text-gray-600">

                    <div className="flex justify-between">

                      <span>
                        {isBangla ? "বেতন" : "Salary"}
                      </span>

                      <strong className="text-gray-800">
                        {job.salary}
                      </strong>

                    </div>


                    <div className="flex justify-between">

                      <span>
                        {isBangla ? "পদসংখ্যা" : "Vacancy"}
                      </span>

                      <strong className="text-gray-800">
                        {job.vacancy}
                      </strong>

                    </div>


                    <div className="flex justify-between">

                      <span>
                        {isBangla
                          ? "আবেদনের শেষ তারিখ"
                          : "Deadline"}
                      </span>

                      <strong className="text-red-600">
                        {job.deadline}
                      </strong>

                    </div>

                  </div>


                  {/* BUTTONS */}

                  <div className="grid grid-cols-2 gap-2 p-5">

                    <button
                      onClick={() => setSelectedJob(job)}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-2 py-3 text-xs font-bold text-blue-700"
                    >
                      {isBangla
                        ? "বিস্তারিত দেখুন"
                        : "View Details"}
                    </button>


                    <button
                      onClick={() => setApplyJob(job)}
                      className="rounded-xl bg-blue-600 px-2 py-3 text-xs font-bold text-white"
                    >
                      {isBangla
                        ? "আবেদন করুন"
                        : "Apply Now"}
                    </button>

                  </div>

                </article>

              ))}

            </div>


            {/* RIGHT ARROW */}

            {filteredJobs.length > 4 && (

              <button
                onClick={nextJobs}
                className="absolute -right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-2xl text-blue-600 shadow-lg lg:flex"
              >
                ›
              </button>

            )}


            {/* DOTS */}

            {filteredJobs.length > 4 && (

              <div className="mt-7 flex justify-center gap-2">

                {filteredJobs.map((job, i) => (

                  <button
                    key={job.id}
                    onClick={() => setStartIndex(i)}
                    className={`h-2.5 rounded-full ${
                      i === startIndex
                        ? "w-7 bg-blue-600"
                        : "w-2.5 bg-gray-300"
                    }`}
                  />

                ))}

              </div>

            )}

          </div>

        )}

      </section>


      {/* =====================================================
          TRUST SECTION
      ====================================================== */}

      <section className="mx-[192px] pb-12 max-md:mx-4">

        <div className="grid overflow-hidden rounded-2xl border bg-white md:grid-cols-4">

          {[
            [
              "🛡️",
              isBangla ? "বিশ্বস্ত উৎস" : "Trusted Sources",
              isBangla
                ? "যাচাই করা উৎস থেকে চাকরির সার্কুলার।"
                : "Job circulars from verified sources.",
            ],

            [
              "🔄",
              isBangla ? "নিয়মিত আপডেট" : "Regular Updates",
              isBangla
                ? "নতুন চাকরির সুযোগ নিয়মিত যোগ করা যেতে পারে।"
                : "New opportunities can be added regularly.",
            ],

            [
              "⚡",
              isBangla ? "সহজ আবেদন" : "Easy Application",
              isBangla
                ? "উপযুক্ত চাকরি খুঁজে সহজেই আবেদন করুন।"
                : "Find a suitable job and apply easily.",
            ],

            [
              "🔔",
              isBangla ? "আপডেট থাকুন" : "Stay Updated",
              isBangla
                ? "নতুন চাকরির সুযোগের জন্য নিয়মিত দেখুন।"
                : "Check regularly for new opportunities.",
            ],
          ].map(([icon, title, text], i) => (

            <div
              key={title}
              className={`p-6 ${
                i < 3
                  ? "border-b md:border-b-0 md:border-r"
                  : ""
              }`}
            >

              <div className="text-2xl">
                {icon}
              </div>

              <h3 className="mt-3 font-bold">
                {title}
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                {text}
              </p>

            </div>

          ))}

        </div>

      </section>


      {/* =====================================================
          DETAILS MODAL
      ====================================================== */}

      {selectedJob && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
          onClick={() => setSelectedJob(null)}
        >

          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#0B2A55]">

                  {getCountryName(selectedJob.country)}

                </h2>

                <p className="mt-1 text-sm text-gray-500">

                  {getTitle(selectedJob.title)} ·{" "}
                  {getCategoryName(selectedJob.category)}

                </p>

              </div>


              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>


            {/* MODAL BODY */}

            <div className="p-6">

              <div className="rounded-xl bg-gray-50 p-8 text-center">

                <div className="text-6xl">
                  📄
                </div>

                <h3 className="mt-4 text-xl font-bold">

                  {getCountryName(selectedJob.country)}{" "}

                  {isBangla
                    ? "চাকরির সার্কুলার"
                    : "Job Circular"}

                </h3>

                <p className="mt-1 text-sm text-gray-500">

                  {getCategoryName(selectedJob.category)}

                </p>

              </div>


              {/* JOB INFO */}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">

                {[
                  [
                    isBangla ? "স্পনসর" : "Sponsor",
                    selectedJob.sponsor,
                  ],

                  [
                    isBangla ? "বেতন" : "Salary",
                    selectedJob.salary,
                  ],

                  [
                    isBangla ? "পদসংখ্যা" : "Vacancy",
                    String(selectedJob.vacancy),
                  ],

                  [
                    isBangla ? "কাজের সময়" : "Duty",
                    isBangla
                      ? "৮ ঘণ্টা"
                      : selectedJob.duty,
                  ],

                  [
                    isBangla ? "আবাসন" : "Accommodation",
                    isBangla
                      ? "প্রদান করা হবে"
                      : selectedJob.accommodation,
                  ],

                  [
                    isBangla
                      ? "আবেদনের শেষ তারিখ"
                      : "Deadline",
                    selectedJob.deadline,
                  ],
                ].map(([label, value]) => (

                  <div
                    key={label}
                    className="rounded-xl bg-gray-50 p-4"
                  >

                    <p className="text-xs text-gray-500">
                      {label}
                    </p>

                    <p className="mt-1 font-bold">
                      {value}
                    </p>

                  </div>

                ))}

              </div>


              {/* DESCRIPTION */}

              <div className="mt-6">

                <h3 className="font-bold">

                  {isBangla
                    ? "চাকরির বিবরণ"
                    : "Job Description"}

                </h3>

                <p className="mt-2 text-sm leading-7 text-gray-600">

                  {getDescription(selectedJob.description)}

                </p>

              </div>


              {/* REQUIREMENTS */}

              <div className="mt-6">

                <h3 className="font-bold">

                  {isBangla
                    ? "প্রয়োজনীয় যোগ্যতা"
                    : "Requirements"}

                </h3>

                <ul className="mt-3 space-y-2">

                  {selectedJob.requirements.map(
                    (requirement) => (

                      <li
                        key={requirement}
                        className="text-sm text-gray-600"
                      >
                        ✓ {getRequirement(requirement)}
                      </li>

                    )
                  )}

                </ul>

              </div>


              {/* APPLY */}

              <button
                onClick={() => {
                  setSelectedJob(null);
                  setApplyJob(selectedJob);
                }}
                className="mt-7 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white hover:bg-blue-700"
              >

                {isBangla
                  ? "এই চাকরিতে আবেদন করুন →"
                  : "Apply for this Job →"}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          APPLY MODAL
      ====================================================== */}

      {applyJob && (

        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-6"
          onClick={() => setApplyJob(null)}
        >

          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* APPLY HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-xl font-bold">

                  {isBangla
                    ? "চাকরির জন্য আবেদন"
                    : "Apply Now"}

                </h2>

                <p className="mt-1 text-xs text-gray-500">

                  {getCountryName(applyJob.country)} —{" "}
                  {getTitle(applyJob.title)}

                </p>

              </div>


              <button
                onClick={() => setApplyJob(null)}
                className="text-2xl text-gray-400"
              >
                ×
              </button>

            </div>


            {/* FORM */}

            <form
              className="space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();

                alert(
                  isBangla
                    ? "আপনার আবেদন ফর্ম প্রস্তুত হয়েছে।"
                    : "Application form is ready."
                );

                setApplyJob(null);
              }}
            >

              <input
                required
                placeholder={
                  isBangla
                    ? "পূর্ণ নাম"
                    : "Full Name"
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />


              <input
                required
                type="tel"
                placeholder={
                  isBangla
                    ? "মোবাইল নম্বর"
                    : "Phone Number"
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />


              <input
                type="email"
                placeholder={
                  isBangla
                    ? "ইমেইল ঠিকানা"
                    : "Email Address"
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />


              <textarea
                rows={4}
                placeholder={
                  isBangla
                    ? "আপনার বার্তা লিখুন"
                    : "Message"
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />


              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white hover:bg-blue-700"
              >

                {isBangla
                  ? "আবেদন জমা দিন"
                  : "Submit Application"}

              </button>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}