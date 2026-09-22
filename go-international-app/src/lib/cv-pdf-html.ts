import { CV_LOGO_DATA_URI } from './cv-logo';
import type { CvData } from './cv';

/**
 * Builds an HTML document that visually mirrors the website's CV PDF
 * template (components/CvPdfDocument.tsx): teal-bordered A4 page, mint
 * left column (photo, contact, education, references) and white right
 * column (personal info, job experience, skills, language/hobbies), same
 * color palette and section order. @react-pdf/renderer (used on the
 * website) depends on Node-only internals (fs/zlib via pdfkit) and cannot
 * run in React Native, so this HTML is rendered to a real PDF file on
 * Android via expo-print's native printToFileAsync instead — the same
 * approach Expo documents for "generate a PDF matching a design" on
 * native. A plain <div>/flexbox layout is used rather than literal pixel
 * coordinates so that longer typed text (especially Bengali, which is
 * wider per character) wraps instead of overflowing a fixed box.
 */

const TEAL = '#08A99D';
const MINT = '#D8EAEA';
const DARK = '#303438';
const MUTED = '#4B5559';

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label: string, value: string): string {
  if (!value) return '';
  return `<div class="pi-row"><span class="pi-label">${esc(label)}</span><span class="pi-value">${esc(value)}</span></div>`;
}

