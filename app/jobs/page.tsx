"use client";

import { useMemo, useState } from "react";

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

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All Countries");
  const [category, setCategory] = useState("All Categories");

  const [startIndex, setStartIndex] = useState(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        job.country.toLowerCase().includes(searchText) ||
        job.category.toLowerCase().includes(searchText) ||
        job.title.toLowerCase().includes(searchText) ||
        job.sponsor.toLowerCase().includes(searchText);

      const matchesCountry =
        country === "All Countries" || job.country === country;

      const matchesCategory =
        category === "All Categories" || job.category === category;

      return matchesSearch && matchesCountry && matchesCategory;
    });
  }, [search, country, category]);

  const visibleJobs = filteredJobs.slice(startIndex, startIndex + 4);

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

  const resetFilters = () => {
    setSearch("");
    setCountry("All Countries");
    setCategory("All Categories");
    setStartIndex(0);
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#0B2A55]">

      {/* HERO */}
      <section className="bg-[#0B2A55]">
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
          <div className="max-w-3xl">

            <span className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
              🌍 Overseas Employment Opportunities
            </span>

            <h1 className="text-3xl font-bold text-white md:text-5xl">
              Overseas Job Circulars
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 md:text-base">
              Find the latest overseas job opportunities from different
              countries and apply for suitable positions easily.
            </p>

          </div>
        </div>
      </section>

      {/* SEARCH & FILTER */}
      <section className="relative z-10 mx-auto -mt-6 max-w-7xl px-5 md:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-lg md:p-5">

          <div className="grid gap-4 lg:grid-cols-3">

            {/* SEARCH */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setStartIndex(0);
                }}
                placeholder="Search job, country or category..."
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-10 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {countries.map((item) => (
                  <option key={item} value={item}>
                    {item}
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
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-10 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                ▼
              </span>
            </div>

          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">

            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-[#0B2A55]">
                {filteredJobs.length}
              </span>{" "}
              job circulars
            </p>

            {(search ||
              country !== "All Countries" ||
              category !== "All Categories") && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            )}

          </div>
        </div>
      </section>

      {/* JOB CIRCULARS */}
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">

        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Latest Opportunities
          </p>

          <h2 className="mt-1 text-2xl font-bold text-[#0B2A55] md:text-3xl">
            Available Job Circulars
          </h2>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <div className="text-5xl">🔎</div>

            <h3 className="mt-4 text-xl font-bold">
              No jobs found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Try changing your search or filter.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="relative">

            {/* LEFT ARROW */}
            {filteredJobs.length > 4 && (
              <button
                type="button"
                onClick={previousJobs}
                className="absolute -left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-2xl text-blue-600 shadow-lg hover:bg-blue-50 lg:flex"
              >
                ‹
              </button>
            )}

            {/* CARDS */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {visibleJobs.map((job) => (
                <article
                  key={job.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* HEADER */}
                  <div className="border-b border-gray-100 px-5 pb-4 pt-5">

                    <div className="flex items-start justify-between gap-2">

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {job.flag}
                          </span>

                          <h3 className="text-lg font-bold text-[#0B2A55]">
                            {job.country}
                          </h3>
                        </div>

                        <p className="mt-1 text-xs text-gray-500">
                          Sponsor:{" "}
                          <span className="font-semibold text-blue-600">
                            {job.sponsor}
                          </span>
                        </p>
                      </div>

                      {job.isNew && (
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                          NEW
                        </span>
                      )}

                    </div>
                  </div>

                  {/* CIRCULAR PREVIEW */}
                  <div className="mx-4 mt-4 flex h-52 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50">

                    <div className="text-center">
                      <div className="text-5xl">📄</div>

                      <p className="mt-3 font-bold text-[#0B2A55]">
                        {job.country}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {job.category} Job Circular
                      </p>

                      <span className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-[11px] text-gray-500 shadow-sm">
                        Circular Preview
                      </span>
                    </div>

                  </div>

                  {/* CATEGORY */}
                  <div className="px-5 pt-4">
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      {job.category}
                    </span>
                  </div>

                  {/* INFO */}
                  <div className="space-y-2 px-5 pt-4 text-xs text-gray-600">

                    <div className="flex justify-between">
                      <span>Salary</span>
                      <strong className="text-gray-800">
                        {job.salary}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Vacancy</span>
                      <strong className="text-gray-800">
                        {job.vacancy}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Deadline</span>
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
                      className="rounded-xl border border-blue-200 bg-blue-50 px-2 py-3 text-xs font-bold text-blue-700 hover:bg-blue-100"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => setApplyJob(job)}
                      className="rounded-xl bg-blue-600 px-2 py-3 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      Apply Now
                    </button>

                  </div>

                </article>
              ))}

            </div>

            {/* RIGHT ARROW */}
            {filteredJobs.length > 4 && (
              <button
                type="button"
                onClick={nextJobs}
                className="absolute -right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-2xl text-blue-600 shadow-lg hover:bg-blue-50 lg:flex"
              >
                ›
              </button>
            )}

            {/* DOTS */}
            {filteredJobs.length > 4 && (
              <div className="mt-7 flex justify-center gap-2">
                {filteredJobs.map((job, index) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setStartIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      index === startIndex
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

      {/* TRUST SECTION */}
      <section className="mx-auto max-w-7xl px-5 pb-12 md:px-8">

        <div className="grid overflow-hidden rounded-2xl border border-gray-200 bg-white md:grid-cols-4">

          <div className="border-b border-gray-100 p-6 md:border-b-0 md:border-r">
            <div className="text-2xl">🛡️</div>

            <h3 className="mt-3 font-bold">
              Trusted Sources
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Job circulars from verified sources.
            </p>
          </div>

          <div className="border-b border-gray-100 p-6 md:border-b-0 md:border-r">
            <div className="text-2xl">🔄</div>

            <h3 className="mt-3 font-bold">
              Regular Updates
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              New opportunities can be added regularly.
            </p>
          </div>

          <div className="border-b border-gray-100 p-6 md:border-b-0 md:border-r">
            <div className="text-2xl">⚡</div>

            <h3 className="mt-3 font-bold">
              Easy Application
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Find a suitable job and apply easily.
            </p>
          </div>

          <div className="p-6">
            <div className="text-2xl">🔔</div>

            <h3 className="mt-3 font-bold">
              Stay Updated
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Check regularly for new opportunities.
            </p>
          </div>

        </div>
      </section>

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-[#0B2A55]">
                  {selectedJob.flag} {selectedJob.country}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedJob.title} · {selectedJob.category}
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

            <div className="p-6">

              <div className="rounded-xl bg-gray-50 p-8 text-center">
                <div className="text-6xl">📄</div>

                <h3 className="mt-4 text-xl font-bold">
                  {selectedJob.country} Job Circular
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedJob.category}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Sponsor
                  </p>

                  <p className="mt-1 font-bold">
                    {selectedJob.sponsor}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Salary
                  </p>

                  <p className="mt-1 font-bold">
                    {selectedJob.salary}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Vacancy
                  </p>

                  <p className="mt-1 font-bold">
                    {selectedJob.vacancy}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Duty
                  </p>

                  <p className="mt-1 font-bold">
                    {selectedJob.duty}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Accommodation
                  </p>

                  <p className="mt-1 font-bold">
                    {selectedJob.accommodation}
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs text-red-500">
                    Deadline
                  </p>

                  <p className="mt-1 font-bold text-red-700">
                    {selectedJob.deadline}
                  </p>
                </div>

              </div>

              <div className="mt-6">
                <h3 className="font-bold text-[#0B2A55]">
                  Job Description
                </h3>

                <p className="mt-2 text-sm leading-7 text-gray-600">
                  {selectedJob.description}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-[#0B2A55]">
                  Requirements
                </h3>

                <ul className="mt-3 space-y-2">
                  {selectedJob.requirements.map((item) => (
                    <li
                      key={item}
                      className="text-sm text-gray-600"
                    >
                      ✓ {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedJob(null);
                  setApplyJob(selectedJob);
                }}
                className="mt-7 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white hover:bg-blue-700"
              >
                Apply for this Job →
              </button>

            </div>
          </div>
        </div>
      )}

      {/* APPLY MODAL */}
      {applyJob && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-6"
          onClick={() => setApplyJob(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-[#0B2A55]">
                  Apply Now
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {applyJob.country} — {applyJob.title}
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

            <form
              className="space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();

                alert(
                  "Application form is ready. Database connection will be added later."
                );

                setApplyJob(null);
              }}
            >

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Full Name
                </label>

                <input
                  required
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>

                <input
                  required
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Passport Number
                </label>

                <input
                  type="text"
                  placeholder="Enter passport number"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Experience
                </label>

                <textarea
                  rows={3}
                  placeholder="Describe your experience..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Upload CV
                </label>

                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white hover:bg-blue-700"
              >
                Submit Application
              </button>

            </form>
          </div>
        </div>
      )}

    </main>
  );
}