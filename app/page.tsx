"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { countries } from "./countries";
import CvAndNoticeSection from "../components/CvAndNoticeSection";

/* =========================================================
   TYPES
========================================================= */

type Language = "bn" | "en";

type NoticeSettings = {
  enabled: boolean;
  bangla: string;
  english: string;
  speed: number;
  direction: "left" | "right";
};

type FeaturedCircular = {
  id: string | number;
  country: string;
  title: string;
  imageUrl: string;
  active: boolean;
};

type HomeJob = {
  id: string | number;
  country: string;
  flag: string;
  position: string;
  salary: string;
  vacancy: number;
  deadline: string;
};

/* =========================================================
   DEFAULT NOTICE
   Admin Dashboard ভবিষ্যতে এই data update করবে
========================================================= */

const defaultNotice: NoticeSettings = {
  enabled: true,
  bangla:
    "বিশেষ বিজ্ঞপ্তি: নতুন চাকরির সার্কুলার প্রকাশিত হয়েছে। বিস্তারিত জানতে সার্কুলার দেখুন।",
  english:
    "Special Notice: New overseas job circulars have been published. Check the latest circulars for details.",
  speed: 25,
  direction: "left",
};

/* =========================================================
   DEFAULT FEATURED CIRCULARS
   Admin Dashboard থেকে এগুলো পরে dynamic হবে
========================================================= */

const defaultCirculars: FeaturedCircular[] = [];

/* =========================================================
   SAMPLE LATEST JOBS
========================================================= */

const latestJobs: HomeJob[] = [
  {
    id: 1,
    country: "Saudi Arabia",
    flag: "🇸🇦",
    position: "Driver",
    salary: "SAR 1,500",
    vacancy: 20,
    deadline: "30 Aug 2026",
  },
  {
    id: 2,
    country: "Saudi Arabia",
    flag: "🇸🇦",
    position: "Factory Worker",
    salary: "SAR 1,300",
    vacancy: 50,
    deadline: "02 Sep 2026",
  },
  {
    id: 3,
    country: "Malaysia",
    flag: "🇲🇾",
    position: "Factory Worker",
    salary: "RM 1,700",
    vacancy: 100,
    deadline: "10 Sep 2026",
  },
  {
    id: 4,
    country: "Qatar",
    flag: "🇶🇦",
    position: "Welder",
    salary: "QAR 1,500",
    vacancy: 15,
    deadline: "12 Sep 2026",
  },
];

/* =========================================================
   HOME PAGE
========================================================= */