export function buildCvHtml(data: CvData, showWatermark: boolean): string {
  const personalRows: [string, string][] = [
    ["Father's Name", data.fatherName],
    ["Mother's Name", data.motherName],
    ['Permanent Address', data.permanentAddress],
    ['Present Address', data.presentAddress],
    ['Date of Birth', data.dateOfBirth],
    ['Religion', data.religion],
    ['Nationality', data.nationality],
    ['Marital Status', data.maritalStatus],
    ['Sex', data.sex],
    ['Blood Group', data.bloodGroup],
    ['Passport Number', data.passportNumber],
    ['Passport Issue', data.passportIssue],
    ['Passport Expiry', data.passportExpiry],
  ];

  const jobsHtml = data.workExperience
    .filter((j) => j.position || j.company || j.description)
    .map(
      (job) => `
      <div class="job-entry">
        <div class="job-head">
          <span class="job-title">${esc(job.position).toUpperCase()}</span>
          <span class="job-date">${esc(job.startDate)}${job.startDate || job.endDate ? ' - ' : ''}${esc(job.endDate)}</span>
        </div>
        ${job.company ? `<div class="job-company">${esc(job.company)}</div>` : ''}
        ${job.description ? `<div class="job-desc">${esc(job.description)}</div>` : ''}
      </div>`,
    )
    .join('');

  const eduHtml = data.education
    .filter((e) => e.institution || e.level || e.year)
    .map(
      (e) => `
      <div class="edu-entry">
        <div class="edu-institution">${esc(e.institution)}</div>
        <div class="edu-level">${esc(e.level)}</div>
        <div class="edu-year">${esc(e.year)}</div>
      </div>`,
    )
    .join('');

  const refHtml = data.references
    .filter((r) => r.name || r.phone || r.email)
    .map(
      (r) => `
      <div class="ref-entry">
        <div class="ref-name">${esc(r.name)}</div>
        ${r.phone ? `<div class="ref-line">Tel: ${esc(r.phone)}</div>` : ''}
        ${r.email ? `<div class="ref-line">${esc(r.email)}</div>` : ''}
      </div>`,
    )
    .join('');

  const skillsHtml = data.skills
    .filter((s) => s.name)
    .map(
      (s) => `
      <div class="skill-row">
        <span class="skill-name">${esc(s.name)}</span>
        <span class="skill-bar"><span class="skill-fill" style="width:${Math.min(5, Math.max(1, s.level)) * 20}%"></span></span>
      </div>`,
    )
    .join('');

  const langHtml = data.languages
    .filter((l) => l.name)
    .map((l) => `<div class="bullet-item">• ${esc(l.name).toUpperCase()}${l.level ? ` (${esc(l.level)})` : ''}</div>`)
    .join('');

  const hobbyHtml = data.hobbies
    .filter(Boolean)
    .map((h) => `<div class="bullet-item">• ${esc(h).toUpperCase()}</div>`)
    .join('');

  const personalRowsHtml = personalRows.map(([label, value]) => row(label, value)).join('');

  const photoHtml = data.photo
    ? `<img class="photo" src="${data.photo}" />`
    : `<div class="photo photo-placeholder"></div>`;

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, Roboto, "Noto Sans Bengali", Arial, sans-serif;
    color: ${DARK};
    width: 595pt;
    height: 842pt;
  }
  .frame {
    position: relative;
    width: 579pt;
    height: 826pt;
    margin: 8pt;
    border: 8pt solid ${TEAL};
    display: flex;
    overflow: hidden;
  }
  .watermark {
    position: absolute;
    left: 140pt; top: 180pt; width: 300pt; height: 300pt;
    opacity: 0.05;
    object-fit: contain;
    z-index: 0;
  }
  .col-left {
    width: 38%;
    background: ${MINT};
    padding: 22pt 14pt;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    z-index: 1;
    border-right: 1.1pt solid #25292C;
  }
  .col-right {
    width: 62%;
    padding: 22pt 16pt;
    display: flex;
    flex-direction: column;
    gap: 14pt;
    position: relative;
    z-index: 1;
  }
  .name { font-size: 19pt; font-weight: 700; line-height: 1.15; word-break: break-word; }
  .job-title-header { font-size: 10pt; letter-spacing: 0.5pt; margin-top: 4pt; }
  .photo { width: 110pt; height: 110pt; border-radius: 999pt; object-fit: cover; border: 4pt solid #fff; margin: 14pt 0; }
  .photo-placeholder { background: #B8DCD8; }
  .badge-heading { display: flex; align-items: center; gap: 7pt; margin: 10pt 0 8pt; }
  .badge {
    width: 21pt; height: 21pt; border-radius: 999pt; background: ${TEAL};
    color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10pt; flex-shrink: 0;
  }
  .heading { font-size: 12.5pt; font-weight: 700; }
  .left-block { width: 100%; font-size: 8.3pt; line-height: 1.5; margin-bottom: 4pt; }
  .divider-h { width: 100%; height: 1pt; background: #25292C; margin: 10pt 0; }
  .edu-entry, .ref-entry { width: 100%; margin-bottom: 9pt; }
  .edu-institution, .ref-name { font-size: 9.3pt; font-weight: 700; }
  .edu-level, .edu-year, .ref-line { font-size: 8pt; color: ${MUTED}; }
  .pi-row { display: flex; font-size: 9pt; padding: 2.5pt 0; }
  .pi-label { width: 42%; color: ${MUTED}; }
  .pi-value { width: 58%; font-weight: 700; }
  .job-entry { margin-bottom: 8pt; }
  .job-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8pt; }
  .job-title { font-size: 9.5pt; font-weight: 700; }
  .job-date { font-size: 8pt; font-weight: 700; white-space: nowrap; }
  .job-company { font-size: 8.3pt; font-style: italic; margin-top: 1pt; }
  .job-desc { font-size: 7.6pt; line-height: 1.3; margin-top: 2pt; color: ${MUTED}; }
  .skills-grid { display: flex; flex-wrap: wrap; gap: 6pt 14pt; }
  .skill-row { width: 46%; display: flex; align-items: center; gap: 6pt; }
  .skill-name { font-size: 7.6pt; font-weight: 700; width: 55pt; flex-shrink: 0; }
  .skill-bar { flex: 1; height: 7pt; border: 0.8pt solid #60676A; border-radius: 4pt; background: #fff; display: block; overflow: hidden; }
  .skill-fill { display: block; height: 100%; background: ${TEAL}; }
  .bottom-cols { display: flex; gap: 16pt; }
  .bottom-col { flex: 1; }
  .bullet-item { font-size: 8.5pt; font-weight: 700; margin-bottom: 5pt; }
  .section { display: flex; flex-direction: column; }
</style>
</head>
<body>
  <div class="frame">
    ${showWatermark ? `<img class="watermark" src="${CV_LOGO_DATA_URI}" />` : ''}

    <div class="col-left">
      <div class="name">${esc((data.fullName || 'YOUR NAME').toUpperCase())}</div>
      <div class="job-title-header">${esc((data.jobTitle || 'PROFESSIONAL').toUpperCase())}</div>
      ${photoHtml}

      <div class="badge-heading"><span class="badge">👤</span><span class="heading">CONTACT ME</span></div>
      <div class="left-block">${esc(data.phone)}</div>
      <div class="left-block">${esc(data.email)}</div>
      <div class="left-block">${esc(data.presentAddress)}</div>

      <div class="divider-h"></div>
      <div class="badge-heading"><span class="badge">🎓</span><span class="heading">EDUCATION</span></div>
      ${eduHtml || '<div class="left-block">—</div>'}

      <div class="divider-h"></div>
      <div class="badge-heading"><span class="badge">👥</span><span class="heading">REFERENCES</span></div>
      ${refHtml || '<div class="left-block">—</div>'}
    </div>

    <div class="col-right">
      <div class="section">
        <div class="badge-heading"><span class="badge">ℹ️</span><span class="heading">PERSONAL INFORMATION</span></div>
        ${personalRowsHtml || '<div class="pi-row">—</div>'}
      </div>

      <div class="divider-h"></div>

      <div class="section">
        <div class="badge-heading"><span class="badge">💼</span><span class="heading">JOB EXPERIENCE</span></div>
        ${jobsHtml || '<div class="left-block">—</div>'}
      </div>

      <div class="divider-h"></div>

      <div class="section">
        <div class="badge-heading"><span class="badge">⭐</span><span class="heading">SKILLS</span></div>
        <div class="skills-grid">${skillsHtml || ''}</div>
      </div>

      <div class="divider-h"></div>

      <div class="bottom-cols">
        <div class="bottom-col">
          <div class="badge-heading"><span class="badge">🌐</span><span class="heading">LANGUAGE</span></div>
          ${langHtml}
        </div>
        <div class="bottom-col">
          <div class="badge-heading"><span class="badge">🎯</span><span class="heading">HOBBIES</span></div>
          ${hobbyHtml}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
