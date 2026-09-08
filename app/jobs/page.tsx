"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* =========================================================
   TYPES
========================================================= */

type Language = "bn" | "en";

type Job = {
  id: string | number;

  /* Admin-editable circular information */
  country: string;
  countryDisplayName?: string;
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

  /* Future Admin Circular Upload */
  circularUrl?: string;
  circularType?: "image" | "pdf";

  isNew?: boolean;
};

type Notice = {
  id: number;
  bn: string;
  en: string;
};

/* =========================================================
   JOB DATA
   NOTE:
   Later these records will come from Admin Dashboard/API.
========================================================= */

const SAMPLE_JOBS: Job[] = [
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

/* =========================================================
   NOTICE BOARD
   Later Admin Dashboard will manage these notices.
========================================================= */

const notices: Notice[] = [
  {
    id: 1,
    bn: "সৌদি আরবের নতুন চাকরির সার্কুলার প্রকাশিত হয়েছে।",
    en: "A new Saudi Arabia job circular has been published.",
  },
  {
    id: 2,
    bn: "আবেদন করার আগে সার্কুলারের সকল শর্ত ভালোভাবে যাচাই করুন।",
    en: "Please verify all circular requirements before applying.",
  },
  {
    id: 3,
    bn: "ভিসা ও চাকরির তথ্যের জন্য শুধুমাত্র নির্ভরযোগ্য উৎস ব্যবহার করুন।",
    en: "Use reliable sources for visa and employment information.",
  },
  {
    id: 4,
    bn: "নতুন চাকরির সুযোগ পেতে নিয়মিত Jobs page দেখুন।",
    en: "Check the Jobs page regularly for new opportunities.",
  },
];

/* =========================================================
   COUNTRY TRANSLATION
========================================================= */

const countryBN: Record<string, string> = {
  "Saudi Arabia": "সৌদি আরব",
  Malaysia: "মালয়েশিয়া",
  UAE: "সংযুক্ত আরব আমিরাত",
  Qatar: "কাতার",
  Oman: "ওমান",
};

/* =========================================================
   CATEGORY TRANSLATION
========================================================= */

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

/* =========================================================
   REQUIREMENT TRANSLATION
========================================================= */

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

/* =========================================================
   JOB TITLE TRANSLATION
========================================================= */

const titleBN: Record<string, string> = {
  Driver: "ড্রাইভার",
  "Factory Worker": "ফ্যাক্টরি কর্মী",
  Electrician: "ইলেকট্রিশিয়ান",
  Plumber: "প্লাম্বার",
  Welder: "ওয়েল্ডার",
  Cleaner: "ক্লিনার",
};

/* =========================================================
   DESCRIPTION TRANSLATION
========================================================= */

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

/* =========================================================
   FILTER OPTIONS
========================================================= */

const countries = [
  "All Countries",
  "Saudi Arabia",
  "Malaysia",
  "UAE",
  "Qatar",
  "Oman",
];

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

/* =========================================================
   MAIN PAGE
========================================================= */

export default function JobsPage() {
  const [language, setLanguage] = useState<Language>("bn");

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All Countries");
  const [category, setCategory] = useState("All Categories");

  const [startIndex, setStartIndex] = useState(0);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  /* Full Circular Viewer */
  const [circularJob, setCircularJob] = useState<Job | null>(null);

  /* Job list — managed from /admin, falls back to the bundled sample. */
  const [jobs, setJobs] = useState<Job[]>(SAMPLE_JOBS);

  /* Mobile header dropdown (⋮) — Login / Register */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Apply form state */
  const [applyForm, setApplyForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [applyBusy, setApplyBusy] = useState(false);
  const [applyDone, setApplyDone] = useState(false);
  const [applyError, setApplyError] = useState("");

  const isBangla = language === "bn";

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/circulars", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad"))))
      .then((d) => {
        const list = Array.isArray(d?.circulars) ? d.circulars : [];
        if (list.length === 0) return;
        setJobs(
          list.map(
            (c: {
              id: string;
              country: string;
              countryCode: string;
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
              circularUrl: string | null;
              circularType: "image" | "pdf" | null;
            }): Job => ({
              id: c.id,
              country: c.country,
              flag: c.flag,
              category: c.category,
              title: c.title,
              sponsor: c.sponsor,
              salary: c.salary,
              vacancy: c.vacancy,
              duty: c.duty,
              accommodation: c.accommodation,
              deadline: c.deadline,
              posted: c.posted,
              description: c.description,
              requirements: c.requirements ?? [],
              circularUrl: c.circularUrl ?? undefined,
              circularType: c.circularType ?? undefined,
            }),
          ),
        );
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const openApply = (job: Job) => {
    setApplyForm({ name: "", phone: "", email: "", message: "" });
    setApplyDone(false);
    setApplyError("");
    setApplyJob(job);
  };

  /* =======================================================
     LANGUAGE HELPERS
  ======================================================= */

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

  /* =======================================================
     FILTER
  ======================================================= */

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
  }, [jobs, search, country, category]);

  const visibleJobs = filteredJobs.slice(startIndex, startIndex + 4);

  /* =======================================================
     CAROUSEL
  ======================================================= */

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

  /* =======================================================
     RESET
  ======================================================= */

  const resetFilters = () => {
    setSearch("");
    setCountry("All Countries");
    setCategory("All Categories");
    setStartIndex(0);
  };

  /* =======================================================
     KEYBOARD ESC FOR MODALS
  ======================================================= */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setSelectedJob(null);
      setApplyJob(null);
      setCircularJob(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#0B2A55]">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-gray-200 bg-white">

        <div className="relative mx-[192px] flex items-center justify-between py-2 max-md:mx-0 max-md:gap-2 max-md:px-4">

          {/* LOGO + COMPANY */}

          <div className="flex shrink-0 items-center max-md:min-w-0 max-md:flex-1">

            {/* LOGO */}

            <div className="mr-3 flex h-12 w-24 shrink-0 items-center justify-center max-md:mr-2.5 max-md:h-10 max-md:w-12">

              <Link href="/" aria-label="Go to Home">

                <img
                  src="/logo.svg"
                  alt="GO International BD Logo"
                  className="h-12 w-auto cursor-pointer object-contain transition-all duration-200 hover:scale-105 hover:opacity-90 max-md:h-20"
                />

              </Link>

            </div>

            {/* COMPANY NAME */}

            <div className="max-md:min-w-0 max-md:flex-1 max-md:text-center">

              <div className="text-2xl font-bold tracking-tight max-md:text-lg">

                <span className="text-[#0B4DBB]">
                  GO INTERNATIONAL
                </span>{" "}

                <span className="text-red-500">
                  BD
                </span>

              </div>

              <p className="mt-1 text-xs text-gray-600 max-md:mt-0.5 max-md:text-[9px] max-md:leading-tight">

                {isBangla
                  ? "অফিসিয়াল ভিসা চেক ও ইমিগ্রেশন সহায়তা"
                  : "Official Visa Check & Immigration Assistant"}

              </p>

            </div>

          </div>


          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-7 text-[15px] lg:flex">

            <Link
              href="/"
              className="text-gray-800 transition hover:text-blue-600"
            >
              {isBangla ? "হোম" : "Home"}
            </Link>

            <a
              href="#"
              className="text-gray-800 transition hover:text-blue-600"
            >
              {isBangla ? "ভিসা চেক" : "Visa Check"}
            </a>

            <a
              href="#"
              className="text-gray-800 transition hover:text-blue-600"
            >
              {isBangla ? "AI সহকারী" : "AI Assistant"}
            </a>

            <Link
              href="/jobs"
              className="font-semibold text-blue-600"
            >
              {isBangla ? "চাকরি" : "Jobs"}
            </Link>

            <a
              href="#"
              className="text-gray-800 transition hover:text-blue-600"
            >
              {isBangla ? "নিউজ" : "News"}
            </a>

            <a
              href="#"
              className="text-gray-800 transition hover:text-blue-600"
            >
              {isBangla ? "আমাদের সম্পর্কে" : "About Us"}
            </a>

            <a
              href="#"
              className="text-gray-800 transition hover:text-blue-600"
            >
              {isBangla ? "যোগাযোগ" : "Contact"}
            </a>

          </nav>


          {/* LANGUAGE + REGISTER */}

          <div className="flex shrink-0 items-center gap-3 max-md:gap-1.5">

            <button
              type="button"
              onClick={() =>
                setLanguage((current) =>
                  current === "bn" ? "en" : "bn"
                )
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
            >
              {isBangla ? "English" : "বাংলা"}
            </button>

            <button
              type="button"
              className="hidden rounded-lg bg-[#0B4DBB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#093f98] md:block"
            >
              {isBangla ? "রেজিস্টার" : "Register"}
            </button>

            {/* Mobile only: three-dot menu */}
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-xl leading-none text-gray-700 hover:bg-gray-50 max-md:flex"
            >
              ⋮
            </button>

          </div>

          {/* Mobile dropdown: Login / Register */}
          {mobileMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-40 hidden max-md:block"
              />
              <div className="absolute right-4 top-full z-50 mt-1 hidden w-44 flex-col gap-2 rounded-xl border border-gray-200 bg-white p-2.5 shadow-lg max-md:flex">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {isBangla ? "লগইন" : "Login"}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-[#0B4DBB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#093f98]"
                >
                  {isBangla ? "রেজিস্টার" : "Register"}
                </button>
              </div>
            </>
          )}

        </div>

      </header>


      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="w-full bg-white">

        <div className="mx-[192px] max-md:mx-0">

          <div className="relative overflow-hidden rounded-b-2xl border-b border-gray-200 bg-[#f8fafc] px-6 py-10 md:px-10 md:py-14">

            {/* Future background image area */}

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

            {/* SEARCH */}

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
                className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500"
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
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-10 text-sm outline-none transition focus:border-blue-500"
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
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-10 text-sm outline-none transition focus:border-blue-500"
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
                type="button"
                onClick={resetFilters}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
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
          JOB CIRCULARS
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

              {isBangla ? "টি চাকরি" : "Jobs Found"}

            </p>

          </div>

        </div>


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
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
            >
              {isBangla
                ? "ফিল্টার পরিষ্কার করুন"
                : "Clear Filters"}
            </button>

          </div>

        ) : (

          <div className="relative">

            {/* LEFT */}

            {filteredJobs.length > 4 && (

              <button
                type="button"
                onClick={previousJobs}
                className="absolute -left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-2xl text-blue-600 shadow-lg hover:bg-blue-50 lg:flex"
                aria-label="Previous jobs"
              >
                ‹
              </button>

            )}


            {/* CARDS */}

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

              {visibleJobs.map((job) => (

                <article
                  key={job.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* CARD HEADER */}

                  <div className="border-b border-gray-100 px-5 pb-4 pt-5">

                    <div className="flex items-start justify-between gap-2">

                      <div>

                        <div className="flex items-center gap-2">

                          <span className="text-2xl">
                            {job.flag}
                          </span>

                          <h3 className="text-lg font-bold">

                            {getCountryName(
                              job.countryDisplayName || job.country
                            )}

                          </h3>

                        </div>

                        <p className="mt-1 text-xs text-gray-500">

                          {isBangla ? "স্পনসর: " : "Sponsor: "}

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


                  {/* =================================================
                      CIRCULAR PREVIEW
                  ================================================== */}

                  <button
                    type="button"
                    onClick={() => {
                      if (job.circularUrl) {
                        setCircularJob(job);
                      } else {
                        setSelectedJob(job);
                      }
                    }}
                    className="mx-4 mt-4 block w-[calc(100%-2rem)] text-left"
                    aria-label={
                      isBangla
                        ? "সার্কুলার দেখুন"
                        : "View circular"
                    }
                  >

                    <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-[#f8fafc]">

                      {job.circularUrl && job.circularType === "image" ? (

                        <img
                          src={job.circularUrl}
                          alt={
                            isBangla
                              ? `${getCountryName(job.country)} সার্কুলার`
                              : `${job.country} job circular`
                          }
                          className="h-full w-full object-contain"
                        />

                      ) : (

                        <div className="text-center">

                          <div className="text-5xl">
                            📄
                          </div>

                          <p className="mt-3 font-bold">

                            {getCountryName(
                              job.countryDisplayName || job.country
                            )}

                          </p>

                          <p className="mt-1 text-xs text-gray-500">

                            {getCategoryName(job.category)}{" "}

                            {isBangla
                              ? "চাকরির সার্কুলার"
                              : "Job Circular"}

                          </p>

                          <span className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-[11px] text-gray-500 shadow-sm">

                            {isBangla
                              ? "সার্কুলার প্রিভিউ"
                              : "Circular Preview"}

                          </span>

                        </div>

                      )}

                    </div>

                  </button>


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
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-2 py-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      {isBangla
                        ? "বিস্তারিত দেখুন"
                        : "View Details"}
                    </button>


                    <button
                      type="button"
                      onClick={() => openApply(job)}
                      className="rounded-xl bg-blue-600 px-2 py-3 text-xs font-bold text-white transition hover:bg-blue-700"
                    >
                      {isBangla
                        ? "আবেদন করুন"
                        : "Apply Now"}
                    </button>

                  </div>

                </article>

              ))}

            </div>


            {/* RIGHT */}

            {filteredJobs.length > 4 && (

              <button
                type="button"
                onClick={nextJobs}
                className="absolute -right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-2xl text-blue-600 shadow-lg hover:bg-blue-50 lg:flex"
                aria-label="Next jobs"
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
                    type="button"
                    onClick={() => setStartIndex(i)}
                    aria-label={`Go to job ${i + 1}`}
                    className={`h-2.5 rounded-full transition-all ${
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
          NOTICE BOARD
      ====================================================== */}

      <section className="mx-[192px] pb-10 max-md:mx-4">

        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">

          {/* NOTICE HEADER */}

          <div className="flex items-center border-b border-blue-100 bg-blue-50">

            <div className="flex shrink-0 items-center gap-2 bg-[#0B4DBB] px-5 py-4 text-sm font-bold text-white">

              <span className="text-lg">
                📢
              </span>

              <span>
                {isBangla
                  ? "বিশেষ নোটিশ"
                  : "Special Notice"}
              </span>

            </div>

            <div className="h-7 w-px bg-blue-200" />

            <div className="px-4 text-xs font-medium text-blue-700">

              {isBangla
                ? "গুরুত্বপূর্ণ তথ্য"
                : "Important Information"}

            </div>

          </div>


          {/* AUTO SCROLLING NOTICE */}

          <div className="relative h-[92px] overflow-hidden bg-white">

            <div
              className="notice-scroll absolute left-0 right-0 top-0"
              onMouseEnter={(e) => {
                e.currentTarget.style.animationPlayState = "paused";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.animationPlayState = "running";
              }}
            >

              {[...notices, ...notices].map((notice, index) => (

                <div
                  key={`${notice.id}-${index}`}
                  className="flex min-h-[46px] items-center gap-3 px-5 text-sm text-gray-700"
                >

                  <span className="text-blue-600">
                    🔔
                  </span>

                  <span>
                    {isBangla
                      ? notice.bn
                      : notice.en}
                  </span>

                </div>

              ))}

            </div>

          </div>

        </div>

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
                ? "নতুন সুযোগ নিয়মিত যোগ করা যেতে পারে।"
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
                ? "নতুন সুযোগের জন্য নিয়মিত দেখুন।"
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
          CIRCULAR VIEWER
      ====================================================== */}

      {circularJob && (

        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-2 py-3 sm:px-5 sm:py-5"
          onClick={() => setCircularJob(null)}
        >

          <div
            className="relative flex h-full max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* VIEWER HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-6">

              <div>

                <h2 className="text-base font-bold text-[#0B2A55] sm:text-lg">

                  {getCountryName(
                    circularJob.countryDisplayName ||
                    circularJob.country
                  )}

                </h2>

                <p className="mt-0.5 text-xs text-gray-500">

                  {getTitle(circularJob.title)}

                </p>

              </div>

              <button
                type="button"
                onClick={() => setCircularJob(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
                aria-label="Close circular viewer"
              >
                ×
              </button>

            </div>


            {/* VIEWER BODY */}

            <div className="min-h-0 flex-1 overflow-auto bg-[#eef1f5] p-3 sm:p-5">

              {circularJob.circularUrl &&
              circularJob.circularType === "pdf" ? (

                <iframe
                  src={circularJob.circularUrl}
                  title="Job Circular PDF"
                  className="h-full min-h-[650px] w-full rounded-lg bg-white"
                />

              ) : circularJob.circularUrl ? (

                <div className="flex min-h-full items-start justify-center">

                  <img
                    src={circularJob.circularUrl}
                    alt="Job Circular"
                    className="h-auto max-w-full rounded-lg bg-white object-contain shadow-md"
                  />

                </div>

              ) : (

                <div className="flex min-h-full items-center justify-center">

                  <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

                    <div className="text-6xl">
                      📄
                    </div>

                    <h3 className="mt-4 text-lg font-bold">

                      {isBangla
                        ? "সার্কুলার এখনো আপলোড করা হয়নি"
                        : "Circular has not been uploaded yet"}

                    </h3>

                    <p className="mt-2 text-sm text-gray-500">

                      {isBangla
                        ? "Admin Dashboard থেকে Circular Upload করলে এখানে দেখা যাবে।"
                        : "The uploaded circular from Admin Dashboard will appear here."}

                    </p>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      )}


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

            {/* HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#0B2A55]">

                  {selectedJob.flag}{" "}

                  {getCountryName(
                    selectedJob.countryDisplayName ||
                    selectedJob.country
                  )}

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


            {/* BODY */}

            <div className="p-6">

              {/* CIRCULAR PREVIEW */}

              <button
                type="button"
                onClick={() => {
                  setSelectedJob(null);

                  if (selectedJob.circularUrl) {
                    setCircularJob(selectedJob);
                  }
                }}
                className="block w-full"
              >

                <div className="flex min-h-[240px] w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-[#f8fafc]">

                  {selectedJob.circularUrl &&
                  selectedJob.circularType === "image" ? (

                    <img
                      src={selectedJob.circularUrl}
                      alt="Job Circular"
                      className="max-h-[500px] w-full object-contain"
                    />

                  ) : (

                    <div className="text-center">

                      <div className="text-6xl">
                        📄
                      </div>

                      <h3 className="mt-4 text-xl font-bold">

                        {getCountryName(
                          selectedJob.countryDisplayName ||
                          selectedJob.country
                        )}{" "}

                        {isBangla
                          ? "চাকরির সার্কুলার"
                          : "Job Circular"}

                      </h3>

                      <p className="mt-1 text-sm text-gray-500">

                        {getCategoryName(selectedJob.category)}

                      </p>

                      <span className="mt-4 inline-block rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">

                        {selectedJob.circularUrl
                          ? isBangla
                            ? "সার্কুলার দেখুন"
                            : "View Circular"
                          : isBangla
                            ? "সার্কুলার শীঘ্রই আসবে"
                            : "Circular Coming Soon"}

                      </span>

                    </div>

                  )}

                </div>

              </button>


              {/* INFO GRID */}

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
                type="button"
                onClick={() => {
                  const job = selectedJob;
                  setSelectedJob(null);
                  if (job) openApply(job);
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

                  {getCountryName(
                    applyJob.countryDisplayName ||
                    applyJob.country
                  )}{" "}
                  —{" "}
                  {getTitle(applyJob.title)}

                </p>

              </div>

              <button
                type="button"
                onClick={() => setApplyJob(null)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>


            {/* FORM */}

            {applyDone ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
                  ✓
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {isBangla
                    ? "আপনার আবেদন জমা হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।"
                    : "Your application has been submitted. We will contact you soon."}
                </p>
                <button
                  type="button"
                  onClick={() => setApplyJob(null)}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  {isBangla ? "বন্ধ করুন" : "Close"}
                </button>
              </div>
            ) : (
              <form
                className="space-y-4 p-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setApplyBusy(true);
                  setApplyError("");
                  try {
                    const res = await fetch("/api/applications", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        circular_id: applyJob ? String(applyJob.id) : null,
                        job_title: applyJob?.title ?? "",
                        job_country: applyJob?.country ?? "",
                        applicant_name: applyForm.name,
                        phone: applyForm.phone,
                        email: applyForm.email,
                        message: applyForm.message,
                      }),
                    });
                    const data = (await res.json().catch(() => ({}))) as {
                      error?: string;
                    };
                    if (!res.ok) {
                      setApplyError(
                        data.error ||
                          (isBangla ? "জমা দেওয়া যায়নি" : "Could not submit"),
                      );
                      return;
                    }
                    setApplyDone(true);
                    setApplyForm({ name: "", phone: "", email: "", message: "" });
                  } catch {
                    setApplyError(
                      isBangla ? "সংযোগে সমস্যা" : "Network error",
                    );
                  } finally {
                    setApplyBusy(false);
                  }
                }}
              >
                <input
                  required
                  value={applyForm.name}
                  onChange={(e) =>
                    setApplyForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder={isBangla ? "পূর্ণ নাম" : "Full Name"}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <input
                  required
                  type="tel"
                  value={applyForm.phone}
                  onChange={(e) =>
                    setApplyForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder={isBangla ? "মোবাইল নম্বর" : "Phone Number"}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <input
                  type="email"
                  value={applyForm.email}
                  onChange={(e) =>
                    setApplyForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder={isBangla ? "ইমেইল ঠিকানা" : "Email Address"}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <textarea
                  rows={4}
                  value={applyForm.message}
                  onChange={(e) =>
                    setApplyForm((f) => ({ ...f, message: e.target.value }))
                  }
                  placeholder={isBangla ? "বার্তা" : "Message"}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                {applyError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                    {applyError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={applyBusy}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {applyBusy
                    ? "..."
                    : isBangla
                      ? "আবেদন জমা দিন"
                      : "Submit Application"}
                </button>
              </form>
            )}

          </div>

        </div>

      )}


      {/* =====================================================
          NOTICE BOARD ANIMATION
      ====================================================== */}

      <style jsx>{`
        .notice-scroll {
          animation: noticeScroll 16s linear infinite;
        }

        @keyframes noticeScroll {
          0% {
            transform: translateY(0);
          }

          45% {
            transform: translateY(-92px);
          }

          50% {
            transform: translateY(-92px);
          }

          95% {
            transform: translateY(-184px);
          }

          100% {
            transform: translateY(-184px);
          }
        }
      `}</style>

    </main>
  );
}