export default function Home() {
  const [language, setLanguage] = useState<Language>("bn");

  const isBangla = language === "bn";

  /* =======================================================
     TIME
  ======================================================= */

  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const dhakaDate = new Date(
        now.toLocaleString("en-US", {
          timeZone: "Asia/Dhaka",
        })
      );

      const time = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now);

      const banglaMonths = [
        "বৈশাখ",
        "জ্যৈষ্ঠ",
        "আষাঢ়",
        "শ্রাবণ",
        "ভাদ্র",
        "আশ্বিন",
        "কার্তিক",
        "অগ্রহায়ণ",
        "পৌষ",
        "মাঘ",
        "ফাল্গুন",
        "চৈত্র",
      ];

      const year = dhakaDate.getFullYear();
      const month = dhakaDate.getMonth();
      const day = dhakaDate.getDate();

      const bengaliNewYear = new Date(year, 3, 14);

      let banglaYear: number;
      let daysFromNewYear: number;

      if (dhakaDate >= bengaliNewYear) {
        banglaYear = year - 593;

        daysFromNewYear = Math.floor(
          (dhakaDate.getTime() - bengaliNewYear.getTime()) /
            (1000 * 60 * 60 * 24)
        );
      } else {
        const previousNewYear = new Date(year - 1, 3, 14);

        banglaYear = year - 594;

        daysFromNewYear = Math.floor(
          (dhakaDate.getTime() - previousNewYear.getTime()) /
            (1000 * 60 * 60 * 24)
        );
      }

      const monthLengths = [
        31,
        31,
        31,
        31,
        31,
        30,
        30,
        30,
        30,
        30,
        29,
        30,
      ];

      let banglaMonthIndex = 0;
      let banglaDay = daysFromNewYear + 1;

      for (let i = 0; i < monthLengths.length; i++) {
        if (banglaDay <= monthLengths[i]) {
          banglaMonthIndex = i;
          break;
        }

        banglaDay -= monthLengths[i];
      }

      const toBanglaNumber = (number: number) => {
        const digits = [
          "০",
          "১",
          "২",
          "৩",
          "৪",
          "৫",
          "৬",
          "৭",
          "৮",
          "৯",
        ];

        return number
          .toString()
          .split("")
          .map((digit) => digits[Number(digit)])
          .join("");
      };

      const banglaDate = `${toBanglaNumber(
        banglaDay
      )} ${banglaMonths[banglaMonthIndex]}, ${toBanglaNumber(
        banglaYear
      )}`;

      setCurrentTime(`${time} | ${banglaDate}`);
    };

    updateTime();

    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  /* =======================================================
     VISA CHECK STATES
  ======================================================= */

  const [countrySearch, setCountrySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [visaType, setVisaType] = useState("");
  const [passportNumber, setPassportNumber] = useState("");

  const [saudiServicesOpen, setSaudiServicesOpen] =
    useState(false);

  const [malaysiaServicesOpen, setMalaysiaServicesOpen] =
    useState(false);

  /* Mobile header dropdown (⋮) — Login / Register */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* =======================================================
     NOTICE SETTINGS
  ======================================================= */

  const [notice, setNotice] =
    useState<NoticeSettings>(defaultNotice);

  /* =======================================================
     FEATURED CIRCULARS
  ======================================================= */

  const [featuredCirculars, setFeaturedCirculars] =
    useState<FeaturedCircular[]>(defaultCirculars);

  const [selectedCircular, setSelectedCircular] =
    useState<FeaturedCircular | null>(null);

  /* =======================================================
     POPULAR COUNTRIES + LATEST JOBS (Admin Dashboard driven)
  ======================================================= */

  /* Countries pinned to the front of the strip, chosen from /admin.
     The rest of the world follows in the default order. */
  const [pinnedCountries, setPinnedCountries] = useState<
    { code: string; name: string }[]
  >([]);

  const [homeJobs, setHomeJobs] = useState<HomeJob[]>(latestJobs);

  /* =======================================================
     LOAD ADMIN DATA
     Managed from /admin — falls back to the bundled samples
     whenever the API / database is not available.
  ======================================================= */

  useEffect(() => {
    const ac = new AbortController();
    const json = (url: string) =>
      fetch(url, { signal: ac.signal }).then((r) => {
        if (!r.ok) throw new Error("bad response");
        return r.json();
      });

    json("/api/site-settings")
      .then((d) => {
        const s = d?.settings;
        if (!s) return;
        setNotice({
          enabled: !!s.noticeEnabled,
          bangla: s.noticeBn || defaultNotice.bangla,
          english: s.noticeEn || defaultNotice.english,
          speed: Number(s.noticeSpeed) || defaultNotice.speed,
          direction: s.noticeDirection === "right" ? "right" : "left",
        });
      })
      .catch(() => {});

    json("/api/circulars?featured=1")
      .then((d) => {
        const list = Array.isArray(d?.circulars) ? d.circulars : [];
        setFeaturedCirculars(
          list.map(
            (c: {
              id: string;
              country: string;
              title: string;
              featuredImageUrl?: string | null;
              circularUrl?: string | null;
            }) => ({
              id: c.id,
              country: c.country,
              title: c.title,
              imageUrl: c.featuredImageUrl || c.circularUrl || "",
              active: true,
            }),
          ),
        );
      })
      .catch(() => {});

    json("/api/popular-countries")
      .then((d) => {
        if (Array.isArray(d?.countries)) {
          setPinnedCountries(d.countries);
        }
      })
      .catch(() => {});

    json("/api/circulars?limit=6")
      .then((d) => {
        const list = Array.isArray(d?.circulars) ? d.circulars : [];
        if (list.length > 0) {
          setHomeJobs(
            list.map(
              (c: {
                id: string;
                country: string;
                flag: string;
                title: string;
                salary: string;
                vacancy: number;
                deadline: string;
              }) => ({
                id: c.id,
                country: c.country,
                flag: c.flag,
                position: c.title,
                salary: c.salary,
                vacancy: c.vacancy,
                deadline: c.deadline,
              }),
            ),
          );
        }
      })
      .catch(() => {});

    return () => ac.abort();
  }, []);

  /* =======================================================
     FILTER COUNTRIES
  ======================================================= */

  const filteredCountries = useMemo(() => {
    const pinnedCodes = new Set(pinnedCountries.map((c) => c.code));
    const merged = [
      ...pinnedCountries,
      ...countries.filter((c) => !pinnedCodes.has(c.code)),
    ];
    const query = countrySearch.toLowerCase();
    return merged.filter((country) =>
      country.name.toLowerCase().includes(query)
    );
  }, [countrySearch, pinnedCountries]);

  /* =======================================================
     VISA CHECK
  ======================================================= */

  const handleVisaCheck = () => {
    if (!selectedCountry) {
      alert(
        isBangla
          ? "দয়া করে একটি দেশ নির্বাচন করুন।"
          : "Please select a country."
      );
      return;
    }

    if (!visaType) {
      alert(
        isBangla
          ? "দয়া করে ভিসার ধরন নির্বাচন করুন।"
          : "Please select a visa type."
      );
      return;
    }

    if (!passportNumber.trim()) {
      alert(
        isBangla
          ? "দয়া করে পাসপোর্ট নম্বর লিখুন।"
          : "Please enter your passport number."
      );
      return;
    }

    if (selectedCountry === "sa") {
      setSaudiServicesOpen(true);
      return;
    }

    if (selectedCountry === "my") {
      setMalaysiaServicesOpen(true);
      return;
    }

    alert(
      isBangla
        ? `${selectedCountry.toUpperCase()} এর Visa Check এখনো সংযুক্ত হয়নি।`
        : `Visa check for ${selectedCountry.toUpperCase()} is not connected yet.`
    );
  };

  /* =======================================================
     TRANSLATION HELPERS
  ======================================================= */

  const getJobCountry = (country: string) => {
    if (!isBangla) return country;

    const map: Record<string, string> = {
      "Saudi Arabia": "সৌদি আরব",
      Malaysia: "মালয়েশিয়া",
      UAE: "সংযুক্ত আরব আমিরাত",
      Qatar: "কাতার",
      Oman: "ওমান",
    };

    return map[country] || country;
  };

  const getJobPosition = (position: string) => {
    if (!isBangla) return position;

    const map: Record<string, string> = {
      Driver: "ড্রাইভার",
      "Factory Worker": "ফ্যাক্টরি কর্মী",
      Welder: "ওয়েল্ডার",
      Electrician: "ইলেকট্রিশিয়ান",
      Cleaner: "ক্লিনার",
    };

    return map[position] || position;
  };

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <main className="min-h-screen bg-white">

      {/* ===================================================
          TOP BAR
      =================================================== */}

      <div className="bg-[#071B41] text-sm text-white">
        <div className="mx-[192px] flex items-center justify-between py-2 max-md:mx-0 max-md:justify-center max-md:px-4">

          <div className="flex items-center gap-5 max-md:hidden">
            <span>
              ✉ info@gointernationalbd.com
            </span>

            <span className="opacity-50">|</span>

            <span>
              ☎ +88 01872 32 75 75
            </span>
          </div>

          <div className="flex items-center gap-2 text-white">
            <span className="text-gray-300">
              🕐
            </span>

            <span>
              {currentTime || "--:--:--"}
            </span>
          </div>

          <div className="flex items-center gap-5 max-md:hidden">
            <span>
              {isBangla ? "যোগাযোগ :" : "Follow Us :"}
            </span>

            <a
              href="https://www.facebook.com/share/14o1WjfT3XY/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-blue-300"
            >
              Facebook
            </a>

            <span>YouTube</span>
            <span>Instagram</span>
            <span>LinkedIn</span>
          </div>
        </div>
      </div>

      {/* ===================================================
          MAIN HEADER
      =================================================== */}

      <header className="border-b border-gray-200 bg-white">

        <div className="relative mx-[192px] flex items-center justify-between py-2 max-md:mx-0 max-md:gap-2 max-md:px-4 max-md:py-0.5">

          {/* LOGO + COMPANY */}

          <div className="flex shrink-0 items-center max-md:min-w-0 max-md:flex-1">

            <div className="mr-3 flex h-12 w-24 shrink-0 items-center justify-center max-md:mr-1.5 max-md:h-14 max-md:w-14">

              <Link
                href="/"
                aria-label="Go to Home"
              >
                <img
                  src="/logo.svg"
                  alt="GO International BD Logo"
                  className="h-30 w-auto cursor-pointer object-contain transition-all duration-200 hover:scale-105 hover:opacity-90 max-md:h-14"
                />
              </Link>

            </div>

            <div className="max-md:min-w-0 max-md:flex-1 max-md:text-center">

              <div className="text-2xl font-bold tracking-tight max-md:text-[15px]">
                <span className="text-[#0B4DBB]">
                  GO INTERNATIONAL
                </span>{" "}
                <span className="text-red-500">
                  BD
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-600 max-md:mt-0.5 max-md:text-[9px] max-md:leading-tight">
                {isBangla
                  ? "অফিসিয়াল ভিসা চেক ও ইমিগ্রেশন সহকারী"
                  : "Official Visa Check & Immigration Assistant"}
              </p>

            </div>

          </div>

          {/* NAVIGATION */}

          <nav className="flex items-center gap-8 text-[17px] max-lg:hidden">

            <Link
              href="/"
              className="text-blue-600"
            >
              {isBangla ? "হোম" : "Home"}
            </Link>

            <a
              href="#visa-check"
              className="text-gray-800 hover:text-blue-600"
            >
              {isBangla ? "ভিসা চেক" : "Visa Check"}
            </a>

            <a
              href="#ai-assistant"
              className="text-gray-800 hover:text-blue-600"
            >
              {isBangla ? "AI সহকারী" : "AI Assistant"}
            </a>

            <Link
              href="/jobs"
              className="text-gray-800 hover:text-blue-600"
            >
              {isBangla ? "চাকরি" : "Jobs"}
            </Link>

            <a
              href="#news"
              className="text-gray-800 hover:text-blue-600"
            >
              {isBangla ? "নিউজ" : "News"}
            </a>

            <a
              href="#about"
              className="text-gray-800 hover:text-blue-600"
            >
              {isBangla ? "আমাদের সম্পর্কে" : "About Us"}
            </a>

            <a
              href="#contact"
              className="text-gray-800 hover:text-blue-600"
            >
              {isBangla ? "যোগাযোগ" : "Contact"}
            </a>

          </nav>

          {/* LANGUAGE / LOGIN */}

          <div className="flex shrink-0 items-center gap-3 max-md:gap-1.5">

            <button
              type="button"
              onClick={() =>
                setLanguage((current) =>
                  current === "bn" ? "en" : "bn"
                )
              }
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 max-md:px-2.5 max-md:py-1.5 max-md:text-[11px]"
            >
              {isBangla ? "English" : "বাংলা"}
            </button>

            <button className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-500 hover:bg-gray-50 max-md:hidden">
              {isBangla ? "লগইন" : "Login"}
            </button>

            <button className="rounded-lg bg-blue-600 px-6 py-2.5 text-white hover:bg-blue-700 max-md:hidden">
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
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {isBangla ? "রেজিস্টার" : "Register"}
                </button>
              </div>
            </>
          )}

        </div>

      </header>

      {/* ===================================================
          HERO SECTION
      =================================================== */}

      <section
        id="visa-check"
        className="w-full bg-white"
      >

        <div className="mx-[192px] max-md:mx-0">

          {/* IMAGE + TEXT OVERLAY */}

          <div className="relative">

          <img
            src="/hero.png"
            alt="Go International BD Travel"
            className="block h-auto w-full"
          />

          <div className="py-8 max-md:py-0 xl:absolute xl:inset-0 xl:z-10 xl:flex xl:items-center xl:py-0">

            <div className="w-full px-12 max-md:px-4">

              <div className="max-w-[600px] max-md:absolute max-md:left-4 max-md:top-2.5 max-md:z-10 max-md:max-w-[67%]">

                {/* BADGE */}

                <div className="relative -top-2 mb-6 inline-flex items-center rounded-full border border-blue-200 bg-white/95 px-5 py-2 text-sm text-blue-600 shadow-md max-md:top-0 max-md:mb-1.5 max-md:px-2 max-md:py-0.5 max-md:text-[8px] max-md:shadow-sm">

                  <span>🛡️</span>

                  <span className="ml-2">
                    {isBangla
                      ? "১০০+ দেশের অফিসিয়াল ভিসা চেক"
                      : "100+ Countries Official Visa Check"}
                  </span>

                </div>

                {/* TITLE */}

                <h1 className="relative -top-5 text-5xl font-bold leading-tight text-[#000000] max-lg:text-4xl max-md:top-0 max-md:text-[19px] max-md:leading-tight">

                  {isBangla ? (
                    <>
                      অফিসিয়াল{" "}
                      <span className="text-blue-600">
                        ভিসা স্ট্যাটাস
                      </span>
                      <br />
                      <span className="whitespace-nowrap">
                         চেক করুন
                      </span>
                    </>
                  ) : (
                    <>
                      Check Official{" "}
                      <span className="text-blue-600">
                        Visa Status
                      </span>
                      <br />
                      for Multiple Countries
                    </>
                  )}

                </h1>

                {/* DESCRIPTION */}

                <p className="relative -top-5 mt-4 max-w-[600px] text-lg leading-7 text-gray-700 max-md:top-0 max-md:mt-1.5 max-md:text-[8px] max-md:font-medium max-md:leading-snug max-md:text-balance">

                  {isBangla
                    ? "সরকারি উৎস থেকে সরাসরি আপনার ভিসার স্ট্যাটাস চেক করুন। দ্রুত, নির্ভরযোগ্য ও নিরাপদ।"
                    : "Check your visa status directly from official government sources. Fast, reliable and 100% secure."}

                </p>

                </div>

                {/* VISA CHECK BOX */}

                <div className="mt-8 w-full max-w-[600px] xl:max-w-[760px] rounded-2xl bg-white p-2 shadow-xl max-md:mt-3 max-md:p-1.5 xl:relative xl:top-32">

                  <div className="flex flex-wrap items-stretch gap-2 max-md:grid max-md:grid-cols-2 max-md:gap-1.5">

                    {/* COUNTRY */}

                    <select
                      value={selectedCountry}
                      onChange={(e) =>
                        setSelectedCountry(e.target.value)
                      }
                      className="h-14 min-w-[160px] flex-1 rounded-xl border border-gray-200 bg-white px-3 text-gray-700 outline-none focus:border-blue-500 max-md:h-10 max-md:min-w-0 max-md:px-2 max-md:text-[11px]"
                    >

                      <option value="">
                        {isBangla
                          ? "দেশ নির্বাচন করুন"
                          : "Select Country"}
                      </option>

                      {countries.map((country) => (
                        <option
                          key={country.code}
                          value={country.code}
                        >
                          {country.name}
                        </option>
                      ))}

                    </select>

                    {/* VISA TYPE */}

                    <select
                      value={visaType}
                      onChange={(e) =>
                        setVisaType(e.target.value)
                      }
                      className="h-14 min-w-[160px] flex-1 rounded-xl border border-gray-200 bg-white px-3 text-gray-700 outline-none focus:border-blue-500 max-md:h-10 max-md:min-w-0 max-md:px-2 max-md:text-[11px]"
                    >

                      <option value="">
                        {isBangla
                          ? "ভিসার ধরন"
                          : "Select Visa Type"}
                      </option>

                      <option value="work">
                        {isBangla
                          ? "ওয়ার্ক ভিসা"
                          : "Work Visa"}
                      </option>

                      <option value="tourist">
                        {isBangla
                          ? "ট্যুরিস্ট ভিসা"
                          : "Tourist Visa"}
                      </option>

                      <option value="student">
                        {isBangla
                          ? "স্টুডেন্ট ভিসা"
                          : "Student Visa"}
                      </option>

                      <option value="business">
                        {isBangla
                          ? "বিজনেস ভিসা"
                          : "Business Visa"}
                      </option>

                      <option value="family">
                        {isBangla
                          ? "ফ্যামিলি ভিসা"
                          : "Family Visa"}
                      </option>

                      <option value="transit">
                        {isBangla
                          ? "ট্রানজিট ভিসা"
                          : "Transit Visa"}
                      </option>

                    </select>

                    {/* PASSPORT */}

                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) =>
                        setPassportNumber(e.target.value)
                      }
                      placeholder={
                        isBangla
                          ? "পাসপোর্ট নম্বর"
                          : "Passport Number"
                      }
                      className="h-14 min-w-[180px] flex-1 rounded-xl border border-gray-200 bg-white px-4 text-gray-700 outline-none placeholder:text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 max-md:h-10 max-md:min-w-0 max-md:px-2 max-md:text-[11px]"
                    />

                    {/* BUTTON */}

                    <button
                      type="button"
                      onClick={handleVisaCheck}
                      className="h-14 min-w-[160px] shrink-0 rounded-xl bg-blue-600 px-5 text-sm font-semibold leading-tight text-white transition hover:bg-blue-700 max-md:h-10 max-md:min-w-0 max-md:px-1 max-md:text-[10px] max-md:leading-none"
                    >
                      🔍{" "}
                      {isBangla
                        ? "ভিসা চেক করুন"
                        : "Check Visa"}
                      <br />
                      {isBangla ? "এখনই" : "Now"}
                    </button>

                  </div>


                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          SCROLLING NOTICE BOARD
      =================================================== */}

      {notice.enabled && (
        <section className="w-full bg-white py-3">

  <div className="mx-[192px] flex overflow-hidden rounded-xl border border-blue-100 bg-blue-50 shadow-sm max-md:mx-4">

            <div className="z-10 flex shrink-0 items-center bg-[#0B4DBB] px-5 py-3 font-semibold text-white shadow-md">

              📢{" "}
              {isBangla
                ? "বিশেষ বিজ্ঞপ্তি"
                : "Special Notice"}

            </div>

            <div className="relative flex flex-1 overflow-hidden">

              <div
                className="notice-marquee flex min-w-max items-center whitespace-nowrap py-3"
                style={{
                  animationDuration: `${Math.max(
                    5,
                    notice.speed
                  )}s`,
                  animationDirection:
                    notice.direction === "right"
                      ? "reverse"
                      : "normal",
                }}
              >

                <span className="mx-8 text-sm font-medium text-[#0B2A55]">
                  {isBangla
                    ? notice.bangla
                    : notice.english}
                </span>

                <span className="mx-8 text-sm font-medium text-[#0B2A55]">
                  {isBangla
                    ? notice.bangla
                    : notice.english}
                </span>

                <span className="mx-8 text-sm font-medium text-[#0B2A55]">
                  {isBangla
                    ? notice.bangla
                    : notice.english}
                </span>

              </div>

            </div>

          </div>

        </section>
      )}

      {/* ===================================================
          POPULAR COUNTRIES
      =================================================== */}

      <section className="w-full bg-white py-8">

        <div className="mx-[165px] px-6 max-md:mx-0">

          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">

            <div className="mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">

              <h2 className="text-xl font-bold text-[#0B2A55]">
                {isBangla
                  ? "জনপ্রিয় দেশসমূহ"
                  : "Popular Countries"}
              </h2>

              <div className="relative z-20 w-full max-w-[280px]">

                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>

                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) =>
                    setCountrySearch(e.target.value)
                  }
                  placeholder={
                    isBangla
                      ? "দেশ খুঁজুন..."
                      : "Search country..."
                  }
                  className="relative z-20 w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

            <div className="overflow-x-auto pb-2">

              <div className="flex min-w-max gap-6">

                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      if (country.code === "my") {
                        setMalaysiaServicesOpen(true);
                      }

                      if (country.code === "sa") {
                        setSaudiServicesOpen(true);
                      }
                    }}
                    className="group w-[95px] flex-shrink-0 text-center"
                  >

                    <div className="mx-auto flex h-14 w-20 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-blue-300 group-hover:shadow-md">

                      <img
                        src={`/flags/${country.code}.svg`}
                        alt={country.name}
                        className="h-full w-full object-cover"
                      />

                    </div>

                    <p className="mt-2 whitespace-nowrap text-sm font-medium text-gray-700 group-hover:text-blue-600">
                      {country.name}
                    </p>

                  </button>
                ))}

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          QUICK SERVICES
      =================================================== */}

      <section className="w-full bg-white pb-8">

        <div className="mx-[165px] px-6 max-md:mx-0">

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

            {/* JOBS */}

            <Link
              href="/jobs"
              className="block rounded-2xl border border-purple-100 bg-purple-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >

              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100">

                <img
                  src="/technica-bage.svg"
                  alt="Technical Badge"
                  className="h-10 w-10 object-contain"
                />

              </div>

              <h3 className="text-lg font-bold text-[#0B2A55]">
                {isBangla
                  ? "চাকরির সার্কুলার"
                  : "Job Circular"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {isBangla
                  ? "বিশ্বস্ত উৎস থেকে সর্বশেষ বিদেশি চাকরির সুযোগ খুঁজুন।"
                  : "Find latest overseas jobs from reliable sources."}
              </p>

              <div className="mt-5 font-semibold text-purple-600 hover:text-purple-700">
                {isBangla
                  ? "চাকরি দেখুন →"
                  : "View Jobs →"}
              </div>

            </Link>

            {/* SKILL TRAINING */}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">

                <img
                  src="/technical-training.svg"
                  alt="Technical Training"
                  className="h-10 w-10 object-contain"
                />

              </div>

              <h3 className="text-lg font-bold text-[#0B2A55]">
                {isBangla
                  ? "দক্ষতা প্রশিক্ষণ"
                  : "Skill Training"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {isBangla
                  ? "প্রযুক্তিগত প্রশিক্ষণে অংশ নিয়ে আপনার ক্যারিয়ারের জন্য প্রয়োজনীয় বাস্তব দক্ষতা তৈরি করুন।"
                  : "Enroll in technical training programs and develop practical skills for your career."}
              </p>

              <button className="mt-5 font-semibold text-blue-600 hover:text-blue-700">
                {isBangla
                  ? "প্রশিক্ষণ দেখুন →"
                  : "Explore Training →"}
              </button>

            </div>

            

            {/* TRACK APPLICATION */}

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100 text-3xl">
                📋
              </div>

              <h3 className="text-lg font-bold text-[#0B2A55]">
                {isBangla
                  ? "আবেদন ট্র্যাক করুন"
                  : "Track Application"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {isBangla
                  ? "আপনার ভিসা অথবা আবেদনের বর্তমান স্ট্যাটাস সহজেই দেখুন।"
                  : "Track your visa or application status easily."}
              </p>

              <button className="mt-5 font-semibold text-orange-600 hover:text-orange-700">
                {isBangla
                  ? "এখনই ট্র্যাক করুন →"
                  : "Track Now →"}
              </button>

            </div>

            {/* AI */}

            <div
              id="ai-assistant"
              className="rounded-2xl border border-green-100 bg-green-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >

              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-3xl">
                🤖
              </div>

              <h3 className="text-lg font-bold text-[#0B2A55]">
                {isBangla
                  ? "AI ভিসা সহকারী"
                  : "AI Visa Assistant"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {isBangla
                  ? "ভিসা, চাকরি, প্রয়োজনীয় কাগজপত্র এবং আরও অনেক কিছু সম্পর্কে প্রশ্ন করুন।"
                  : "Ask anything about visa, jobs, requirements and more."}
              </p>

              <button className="mt-5 font-semibold text-green-600 hover:text-green-700">
                {isBangla
                  ? "চ্যাট শুরু করুন →"
                  : "Start Chat →"}
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          LATEST JOB CIRCULARS
      =================================================== */}

      <section
        id="jobs"
        className="w-full bg-[#F8FAFC] py-12"
      >

        <div className="mx-[165px] px-6 max-md:mx-0">

          <div className="mb-7 flex items-end justify-between">

            <div>

              <p className="mb-2 text-sm font-semibold text-blue-600">
                {isBangla
                  ? "সর্বশেষ সুযোগ"
                  : "LATEST OPPORTUNITIES"}
              </p>

              <h2 className="text-3xl font-bold text-[#0B2A55]">
                {isBangla
                  ? "সর্বশেষ চাকরির সার্কুলার"
                  : "Latest Job Circulars"}
              </h2>

              <p className="mt-2 text-gray-600">
                {isBangla
                  ? "বিদেশে কাজের সর্বশেষ সুযোগগুলো এক জায়গায় দেখুন।"
                  : "Explore the latest overseas employment opportunities in one place."}
              </p>

            </div>

            <Link
              href="/jobs"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              {isBangla
                ? "সব চাকরি দেখুন →"
                : "View All Jobs →"}
            </Link>

          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

            {homeJobs.map((job) => (

              <div
                key={job.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <span className="text-2xl">
                      {job.flag}
                    </span>

                    <span className="font-semibold text-[#0B2A55]">
                      {getJobCountry(job.country)}
                    </span>

                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                    {isBangla ? "সক্রিয়" : "Active"}
                  </span>

                </div>

                <div className="mt-5">

                  <h3 className="text-lg font-bold text-[#0B2A55]">
                    {getJobPosition(job.position)}
                  </h3>

                  <div className="mt-4 space-y-2 text-sm">

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {isBangla ? "বেতন" : "Salary"}
                      </span>

                      <span className="font-semibold text-gray-800">
                        {job.salary}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {isBangla ? "পদসংখ্যা" : "Vacancy"}
                      </span>

                      <span className="font-semibold text-gray-800">
                        {job.vacancy}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {isBangla
                          ? "শেষ তারিখ"
                          : "Deadline"}
                      </span>

                      <span className="font-semibold text-red-500">
                        {job.deadline}
                      </span>
                    </div>

                  </div>

                </div>

                <Link
                  href="/jobs"
                  className="mt-5 block rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {isBangla
                    ? "বিস্তারিত দেখুন"
                    : "View Details"}
                </Link>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* ===================================================
          CV BUILDER + NOTICE BOARD
      =================================================== */}

      <CvAndNoticeSection isBangla={isBangla} />

      {/* ===================================================
          FEATURED CIRCULARS
      =================================================== */}

      {featuredCirculars.filter((item) => item.active).length > 0 && (

        <section className="w-full bg-white py-12">

          <div className="mx-[165px] px-6 max-md:mx-0">

            <div className="mb-7">

              <p className="mb-2 text-sm font-semibold text-purple-600">
                {isBangla
                  ? "নিয়োগ বিজ্ঞপ্তি"
                  : "RECRUITMENT CIRCULARS"}
              </p>

              <h2 className="text-3xl font-bold text-[#0B2A55]">
                {isBangla
                  ? "বিশেষ সার্কুলার"
                  : "Featured Circulars"}
              </h2>

              <p className="mt-2 text-gray-600">
                {isBangla
                  ? "অফিস থেকে প্রকাশিত গুরুত্বপূর্ণ সার্কুলারগুলো দেখুন।"
                  : "View important recruitment circulars published by our office."}
              </p>

            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

              {featuredCirculars
                .filter((item) => item.active)
                .map((circular) => (

                  <div
                    key={circular.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >

                    <div className="h-52 overflow-hidden bg-gray-100">

                      <img
                        src={circular.imageUrl}
                        alt={circular.title}
                        className="h-full w-full object-cover"
                      />

                    </div>

                    <div className="p-5">

                      <p className="text-sm font-medium text-blue-600">
                        {circular.country}
                      </p>

                      <h3 className="mt-1 font-bold text-[#0B2A55]">
                        {circular.title}
                      </h3>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCircular(circular)
                        }
                        className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        {isBangla
                          ? "সার্কুলার দেখুন"
                          : "View Circular"}
                      </button>

                    </div>

                  </div>

                ))}

            </div>

          </div>

        </section>

      )}

      {/* ===================================================
          HOW IT WORKS
      =================================================== */}

      <section className="w-full bg-[#F8FAFC] py-14">

        <div className="mx-[165px] px-6 max-md:mx-0">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-sm font-semibold text-blue-600">
              {isBangla
                ? "সহজ প্রক্রিয়া"
                : "SIMPLE PROCESS"}
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#0B2A55]">
              {isBangla
                ? "কীভাবে কাজ করে?"
                : "How It Works"}
            </h2>

            <p className="mt-3 text-gray-600">
              {isBangla
                ? "আপনার পছন্দের চাকরি খুঁজে আবেদন করার সহজ ধাপ।"
                : "Simple steps to find and apply for your desired overseas job."}
            </p>

          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

            {[
              {
                number: "01",
                icon: "🔎",
                bn: "সার্কুলার নির্বাচন করুন",
                en: "Choose a Circular",
              },
              {
                number: "02",
                icon: "📄",
                bn: "তথ্য ও যোগ্যতা দেখুন",
                en: "Check Requirements",
              },
              {
                number: "03",
                icon: "📝",
                bn: "আবেদন করুন",
                en: "Submit Application",
              },
              {
                number: "04",
                icon: "📊",
                bn: "আবেদন ট্র্যাক করুন",
                en: "Track Application",
              },
            ].map((item) => (

              <div
                key={item.number}
                className="relative rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm"
              >

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                  {item.icon}
                </div>

                <div className="mt-2 text-xs font-bold text-blue-500">
                  {item.number}
                </div>

                <h3 className="mt-2 font-bold text-[#0B2A55]">
                  {isBangla ? item.bn : item.en}
                </h3>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* ===================================================
          WHY CHOOSE US
      =================================================== */}

      <section
        id="about"
        className="w-full bg-white py-14"
      >

        <div className="mx-[165px] px-6 max-md:mx-0">

          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">

            <div>

              <p className="text-sm font-semibold text-blue-600">
                {isBangla
                  ? "কেন আমাদের বেছে নেবেন"
                  : "WHY CHOOSE US"}
              </p>

              <h2 className="mt-2 text-3xl font-bold text-[#0B2A55]">
                {isBangla
                  ? "বিশ্বস্ত তথ্য ও সহজ সেবা"
                  : "Reliable Information & Easy Service"}
              </h2>

              <p className="mt-4 leading-7 text-gray-600">
                {isBangla
                  ? "বিদেশে চাকরি ও ভিসা সংক্রান্ত প্রয়োজনীয় তথ্য সহজভাবে পাওয়ার জন্য GO International BD একটি নির্ভরযোগ্য প্ল্যাটফর্ম হিসেবে কাজ করছে।"
                  : "GO International BD helps users access overseas job and visa-related information through a simple and reliable platform."}
              </p>

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {[
                {
                  icon: "✅",
                  bn: "Verified Job Information",
                  en: "Verified Job Information",
                },
                {
                  icon: "🛡️",
                  bn: "Secure Application",
                  en: "Secure Application",
                },
                {
                  icon: "📊",
                  bn: "Easy Application Tracking",
                  en: "Easy Application Tracking",
                },
                {
                  icon: "🌍",
                  bn: "Visa Checking Assistance",
                  en: "Visa Checking Assistance",
                },
              ].map((item) => (

                <div
                  key={item.en}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                >

                  <div className="text-2xl">
                    {item.icon}
                  </div>

                  <h3 className="mt-3 font-bold text-[#0B2A55]">
                    {isBangla
                      ? item.bn
                      : item.en}
                  </h3>

                </div>

              ))}

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          STATISTICS
      =================================================== */}

      <section className="w-full bg-[#071B41] py-12">

        <div className="mx-[165px] px-6 max-md:mx-0">

          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">

            {[
              {
                number: "50+",
                bn: "দেশ",
                en: "Countries",
              },
              {
                number: "200+",
                bn: "চাকরির সুযোগ",
                en: "Job Vacancies",
              },
              {
                number: "1,000+",
                bn: "আবেদন",
                en: "Applications",
              },
              {
                number: "24/7",
                bn: "অনলাইন সহায়তা",
                en: "Online Assistance",
              },
            ].map((item) => (

              <div
                key={item.en}
                className="text-center"
              >

                <div className="text-3xl font-bold text-white">
                  {item.number}
                </div>

                <p className="mt-2 text-sm text-blue-100">
                  {isBangla
                    ? item.bn
                    : item.en}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* ===================================================
          AI VISA ASSISTANT
      =================================================== */}

      <section className="w-full bg-white py-14">

        <div className="mx-[165px] px-6 max-md:mx-0">

          <div className="rounded-3xl border border-green-100 bg-green-50 p-8 md:p-12">

            <div className="flex flex-col items-center justify-between gap-8 md:flex-row">

              <div className="max-w-2xl">

                <div className="text-4xl">
                  🤖
                </div>

                <h2 className="mt-4 text-3xl font-bold text-[#0B2A55]">
                  {isBangla
                    ? "আপনার AI Visa Assistant"
                    : "Your AI Visa Assistant"}
                </h2>

                <p className="mt-3 leading-7 text-gray-600">
                  {isBangla
                    ? "ভিসা, বিদেশে চাকরি, প্রয়োজনীয় কাগজপত্র, আবেদন প্রক্রিয়া এবং আরও অনেক বিষয়ে আপনার প্রশ্ন করুন।"
                    : "Ask questions about visas, overseas jobs, documents, application procedures and more."}
                </p>

              </div>

              <button
                type="button"
                className="rounded-xl bg-green-600 px-7 py-4 font-semibold text-white shadow-sm transition hover:bg-green-700"
              >
                {isBangla
                  ? "AI Assistant চালু করুন →"
                  : "Start AI Assistant →"}
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          FAQ
      =================================================== */}

      <section className="w-full bg-[#F8FAFC] py-14">

        <div className="mx-auto max-w-4xl px-6">

          <div className="text-center">

            <p className="text-sm font-semibold text-blue-600">
              FAQ
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#0B2A55]">
              {isBangla
                ? "সাধারণ প্রশ্ন"
                : "Frequently Asked Questions"}
            </h2>

          </div>

          <div className="mt-8 space-y-4">

            {[
              {
                bnQ: "বিদেশে চাকরির জন্য কী কী প্রয়োজন?",
                enQ: "What is required for an overseas job?",
                bnA: "চাকরির ধরন অনুযায়ী পাসপোর্ট, প্রয়োজনীয় অভিজ্ঞতা, মেডিকেল ফিটনেস এবং অন্যান্য কাগজপত্র প্রয়োজন হতে পারে।",
                enA: "Depending on the job, you may need a valid passport, relevant experience, medical fitness and other required documents.",
              },
              {
                bnQ: "চাকরির সার্কুলার কোথায় দেখতে পারি?",
                enQ: "Where can I find job circulars?",
                bnA: "Jobs page-এ সর্বশেষ চাকরির সার্কুলারগুলো দেখতে পারবেন।",
                enA: "You can find the latest job circulars on the Jobs page.",
              },
              {
                bnQ: "আবেদনের স্ট্যাটাস কীভাবে দেখব?",
                enQ: "How can I track my application?",
                bnA: "Track Application service ব্যবহার করে আপনার আবেদনের স্ট্যাটাস দেখা যাবে।",
                enA: "You can use the Track Application service to check your application status.",
              },
              {
                bnQ: "ভিসা স্ট্যাটাস কীভাবে চেক করব?",
                enQ: "How can I check my visa status?",
                bnA: "Home Page-এর Visa Check section থেকে দেশ ও ভিসার ধরন নির্বাচন করে চেক করতে পারবেন।",
                enA: "Use the Visa Check section on the Home Page to select your country and visa type.",
              },
            ].map((item) => (

              <details
                key={item.enQ}
                className="group rounded-2xl border border-gray-200 bg-white p-5"
              >

                <summary className="cursor-pointer list-none font-semibold text-[#0B2A55]">
                  {isBangla
                    ? item.bnQ
                    : item.enQ}

                  <span className="float-right text-blue-600">
                    +
                  </span>
                </summary>

                <p className="mt-4 border-t border-gray-100 pt-4 text-sm leading-6 text-gray-600">
                  {isBangla
                    ? item.bnA
                    : item.enA}
                </p>

              </details>

            ))}

          </div>

        </div>

      </section>

      {/* ===================================================
          CONTACT / SUPPORT
      =================================================== */}

      <section
        id="contact"
        className="w-full bg-white py-14"
      >

        <div className="mx-[165px] px-6 max-md:mx-0">

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm md:p-10">

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">

              <div>

                <div className="text-3xl">
                  📞
                </div>

                <h3 className="mt-3 font-bold text-[#0B2A55]">
                  {isBangla
                    ? "ফোন করুন"
                    : "Call Us"}
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  +88 01872 32 75 75
                </p>

              </div>

              <div>

                <div className="text-3xl">
                  💬
                </div>

                <h3 className="mt-3 font-bold text-[#0B2A55]">
                  {isBangla
                    ? "সহায়তা নিন"
                    : "Get Support"}
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  {isBangla
                    ? "আমাদের টিমের সাথে যোগাযোগ করুন।"
                    : "Contact our support team for assistance."}
                </p>

              </div>

              <div>

                <div className="text-3xl">
                  ✉️
                </div>

                <h3 className="mt-3 font-bold text-[#0B2A55]">
                  {isBangla
                    ? "ইমেইল"
                    : "Email"}
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  info@gointernationalbd.com
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="bg-[#071B41] py-10 text-white">

        <div className="mx-[165px] px-6 max-md:mx-0">

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">

            <div>

              <div className="text-xl font-bold">
                GO INTERNATIONAL{" "}
                <span className="text-red-400">
                  BD
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-blue-100">
                {isBangla
                  ? "বিদেশে চাকরি, ভিসা চেক ও ইমিগ্রেশন সহায়তার জন্য আপনার বিশ্বস্ত অনলাইন প্ল্যাটফর্ম।"
                  : "Your trusted online platform for overseas jobs, visa checking and immigration assistance."}
              </p>

            </div>

            <div>

              <h3 className="font-semibold">
                {isBangla
                  ? "দ্রুত লিংক"
                  : "Quick Links"}
              </h3>

              <div className="mt-4 space-y-2 text-sm text-blue-100">

                <Link
                  href="/"
                  className="block hover:text-white"
                >
                  {isBangla ? "হোম" : "Home"}
                </Link>

                <Link
                  href="/jobs"
                  className="block hover:text-white"
                >
                  {isBangla ? "চাকরি" : "Jobs"}
                </Link>

                <a
                  href="#visa-check"
                  className="block hover:text-white"
                >
                  {isBangla ? "ভিসা চেক" : "Visa Check"}
                </a>

              </div>

            </div>

            <div>

              <h3 className="font-semibold">
                {isBangla
                  ? "সেবা"
                  : "Services"}
              </h3>

              <div className="mt-4 space-y-2 text-sm text-blue-100">

                <p>
                  {isBangla
                    ? "ভিসা চেক"
                    : "Visa Check"}
                </p>

                <p>
                  {isBangla
                    ? "চাকরির সার্কুলার"
                    : "Job Circular"}
                </p>

                <p>
                  {isBangla
                    ? "আবেদন ট্র্যাকিং"
                    : "Application Tracking"}
                </p>

                <p>
                  {isBangla
                    ? "AI Assistant"
                    : "AI Assistant"}
                </p>

              </div>

            </div>

            <div>

              <h3 className="font-semibold">
                {isBangla
                  ? "যোগাযোগ"
                  : "Contact"}
              </h3>

              <div className="mt-4 space-y-2 text-sm text-blue-100">

                <p>
                  📞 +88 01872 32 75 75
                </p>

                <p>
                  ✉ info@gointernationalbd.com
                </p>

                <p>
                  📍 Dhaka, Bangladesh
                </p>

              </div>

            </div>

          </div>

          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-blue-200">

            © 2026 GO International BD.{" "}
            {isBangla
              ? "সর্বস্বত্ব সংরক্ষিত।"
              : "All rights reserved."}

          </div>

        </div>

      </footer>

      {/* ===================================================
          SAUDI SERVICE MODAL
      =================================================== */}

      {saudiServicesOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h3 className="text-xl font-bold text-[#0B2A55]">
                  {isBangla
                    ? "সৌদি আরব"
                    : "Saudi Arabia"}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {isBangla
                    ? "চালিয়ে যেতে একটি সেবা নির্বাচন করুন"
                    : "Select a service to continue"}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSaudiServicesOpen(false)
                }
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            <div className="space-y-3">

              <a
                href="https://visa.mofa.gov.sa/VisaPerson/GetApplicantData"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-500 hover:bg-blue-50"
              >

                <div>

                  <div className="font-semibold text-gray-800">
                    🛂{" "}
                    {isBangla
                      ? "সৌদি ভিসা চেক"
                      : "Saudi Visa Check"}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    {isBangla
                      ? "সৌদি ভিসার তথ্য দেখুন"
                      : "Check Saudi visa information"}
                  </div>

                </div>

                <span className="text-blue-600">
                  →
                </span>

              </a>

              <a
                href="https://wafid.com/en/medical-status-search/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-green-500 hover:bg-green-50"
              >

                <div>

                  <div className="font-semibold text-gray-800">
                    🏥{" "}
                    {isBangla
                      ? "সৌদি মেডিকেল চেক"
                      : "Saudi Medical Check"}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    {isBangla
                      ? "Wafid medical status দেখুন"
                      : "Check Wafid medical status"}
                  </div>

                </div>

                <span className="text-green-600">
                  →
                </span>

              </a>

              <a
                href="https://visa.mofa.gov.sa/VisaPerson/CheckMedicalResult"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-purple-500 hover:bg-purple-50"
              >

                <div>

                  <div className="font-semibold text-gray-800">
                    📋{" "}
                    {isBangla
                      ? "মেডিকেল আপডেট চেক"
                      : "Medical Update Check"}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    {isBangla
                      ? "আপডেটেড মেডিকেল রেজাল্ট দেখুন"
                      : "Check updated medical result"}
                  </div>

                </div>

                <span className="text-purple-600">
                  →
                </span>

              </a>

              <a
                href="https://visa.mofa.gov.sa/Enjaz/GetVisaInformation/Person"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-orange-500 hover:bg-orange-50"
              >

                <div>

                  <div className="font-semibold text-gray-800">
                    📄{" "}
                    {isBangla
                      ? "সৌদি Enjaz Check"
                      : "Saudi Enjaz Check"}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    {isBangla
                      ? "Enjaz ভিসা তথ্য দেখুন"
                      : "Check Enjaz visa information"}
                  </div>

                </div>

                <span className="text-orange-600">
                  →
                </span>

              </a>

            </div>

            <button
              type="button"
              onClick={() =>
                setSaudiServicesOpen(false)
              }
              className="mt-5 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {isBangla ? "বন্ধ করুন" : "Close"}
            </button>

          </div>

        </div>

      )}

      {/* ===================================================
          MALAYSIA SERVICE MODAL
      =================================================== */}

      {malaysiaServicesOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h3 className="text-xl font-bold text-[#0B2A55]">
                  {isBangla
                    ? "মালয়েশিয়া"
                    : "Malaysia"}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {isBangla
                    ? "চালিয়ে যেতে একটি সেবা নির্বাচন করুন"
                    : "Select a service to continue"}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setMalaysiaServicesOpen(false)
                }
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            {/* VISA */}

            <a
              href="https://malaysiavisa.imi.gov.my/evisa/check-evisa"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-500 hover:bg-blue-50"
            >

              <div>

                <div className="font-semibold text-gray-800">
                  🛂{" "}
                  {isBangla
                    ? "মালয়েশিয়া ভিসা চেক"
                    : "Malaysia Visa Check"}
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  {isBangla
                    ? "Malaysia eVISA status দেখুন"
                    : "Check Malaysia eVISA status"}
                </div>

              </div>

              <span className="text-blue-600">
                →
              </span>

            </a>

            {/* MEDICAL */}

            <div className="rounded-xl border border-gray-200 bg-white p-4">

              <div className="mb-3">

                <div className="font-semibold text-gray-800">
                  🏥{" "}
                  {isBangla
                    ? "মেডিকেল চেক"
                    : "Medical Check"}
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  {isBangla
                    ? "মেডিকেল সেন্টার নির্বাচন করুন"
                    : "Select medical center"}
                </div>

              </div>

              <a
                href="https://rhmcdhk.com/malaysia-medical-report/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 transition hover:border-green-500 hover:bg-green-50"
              >

                <div>

                  <div className="text-sm font-medium text-gray-800">
                    RHMC Medical Check
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    {isBangla
                      ? "Malaysia medical report দেখুন"
                      : "Check Malaysia medical report"}
                  </div>

                </div>

                <span className="text-green-600">
                  →
                </span>

              </a>

            </div>

            <button
              type="button"
              onClick={() =>
                setMalaysiaServicesOpen(false)
              }
              className="mt-5 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {isBangla ? "বন্ধ করুন" : "Close"}
            </button>

          </div>

        </div>

      )}

      {/* ===================================================
          CIRCULAR FULL VIEW MODAL
      =================================================== */}

      {selectedCircular && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 py-6">

          <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white">

            <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">

              <div>

                <h2 className="font-bold text-[#0B2A55]">
                  {selectedCircular.title}
                </h2>

                <p className="text-sm text-gray-500">
                  {selectedCircular.country}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedCircular(null)
                }
                className="rounded-full px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>

            </div>

            <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-100 p-4">

              <img
                src={selectedCircular.imageUrl}
                alt={selectedCircular.title}
                className="max-h-full max-w-full object-contain"
              />

            </div>

          </div>

        </div>

      )}

      {/* ===================================================
          MARQUEE CSS
      =================================================== */}

      <style jsx>{`
        .notice-marquee {
          animation-name: notice-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .notice-marquee:hover {
          animation-play-state: paused;
        }

        @keyframes notice-scroll {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>

    </main>
  );
}