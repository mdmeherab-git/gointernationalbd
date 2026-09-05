import { NextRequest, NextResponse } from "next/server";
import Tesseract from "tesseract.js";
import { parse } from "mrz";
import sharp from "sharp";

/* =========================================================
   POST /api/extract-mrz

   Does two passes over the uploaded passport image:

   1. MRZ pass (reliable) — crops the bottom coded lines,
      restricts OCR to the MRZ character set, and parses with
      checksum validation. Gives: name, DOB, nationality,
      document number, expiry.

   2. Full-page pass (best-effort, lower accuracy) — runs OCR
      across the ENTIRE passport image in English + Bengali,
      then looks for labeled fields like "Father's Name" /
      "পিতার নাম" that only exist on the printed page — never
      in the MRZ — and only appear on older-style passports.
      Results from this pass are always returned with
      source: "ocr-unverified" so the UI can prompt the user
      to double check them.

   The uploaded image is never written to disk or stored in
   any database — everything happens in memory for this one
   request only.
========================================================= */

export const runtime = "nodejs";

type ExtraField = {
  value: string;
  source: "ocr-unverified";
};

function extractLabeledField(text: string, labels: string[]): string | null {
  for (const label of labels) {
    // Match "Label : value" or "Label\nvalue", stopping at the next
    // newline or another known label-like word.
    const pattern = new RegExp(
      `${label}\\s*[:\\-]?\\s*([^\\n]{2,60})`,
      "i"
    );
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim().replace(/[|_]+$/, "").trim();
      if (value.length >= 2) return value;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("passport") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "কোনো ছবি পাওয়া যায়নি" },
        { status: 400 }
      );
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    const metadata = await sharp(inputBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (!width || !height) {
      return NextResponse.json(
        { error: "ছবিটা পড়া যায়নি, অন্য ছবি দিয়ে আবার চেষ্টা করুন" },
        { status: 422 }
      );
    }

    /* ---------------------------------------------------
       PASS 1: MRZ (bottom ~28% of the image)
    --------------------------------------------------- */

    const cropTop = Math.floor(height * 0.72);

    const mrzBuffer = await sharp(inputBuffer)
      .extract({ left: 0, top: cropTop, width, height: height - cropTop })
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();

    const mrzOcr = await Tesseract.recognize(mrzBuffer, "eng", {
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
    } as Partial<Tesseract.WorkerOptions> & Record<string, unknown>);

    const candidateLines = mrzOcr.data.text
      .split("\n")
      .map((line) => line.replace(/\s/g, "").toUpperCase())
      .filter((line) => line.length >= 30);

    if (candidateLines.length < 2) {
      return NextResponse.json(
        {
          error:
            "MRZ (পাসপোর্টের নিচের কোডেড অংশ) পড়া যায়নি। ভালো আলোয়, স্পষ্ট ও সোজা করে ছবি তুলে আবার চেষ্টা করুন।",
        },
        { status: 422 }
      );
    }

    /* ---------------------------------------------------
       Passports use the TD3 MRZ format: two 44-character
       lines. OCR rarely lands on exactly 44 (extra/missing
       characters from noise at the crop edges), so normalize
       each line to that width instead of feeding raw OCR
       output straight into the parser — and guard the parse
       itself, since `parse()` throws (rather than returning
       valid:false) when the input doesn't match a known MRZ
       layout at all.
    --------------------------------------------------- */

    const TD3_LINE_LENGTH = 44;

    const normalizeToTd3 = (line: string) =>
      line.length > TD3_LINE_LENGTH
        ? line.slice(0, TD3_LINE_LENGTH)
        : line.padEnd(TD3_LINE_LENGTH, "<");

    const mrzLines = candidateLines.slice(-2).map(normalizeToTd3);

    let mrzResult;
    try {
      mrzResult = parse(mrzLines);
    } catch (parseError) {
      console.error("MRZ parse error:", parseError, mrzLines);
      return NextResponse.json(
        {
          error:
            "MRZ (পাসপোর্টের নিচের কোডেড অংশ) সঠিকভাবে পড়া যায়নি। ভালো আলোয়, স্পষ্ট ও সোজা করে ছবি তুলে আবার চেষ্টা করুন।",
        },
        { status: 422 }
      );
    }

    /* ---------------------------------------------------
       PASS 2: Full-page OCR (best-effort, English + Bengali)
       Only attempted if MRZ succeeded, so a failed full-page
       pass never blocks the reliable MRZ result.
    --------------------------------------------------- */

    const extra: Record<string, ExtraField> = {};

    try {
      const fullPageBuffer = await sharp(inputBuffer)
        .grayscale()
        .normalize()
        .toBuffer();

      const fullOcr = await Tesseract.recognize(fullPageBuffer, "eng+ben");
      const fullText = fullOcr.data.text;

      const fatherName = extractLabeledField(fullText, [
        "Father'?s?\\s*Name",
        "পিতার\\s*নাম",
        "পিতা",
      ]);
      const motherName = extractLabeledField(fullText, [
        "Mother'?s?\\s*Name",
        "মাতার\\s*নাম",
        "মাতা",
      ]);
      const address = extractLabeledField(fullText, [
        "Permanent\\s*Address",
        "Address",
        "স্থায়ী\\s*ঠিকানা",
        "ঠিকানা",
      ]);
      const phone = extractLabeledField(fullText, [
        "Telephone\\s*No\\.?",
        "Mobile\\s*No\\.?",
        "টেলিফোন",
        "মোবাইল",
      ]);

      if (fatherName) extra.fatherName = { value: fatherName, source: "ocr-unverified" };
      if (motherName) extra.motherName = { value: motherName, source: "ocr-unverified" };
      if (address) extra.address = { value: address, source: "ocr-unverified" };
      if (phone) extra.phone = { value: phone, source: "ocr-unverified" };
    } catch (fullPageError) {
      // Full-page pass is best-effort only — swallow errors here so
      // the reliable MRZ result still gets returned to the user.
      console.error("Full-page OCR (non-critical) error:", fullPageError);
    }

    return NextResponse.json({
      valid: mrzResult.valid,
      fields: mrzResult.fields,
      details: mrzResult.details,
      extra,
    });
  } catch (error) {
    console.error("MRZ extraction error:", error);
    return NextResponse.json(
      { error: "প্রসেস করার সময় সমস্যা হয়েছে, আবার চেষ্টা করুন" },
      { status: 500 }
    );
  }
}
