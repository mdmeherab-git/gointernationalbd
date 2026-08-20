"use client";

import { useLanguage } from "./context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) => {
        setLanguage(e.target.value as "bn" | "en");
      }}
      aria-label="Select language"
      className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-[#0B2A55] outline-none transition hover:border-blue-500 focus:border-blue-500"
    >
      <option value="bn">বাংলা</option>
      <option value="en">English</option>
    </select>
  );
}