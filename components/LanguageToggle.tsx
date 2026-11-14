"use client";

type Lang = "bn" | "en";

/**
 * Language switch: a frosted-glass segmented pill — বাংলা | English.
 * The active side sits under a sliding glass knob in the site blue.
 * Phones get shorter labels (বাং | EN) in the same design.
 */
export default function LanguageToggle({
  language,
  onChange,
}: {
  language: Lang;
  onChange: (next: Lang) => void;
}) {
  const isEn = language === "en";
  const label = (on: boolean) =>
    `relative z-10 px-3 py-1 transition-colors duration-300 max-md:px-2 ${
      on ? "text-white" : "text-[#0B2A55]/60 hover:text-[#0B2A55]"
    }`;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isEn}
      aria-label={isEn ? "Switch to Bangla" : "Switch to English"}
      title={isEn ? "বাংলায় দেখুন" : "View in English"}
      onClick={() => onChange(isEn ? "bn" : "en")}
      className="relative grid shrink-0 grid-cols-2 items-center rounded-full border border-white/70 bg-gradient-to-b from-white/80 to-[#DCE7FA]/70 p-[3px] text-[13px] font-bold shadow-[0_2px_10px_rgba(11,77,187,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[#0B4DBB]/15 backdrop-blur-md max-md:text-[11px]"
    >
      {/* sliding glass knob */}
      <span
        aria-hidden="true"
        className={`absolute top-[3px] bottom-[3px] left-[3px] w-[calc(50%-3px)] rounded-full bg-gradient-to-b from-[#3B7BEA]/90 to-[#0B4DBB]/95 shadow-[0_2px_6px_rgba(11,77,187,0.35),inset_0_1px_0_rgba(255,255,255,0.45)] ring-1 ring-white/40 backdrop-blur-sm transition-transform duration-300 ease-out ${
          isEn ? "translate-x-full" : "translate-x-0"
        }`}
      />

      <span className={label(!isEn)}>
        <span className="max-md:hidden">বাংলা</span>
        <span className="hidden max-md:inline">বাং</span>
      </span>
      <span className={label(isEn)}>
        <span className="max-md:hidden">English</span>
        <span className="hidden max-md:inline">EN</span>
      </span>
    </button>
  );
}
