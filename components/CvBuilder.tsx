"use client";

import { useState } from "react";
import type { CvData, Skill, LanguageSkill } from "../types/cv";
import {
  emptyCvData,
  MAX_LEN,
  EDUCATION_LEVELS,
  JOB_CATEGORIES,
  SKILL_PRESETS,
  LANGUAGE_PRESETS,
  LANGUAGE_LEVELS,
  HOBBY_PRESETS,
  DOCUMENT_TYPES,
  RELIGION_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  SEX_OPTIONS,
  BLOOD_GROUP_OPTIONS,
} from "../types/cv";

/* =========================================================
   CV BUILDER — fixed-slot version

   Matches the reference CV template exactly: a FIXED number
   of entries per section (2 education, 2 references, 3 jobs,
   5 skills, 4 languages, 3 hobbies) rather than an open-ended
   add/remove list. Every input has a maxLength pulled from
   MAX_LEN so nothing can be typed that would overflow its
   fixed box in the PDF.
========================================================= */

const TEXT_INPUT =
  "w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#111827] placeholder:text-gray-400 outline-none focus:border-teal-500 bg-white";
const SMALL_INPUT =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#111827] placeholder:text-gray-400 outline-none focus:border-teal-500 bg-white";
const SELECT_CLASS =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#111827] outline-none focus:border-teal-500 bg-white";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

/* A <select> + optional "Other" free-text field. */
function SelectOrOther({
  value, onChange, options, placeholder, className = SMALL_INPUT, maxLength,
}: {
  value: string; onChange: (v: string) => void; options: string[];
  placeholder: string; className?: string; maxLength?: number;
}) {
  const isCustom = value !== "" && !options.slice(0, -1).includes(value);
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row">
      <select
        value={isCustom ? "Other" : value}
        onChange={(e) => onChange(e.target.value === "Other" ? "" : e.target.value)}
        className={className}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {isCustom && (
        <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength}
          placeholder="নিজে লিখুন / Type your own" className={className} />
      )}
    </div>
  );
}

/* Small inline spinner shown while the passport is being processed. */
function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600 align-[-3px]"
      aria-label="loading"
    />
  );
}

/* Crops an image file to a square, weighted toward the TOP of the
   photo (faces/hair sit near the top in ID-style photos), so the
   circular CV frame doesn't cut off the top of the head. Returns a
   base64 data URL. */
