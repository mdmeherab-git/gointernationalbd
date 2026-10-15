"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildWhatsappUrl } from "../lib/whatsapp";

/* "Our Services" cards on the home page. The cards (text, icon, order, link)
   are managed from /admin -> Services; nothing here needs a code change when a
   service is added, edited or switched off. Layout: one column on phones, two
   on tablets, three on desktop. */

type Service = {
  id: string;
  icon: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  link: string;
  buttonBn: string;
  buttonEn: string;
};

// Soft accent per card, cycling, so the grid is colourful but consistent.
const ACCENTS = [
  { ring: "border-blue-100", icon: "bg-blue-100", btn: "text-blue-600 hover:text-blue-700" },
  { ring: "border-purple-100", icon: "bg-purple-100", btn: "text-purple-600 hover:text-purple-700" },
  { ring: "border-green-100", icon: "bg-green-100", btn: "text-green-600 hover:text-green-700" },
  { ring: "border-orange-100", icon: "bg-orange-100", btn: "text-orange-600 hover:text-orange-700" },
  { ring: "border-pink-100", icon: "bg-pink-100", btn: "text-pink-600 hover:text-pink-700" },
  { ring: "border-teal-100", icon: "bg-teal-100", btn: "text-teal-600 hover:text-teal-700" },
];

export default function ServicesSection({ isBangla }: { isBangla: boolean }) {
  const [services, setServices] = useState<Service[] | null>(null);
  const [wa, setWa] = useState({ number: "", message: "" });

  useEffect(() => {
    const ac = new AbortController();

    fetch("/api/services", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : { services: [] }))
      .then((d) => setServices(Array.isArray(d.services) ? d.services : []))
      .catch(() => setServices([]));

    fetch("/api/site-settings", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const st = d?.settings;
        if (st) {
          setWa({
            number: String(st.contactWhatsapp || ""),
            message: String(st.contactWhatsappMessage || ""),
          });
        }
      })
      .catch(() => {});

    return () => ac.abort();
  }, []);

  // Nothing to show (all switched off, or still loading): keep the home page
  // clean rather than an empty heading.
  if (services !== null && services.length === 0) return null;

  const defaultMessage = isBangla
    ? "হ্যালো, আমি GO International BD-এর সেবা সম্পর্কে জানতে চাই।"
    : "Hello, I would like to know about GO International BD services.";

  function renderButton(service: Service, className: string) {
    const label = isBangla ? service.buttonBn : service.buttonEn;
    if (!label || !service.link) return null;
    const text = `${label} →`;

    if (service.link === "whatsapp") {
      const url = buildWhatsappUrl(wa.number, wa.message || defaultMessage);
      if (!url) return null;
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
          {text}
        </a>
      );
    }
    if (service.link.startsWith("/")) {
      return (
        <Link href={service.link} className={className}>
          {text}
        </Link>
      );
    }
    const external = service.link.startsWith("https://");
    return (
      <a
        href={service.link}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={className}
      >
        {text}
      </a>
    );
  }

  return (
    <section id="services" className="w-full scroll-mt-4 bg-white py-10">
      <div className="mx-[165px] px-6 max-md:mx-0 max-md:px-4">
        <div className="mb-7 text-center">
          <h2 className="text-2xl font-extrabold text-[#0B2A55] max-md:text-xl">
            {isBangla ? "আমাদের সেবাসমূহ" : "Our Services"}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            {isBangla
              ? "বিদেশে যাওয়ার প্রতিটি ধাপে আপনার পাশে থাকতে আমরা যে সেবাগুলো দিই।"
              : "The services we offer to stand by you at every step of going abroad."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {services === null
            ? [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-gray-50"
                />
              ))
            : services.map((service, index) => {
                const accent = ACCENTS[index % ACCENTS.length];
                const title = isBangla ? service.titleBn : service.titleEn;
                const desc = isBangla ? service.descBn : service.descEn;

                return (
                  <div
                    key={service.id}
                    className={`group flex h-full gap-4 rounded-2xl border ${accent.ring} bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg max-md:p-4`}
                  >
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${accent.icon} text-3xl max-md:h-12 max-md:w-12 max-md:text-2xl`}
                    >
                      {service.icon}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="text-base font-bold leading-snug text-[#0B2A55] md:text-lg">
                        {title}
                      </h3>
                      {desc && (
                        <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-gray-600">{desc}</p>
                      )}
                      <div className="mt-auto pt-3">
                        {renderButton(service, `inline-block text-sm font-semibold ${accent.btn}`)}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
