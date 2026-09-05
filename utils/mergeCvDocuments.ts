import { PDFDocument } from "pdf-lib";

/* =========================================================
   MERGE CV + ATTACHED DOCUMENTS INTO ONE PDF

   Takes the generated CV PDF (as bytes) plus a list of
   attached files (images or PDFs) and returns a single
   merged PDF:
     - Page 1: the CV
     - Following pages: each attached document, one per page
       (images are placed centered on an A4 page; PDF pages
       are copied in as-is)

   Nothing here touches a server — everything runs in the
   browser, and no file is uploaded or stored anywhere.
========================================================= */

export type AttachedDoc = {
  id: string;
  type: string;
  file: File;
};

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

async function addAttachmentPages(pdfDoc: PDFDocument, attachments: AttachedDoc[]) {
  for (const doc of attachments) {
    const bytes = await doc.file.arrayBuffer();

    if (doc.file.type === "application/pdf") {
      const srcPdf = await PDFDocument.load(bytes);
      const copiedPages = await pdfDoc.copyPages(srcPdf, srcPdf.getPageIndices());
      copiedPages.forEach((page) => pdfDoc.addPage(page));
      continue;
    }

    let image;
    try {
      if (doc.file.type === "image/png") {
        image = await pdfDoc.embedPng(bytes);
      } else {
        image = await pdfDoc.embedJpg(bytes);
      }
    } catch {
      continue;
    }

    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    const scale = Math.min(
      (A4_WIDTH * 0.9) / image.width,
      (A4_HEIGHT * 0.9) / image.height
    );
    const width = image.width * scale;
    const height = image.height * scale;

    page.drawImage(image, {
      x: (A4_WIDTH - width) / 2,
      y: (A4_HEIGHT - height) / 2,
      width,
      height,
    });
  }
}

export async function mergeCvWithDocuments(
  cvPdfBytes: ArrayBuffer,
  attachments: AttachedDoc[]
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.load(cvPdfBytes);
  await addAttachmentPages(mergedPdf, attachments);
  return mergedPdf.save();
}

/**
 * Builds a PDF containing ONLY the attached documents — no CV page.
 * Used when the user wants to download just their passport/NID/
 * license copies without the CV itself.
 */
export async function mergeDocumentsOnly(
  attachments: AttachedDoc[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  await addAttachmentPages(pdfDoc, attachments);
  return pdfDoc.save();
}