async function smartCropToSquare(file: File): Promise<string> {
  const dataUrl: string = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.src = dataUrl;
  });

  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  // Weight the crop toward the top: only take a small amount of
  // vertical offset (15% of the extra height) instead of centering.
  const extraHeight = img.height - side;
  const sy = extraHeight > 0 ? extraHeight * 0.15 : 0;

  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, 400, 400);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function CvBuilder({ isBangla }: { isBangla: boolean }) {
  const [step, setStep] = useState<"upload" | "form">("upload");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [lowConfidenceWarning, setLowConfidenceWarning] = useState<string | null>(null);
  const [cvData, setCvData] = useState<CvData>(emptyCvData);
  const [generating, setGenerating] = useState(false);
  const [generatingDocsOnly, setGeneratingDocsOnly] = useState(false);
  const [cleanDownloadOpen, setCleanDownloadOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [attachments, setAttachments] = useState<{ id: string; type: string; file: File | null; fileName: string }[]>([]);

  const updateField = <K extends keyof CvData>(key: K, value: CvData[K]) => {
    setCvData((prev) => ({ ...prev, [key]: value }));
  };

  /* ================= PASSPORT UPLOAD ================= */

  const handlePassportUpload = async (file: File) => {
    setExtracting(true);
    setExtractError(null);
    setLowConfidenceWarning(null);
    try {
      const formData = new FormData();
      formData.append("passport", file);
      const res = await fetch("/api/extract-mrz", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setExtractError(json.error || (isBangla ? "তথ্য বের করা যায়নি" : "Could not read passport details"));
        setExtracting(false);
        return;
      }

      const f = json.fields || {};
      const extra = json.extra || {};
      const newlyAutoFilled = new Set<string>();

      if (json.lowConfidenceWarning) setLowConfidenceWarning(json.lowConfidenceWarning);

      setCvData((prev) => {
        const next = {
          ...prev,
          fullName: [f.firstName, f.lastName].filter(Boolean).join(" "),
          dateOfBirth: f.birthDate || "",
          nationality: f.nationality || "",
        };
        if (extra.fatherName?.value) { next.fatherName = extra.fatherName.value; newlyAutoFilled.add("fatherName"); }
        if (extra.motherName?.value) { next.motherName = extra.motherName.value; newlyAutoFilled.add("motherName"); }
        if (extra.address?.value) { next.presentAddress = extra.address.value; newlyAutoFilled.add("presentAddress"); }
        if (extra.phone?.value && !prev.phone) { next.phone = extra.phone.value; newlyAutoFilled.add("phone"); }
        return next;
      });

      setAutoFilledFields(newlyAutoFilled);
      setStep("form");
    } catch {
      setExtractError(isBangla ? "প্রসেস করার সময় সমস্যা হয়েছে, আবার চেষ্টা করুন" : "Something went wrong, please try again");
    } finally {
      setExtracting(false);
    }
  };

  const skipUpload = () => { setExtractError(null); setStep("form"); };

  const handlePhoto = async (file: File) => {
    const cropped = await smartCropToSquare(file);
    updateField("photo", cropped);
  };

  /* ================= FIXED-SLOT UPDATERS ================= */

  const updateJob = (i: number, patch: Partial<CvData["workExperience"][number]>) => {
    const next = [...cvData.workExperience];
    next[i] = { ...next[i], ...patch };
    updateField("workExperience", next);
  };
  const updateEdu = (i: number, patch: Partial<CvData["education"][number]>) => {
    const next = [...cvData.education];
    next[i] = { ...next[i], ...patch };
    updateField("education", next);
  };
  const updateSkill = (i: number, patch: Partial<Skill>) => {
    const next = [...cvData.skills];
    next[i] = { ...next[i], ...patch };
    updateField("skills", next);
  };
  const updateLang = (i: number, patch: Partial<LanguageSkill>) => {
    const next = [...cvData.languages];
    next[i] = { ...next[i], ...patch };
    updateField("languages", next);
  };
  const updateHobby = (i: number, value: string) => {
    const next = [...cvData.hobbies];
    next[i] = value;
    updateField("hobbies", next);
  };
  const updateRef = (i: number, patch: Partial<CvData["references"][number]>) => {
    const next = [...cvData.references];
    next[i] = { ...next[i], ...patch };
    updateField("references", next);
  };

  /* ================= ATTACHMENTS ================= */

  const addAttachment = () => setAttachments((prev) => [...prev, { id: makeId(), type: "", file: null, fileName: "" }]);
  const updateAttachmentType = (id: string, type: string) => setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, type } : a)));
  const updateAttachmentFile = (id: string, file: File) => setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, file, fileName: file.name } : a)));
  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  /* ================= PDF GENERATION ================= */

  function downloadPdfBytes(bytes: Uint8Array, filename: string) {
    // pdf-lib's Uint8Array is typed against a generic ArrayBufferLike,
    // which newer DOM lib typings don't accept as a BlobPart — safe at
    // runtime, so narrow the type here rather than copying the bytes.
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const buildPdfBytes = async (showWatermark: boolean) => {
    const { pdf } = await import("@react-pdf/renderer");
    const { default: CvPdfDocument } = await import("./CvPdfDocument");
    const cvBlob = await pdf(<CvPdfDocument data={cvData} showWatermark={showWatermark} />).toBlob();
    const cvBytes = await cvBlob.arrayBuffer();
    const validAttachments = attachments.filter((a) => a.file) as { id: string; type: string; file: File }[];
    let finalBytes: Uint8Array = new Uint8Array(cvBytes);

    if (validAttachments.length > 0) {
      const { mergeCvWithDocuments } = await import("../utils/mergeCvDocuments");
      finalBytes = await mergeCvWithDocuments(cvBytes, validAttachments);
    }
    return finalBytes;
  };

  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      const finalBytes = await buildPdfBytes(true);
      downloadPdfBytes(finalBytes, `${cvData.fullName || "cv"}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateCleanPdf = async () => {
    if (promoCode.trim() !== "327575") {
      setPromoError(isBangla ? "সঠিক প্রমো কোড দিন।" : "Please enter the correct promo code.");
      return;
    }

    setPromoError("");
    setGenerating(true);
    try {
      const finalBytes = await buildPdfBytes(false);
      downloadPdfBytes(finalBytes, `${cvData.fullName || "cv"}-clean.pdf`);
      setCleanDownloadOpen(false);
      setPromoCode("");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadDocumentsOnly = async () => {
    const validAttachments = attachments.filter((a) => a.file) as { id: string; type: string; file: File }[];
    if (validAttachments.length === 0) return;
    setGeneratingDocsOnly(true);
    try {
      const { mergeDocumentsOnly } = await import("../utils/mergeCvDocuments");
      const bytes = await mergeDocumentsOnly(validAttachments);
      downloadPdfBytes(bytes, `${cvData.fullName || "documents"}-documents.pdf`);
    } finally {
      setGeneratingDocsOnly(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xl md:p-8">

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-xl">📄</div>
        <div>
          <h2 className="text-lg font-bold text-[#0B2A55]">{isBangla ? "সিভি তৈরি করুন" : "Build Your CV"}</h2>
          <p className="text-xs text-gray-500">
            {isBangla ? "নির্দিষ্ট ডিজাইন টেমপ্লেট · এক পেজের সিভি · সম্পূর্ণ ফ্রি" : "Fixed design template · One-page CV · Completely free"}
          </p>
        </div>
      </div>

      {step === "upload" && (
        <div>
          <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-gray-300 bg-[#f8fafc] px-6 py-10 text-center transition hover:border-teal-400">
            <span className="text-3xl">🛂</span>
            <span className="mt-3 text-sm font-semibold text-[#0B2A55]">
              {isBangla ? "পাসপোর্টের ছবি আপলোড করুন" : "Upload your passport photo page"}
            </span>
            <span className="mt-1 text-xs text-gray-500">
              {isBangla ? "নিচের MRZ কোডেড অংশ স্পষ্ট দেখা যায় এমন ছবি দিন" : "Make sure the bottom MRZ code lines are clearly visible"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePassportUpload(file);
            }} />
          </label>

          {extracting && (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-teal-600">
              <Spinner />
              {isBangla ? "তথ্য বের করা হচ্ছে... একটু অপেক্ষা করুন" : "Extracting details... please wait"}
            </p>
          )}
          {extractError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">{extractError}</p>}

          <button type="button" onClick={skipUpload} className="mt-4 w-full text-center text-xs font-semibold text-teal-600 hover:text-teal-700">
            {isBangla ? "পাসপোর্ট ছাড়াই ম্যানুয়ালি তথ্য দিন →" : "Skip and enter details manually →"}
          </button>

          <p className="mt-6 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            <span>🛡️</span>
            <span>
              {isBangla
                ? "আপনার পাসপোর্টের ছবি সার্ভারে সংরক্ষণ করা হয় না — শুধু তথ্য বের করার জন্য সাময়িকভাবে প্রসেস হয়ে সাথে সাথে মুছে যায়।"
                : "Your passport image is never stored — it's processed briefly to extract data and immediately discarded."}
            </span>
          </p>
        </div>
      )}

      {step === "form" && (
        <div className="space-y-8">

          {lowConfidenceWarning && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
              <span>⚠️</span><span>{lowConfidenceWarning}</span>
            </div>
          )}

          <div className="rounded-lg bg-teal-50 p-3 text-xs text-teal-700">
            {isBangla
              ? "নিচের প্রতিটা ফিল্ডে সর্বোচ্চ কতটুকু লেখা যাবে তা নির্দিষ্ট করা আছে — এতে ডিজাইনের কাঠামো কখনো নষ্ট হবে না।"
              : "Each field below has a fixed character limit so the design layout never breaks."}
          </div>

          {/* BASIC INFO */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-[#0B2A55]">{isBangla ? "মৌলিক তথ্য" : "Basic Information"}</h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
                {cvData.photo ? <img src={cvData.photo} alt="preview" className="h-full w-full object-cover" /> : (isBangla ? "ছবি" : "Photo")}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhoto(file);
                }} />
              </label>

              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <input value={cvData.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder={isBangla ? "পূর্ণ নাম" : "Full Name"} className={TEXT_INPUT} maxLength={MAX_LEN.fullName} />
                <input value={cvData.jobTitle} onChange={(e) => updateField("jobTitle", e.target.value)} placeholder={isBangla ? "পেশা/পদবী" : "Job Title"} className={TEXT_INPUT} maxLength={MAX_LEN.jobTitle} />
                <input value={cvData.email} onChange={(e) => updateField("email", e.target.value)} placeholder={isBangla ? "ইমেইল" : "Email"} className={TEXT_INPUT} maxLength={MAX_LEN.email} />
                <input value={cvData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder={isBangla ? "ফোন নম্বর" : "Phone Number"} className={TEXT_INPUT} maxLength={MAX_LEN.phone} />
              </div>
            </div>

            <div className="mt-3">
              <input
                value={cvData.presentAddress}
                onChange={(e) => updateField("presentAddress", e.target.value)}
                placeholder={isBangla ? "বর্তমান ঠিকানা" : "Present Address"}
                className={TEXT_INPUT}
                maxLength={MAX_LEN.address}
              />
              {autoFilledFields.has("presentAddress") && (
                <p className="mt-1 text-[11px] text-amber-600">⚠️ {isBangla ? "AI অনুমান করেছে, যাচাই করুন" : "Auto-detected — please verify"}</p>
              )}
            </div>
          </div>

          {/* PERSONAL INFORMATION */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-[#0B2A55]">{isBangla ? "ব্যক্তিগত তথ্য (Personal Information)" : "Personal Information"}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <input
                  value={cvData.fatherName}
                  onChange={(e) => updateField("fatherName", e.target.value)}
                  placeholder={isBangla ? "বাবার নাম" : "Father's Name"}
                  className={TEXT_INPUT}
                  maxLength={MAX_LEN.fatherMotherName}
                />
                {autoFilledFields.has("fatherName") && <p className="mt-1 text-[11px] text-amber-600">⚠️ {isBangla ? "যাচাই করুন" : "Please verify"}</p>}
              </div>
              <div>
                <input
                  value={cvData.motherName}
                  onChange={(e) => updateField("motherName", e.target.value)}
                  placeholder={isBangla ? "মায়ের নাম" : "Mother's Name"}
                  className={TEXT_INPUT}
                  maxLength={MAX_LEN.fatherMotherName}
                />
                {autoFilledFields.has("motherName") && <p className="mt-1 text-[11px] text-amber-600">⚠️ {isBangla ? "যাচাই করুন" : "Please verify"}</p>}
              </div>

              <input
                value={cvData.permanentAddress}
                onChange={(e) => updateField("permanentAddress", e.target.value)}
                placeholder={isBangla ? "স্থায়ী ঠিকানা" : "Permanent Address"}
                className={TEXT_INPUT}
                maxLength={MAX_LEN.personalInfoValue}
              />
              <input
                value={cvData.dateOfBirth}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
                placeholder={isBangla ? "জন্মতারিখ" : "Date of Birth"}
                className={TEXT_INPUT}
                maxLength={16}
              />

              <select value={cvData.religion} onChange={(e) => updateField("religion", e.target.value)} className={SELECT_CLASS}>
                <option value="">{isBangla ? "ধর্ম" : "Religion"}</option>
                {RELIGION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input
                value={cvData.nationality}
                onChange={(e) => updateField("nationality", e.target.value)}
                placeholder={isBangla ? "জাতীয়তা" : "Nationality"}
                className={TEXT_INPUT}
                maxLength={MAX_LEN.personalInfoValue}
              />

              <select value={cvData.maritalStatus} onChange={(e) => updateField("maritalStatus", e.target.value)} className={SELECT_CLASS}>
                <option value="">{isBangla ? "বৈবাহিক অবস্থা" : "Marital Status"}</option>
                {MARITAL_STATUS_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={cvData.sex} onChange={(e) => updateField("sex", e.target.value)} className={SELECT_CLASS}>
                <option value="">{isBangla ? "লিঙ্গ" : "Sex"}</option>
                {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <select value={cvData.bloodGroup} onChange={(e) => updateField("bloodGroup", e.target.value)} className={SELECT_CLASS}>
                <option value="">{isBangla ? "রক্তের গ্রুপ" : "Blood Group"}</option>
                {BLOOD_GROUP_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* JOB EXPERIENCE — fixed 3 slots */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-[#0B2A55]">{isBangla ? "কাজের অভিজ্ঞতা (৩টা পর্যন্ত)" : "Work Experience (up to 3)"}</h3>
            {cvData.workExperience.map((job, i) => (
              <div key={job.id} className="mb-3 rounded-xl border border-gray-200 p-4">
                <p className="mb-2 text-xs font-semibold text-gray-400">{isBangla ? `অভিজ্ঞতা ${i + 1}` : `Experience ${i + 1}`}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <SelectOrOther value={job.position} onChange={(v) => updateJob(i, { position: v })} options={JOB_CATEGORIES} placeholder={isBangla ? "পদবী বেছে নিন" : "Select position"} />
                  <input value={job.company} onChange={(e) => updateJob(i, { company: e.target.value })} placeholder={isBangla ? "কোম্পানি" : "Company"} className={SMALL_INPUT} maxLength={MAX_LEN.jobCompany} />
                  <input value={job.startDate} onChange={(e) => updateJob(i, { startDate: e.target.value })} placeholder={isBangla ? "শুরু" : "Start"} className={SMALL_INPUT} maxLength={MAX_LEN.jobDate} />
                  <input value={job.endDate} onChange={(e) => updateJob(i, { endDate: e.target.value })} placeholder={isBangla ? "শেষ" : "End"} className={SMALL_INPUT} maxLength={MAX_LEN.jobDate} />
                </div>
                <textarea value={job.description} onChange={(e) => updateJob(i, { description: e.target.value })} placeholder={isBangla ? "যেমন: ইলেকট্রিক কাজে ৩ বছরের অভিজ্ঞতা, দুবাই" : "e.g. 3 years experience in electrical work, Dubai"} rows={2} maxLength={MAX_LEN.jobDescription} className={`mt-2 ${TEXT_INPUT}`} />
                <p className="mt-1 text-right text-[11px] text-gray-400">{job.description.length}/{MAX_LEN.jobDescription}</p>
              </div>
            ))}
          </div>

          {/* EDUCATION — fixed 2 slots */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-[#0B2A55]">{isBangla ? "শিক্ষাগত যোগ্যতা (২টা পর্যন্ত)" : "Education (up to 2)"}</h3>
            {cvData.education.map((edu, i) => (
              <div key={edu.id} className="mb-3 rounded-xl border border-gray-200 p-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  <SelectOrOther value={edu.level} onChange={(v) => updateEdu(i, { level: v })} options={EDUCATION_LEVELS} placeholder={isBangla ? "লেভেল (SSC/HSC)" : "Level"} />
                  <input value={edu.institution} onChange={(e) => updateEdu(i, { institution: e.target.value })} placeholder={isBangla ? "প্রতিষ্ঠান" : "Institution"} className={SMALL_INPUT} maxLength={MAX_LEN.eduInstitution} />
                  <input value={edu.year} onChange={(e) => updateEdu(i, { year: e.target.value })} placeholder={isBangla ? "সাল" : "Year"} className={SMALL_INPUT} maxLength={MAX_LEN.eduYear} />
                </div>
              </div>
            ))}
          </div>

          {/* SKILLS — fixed 5 slots */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-[#0B2A55]">{isBangla ? "দক্ষতা (৫টা পর্যন্ত)" : "Skills (up to 5)"}</h3>
            {cvData.skills.map((skill, i) => (
              <div key={skill.id} className="mb-2 flex items-center gap-2">
                <div className="flex-1">
                  <SelectOrOther value={skill.name} onChange={(v) => updateSkill(i, { name: v })} options={SKILL_PRESETS} placeholder={isBangla ? "দক্ষতা বেছে নিন" : "Select skill"} maxLength={MAX_LEN.skillName} />
                </div>
                <input type="range" min={1} max={5} value={skill.level} onChange={(e) => updateSkill(i, { level: Number(e.target.value) })} className="w-24" />
                <span className="w-8 text-center text-xs text-gray-500">{skill.level}/5</span>
              </div>
            ))}
          </div>

          {/* LANGUAGES — fixed 4 slots */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-[#0B2A55]">{isBangla ? "ভাষা (৪টা পর্যন্ত)" : "Languages (up to 4)"}</h3>
            {cvData.languages.map((lang, i) => (
              <div key={lang.id} className="mb-2 flex gap-2">
                <div className="flex-1">
                  <SelectOrOther value={lang.name} onChange={(v) => updateLang(i, { name: v })} options={LANGUAGE_PRESETS} placeholder={isBangla ? "ভাষা" : "Language"} maxLength={MAX_LEN.languageName} />
                </div>
                <select value={lang.level} onChange={(e) => updateLang(i, { level: e.target.value })} className={SELECT_CLASS}>
                  <option value="">{isBangla ? "লেভেল" : "Level"}</option>
                  {LANGUAGE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* HOBBIES — fixed 3 slots */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-[#0B2A55]">{isBangla ? "শখ (৩টা পর্যন্ত)" : "Hobbies (up to 3)"}</h3>
            {cvData.hobbies.map((hobby, i) => (
              <div key={i} className="mb-2">
                <SelectOrOther value={hobby} onChange={(v) => updateHobby(i, v)} options={HOBBY_PRESETS} placeholder={isBangla ? "শখ বেছে নিন" : "Select hobby"} maxLength={MAX_LEN.hobby} />
              </div>
            ))}
          </div>

          {/* REFERENCES — fixed 2 slots */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-[#0B2A55]">{isBangla ? "রেফারেন্স (২টা পর্যন্ত)" : "References (up to 2)"}</h3>
            {cvData.references.map((ref, i) => (
              <div key={ref.id} className="mb-3 rounded-xl border border-gray-200 p-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  <input value={ref.name} onChange={(e) => updateRef(i, { name: e.target.value })} placeholder={isBangla ? "নাম" : "Name"} className={SMALL_INPUT} maxLength={MAX_LEN.refName} />
                  <input value={ref.phone} onChange={(e) => updateRef(i, { phone: e.target.value })} placeholder={isBangla ? "ফোন" : "Phone"} className={SMALL_INPUT} maxLength={MAX_LEN.refPhone} />
                  <input value={ref.email} onChange={(e) => updateRef(i, { email: e.target.value })} placeholder={isBangla ? "ইমেইল" : "Email"} className={SMALL_INPUT} maxLength={MAX_LEN.refEmail} />
                </div>
              </div>
            ))}
          </div>

          {/* ATTACH ADDITIONAL DOCUMENTS */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0B2A55]">{isBangla ? "অতিরিক্ত ডকুমেন্ট (ঐচ্ছিক)" : "Additional Documents (optional)"}</h3>
              <button type="button" onClick={addAttachment} className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                {isBangla ? "+ ডকুমেন্ট যোগ করুন" : "+ Add Document"}
              </button>
            </div>
            {attachments.map((att) => (
              <div key={att.id} className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <select value={att.type} onChange={(e) => updateAttachmentType(att.id, e.target.value)} className={SELECT_CLASS}>
                  <option value="">{isBangla ? "ডকুমেন্টের ধরন" : "Document type"}</option>
                  {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2 text-center text-xs text-gray-500 hover:border-teal-400">
                  {att.fileName || (isBangla ? "ফাইল বেছে নিন" : "Choose file")}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) updateAttachmentFile(att.id, file);
                  }} />
                </label>
                <button type="button" onClick={() => removeAttachment(att.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50">×</button>
              </div>
            ))}
            {attachments.filter((a) => a.file).length > 0 && (
              <button type="button" disabled={generatingDocsOnly} onClick={handleDownloadDocumentsOnly}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-5 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-100 disabled:opacity-60">
                {generatingDocsOnly && <Spinner />}
                {generatingDocsOnly ? (isBangla ? "তৈরি হচ্ছে..." : "Generating...") : (isBangla ? "📎 শুধু ডকুমেন্ট ডাউনলোড করুন" : "📎 Download documents only")}
              </button>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row">
            <button type="button" onClick={() => setStep("upload")} className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              {isBangla ? "← পেছনে" : "← Back"}
            </button>
            <button type="button" disabled={generating} onClick={handleGeneratePdf}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60">
              {generating && <Spinner />}
              {generating ? (isBangla ? "তৈরি হচ্ছে..." : "Generating...") : (isBangla ? "📄 PDF ডাউনলোড করুন" : "📄 Download PDF")}
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setPromoError(""); setPromoCode(""); setCleanDownloadOpen(true); }}
            className="w-full rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-100"
          >
            {isBangla ? "🔓 লোগো ছাড়া PDF ডাউনলোড" : "🔓 Download PDF without logo"}
          </button>

          <p className="text-center text-xs text-gray-400">
            {isBangla ? "সাধারণ ডাউনলোডে আপনার লোগো ২% opacity watermark হিসেবে থাকবে।" : "Normal download includes your logo as a 5% opacity watermark."}
          </p>

          {cleanDownloadOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-base font-bold text-[#0B2A55]">
                  {isBangla ? "লোগো ছাড়া PDF ডাউনলোড" : "Download PDF without logo"}
                </h3>
                <p className="mt-2 text-xs text-gray-500">
                  {isBangla ? "লোগো ছাড়া PDF পেতে প্রমো কোড দিন।" : "Enter the promo code to download without the logo."}
                </p>
                <input
                  autoFocus
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleGenerateCleanPdf(); }}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={isBangla ? "প্রমো কোড" : "Promo code"}
                  className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-teal-500"
                />
                {promoError && <p className="mt-2 text-xs font-semibold text-red-500">{promoError}</p>}
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setCleanDownloadOpen(false); setPromoCode(""); setPromoError(""); }}
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600"
                  >
                    {isBangla ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={handleGenerateCleanPdf}
                    className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {generating ? (isBangla ? "তৈরি হচ্ছে..." : "Generating...") : (isBangla ? "ডাউনলোড" : "Download")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
