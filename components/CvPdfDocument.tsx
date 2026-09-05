import { Document, Page, Text, View, Image, StyleSheet, Svg, Circle, Rect, Line, Polygon, Polyline, Ellipse } from "@react-pdf/renderer";
import type { CvData } from "../types/cv";

/* =========================================================
   FIXED-POSITION CV TEMPLATE (v2)

   Sidebar (Contact/Education/References) keeps the positions
   taken directly from the reference PSD, scaled by S=0.22.

   Main column was redesigned (per explicit request) to swap
   "About Me" for "Personal Information", and to make Job
   Experience compact (one short line of description instead
   of a paragraph) so Personal Information has room. All main
   column positions below are hand-computed in final PDF
   points with a consistent vertical rhythm (28pt per section
   heading, 15pt gap between sections) — NOT auto-flowing —
   so nothing shifts regardless of how much text is entered
   (text amount is separately capped via maxLength in the
   form to fit each fixed box).

   NOTE: the reference file for this template imported its
   badge icons from "../assets/cvIcons" (PNGs extracted from
   the reference design) — that asset file wasn't provided,
   so it can't be reproduced pixel-for-pixel here. Icons below
   are drawn as vector shapes instead (same approach already
   used and verified in this file previously); positions,
   sizes and colors are unchanged.
========================================================= */

const TEAL = "#00A798";
const BADGE_TEAL = "#4FB9AD";
const SIDEBAR_BG = "#D5E4E7";
const DARK_NAVY = "#222222";
const S = 0.22; // PSD-px -> PDF-pt scale factor, sidebar only

function sidebarBox(x0: number, y0: number, x1: number, y1: number) {
  return { position: "absolute" as const, left: x0 * S, top: y0 * S, width: (x1 - x0) * S, height: (y1 - y0) * S };
}
function mainBox(left: number, top: number, width: number, height: number) {
  return { position: "absolute" as const, left, top, width, height };
}

const MAIN_LEFT = 287.5;   // icon column x
const MAIN_TEXT_LEFT = 317.5; // text column x (after icon)
const MAIN_WIDTH = 237.4;  // available text width in main column

type IconType = "person" | "cap" | "users" | "briefcase" | "chart" | "globe" | "flag" | "phone" | "mail" | "pin";

function IconShape({ type, color }: { type: IconType; color: string }) {
  switch (type) {
    case "person":
      return (
        <>
          <Circle cx={12} cy={8} r={4} fill={color} />
          <Polygon points="4,20 4,17 8,14 16,14 20,17 20,20" fill={color} />
        </>
      );
    case "phone":
      return (
        <>
          <Rect x={7} y={2} width={10} height={20} rx={2} stroke={color} strokeWidth={1.8} fill="none" />
          <Circle cx={12} cy={19} r={1} fill={color} />
        </>
      );
    case "mail":
      return (
        <>
          <Rect x={3} y={5} width={18} height={14} rx={1} stroke={color} strokeWidth={1.6} fill="none" />
          <Polyline points="3,6 12,13 21,6" stroke={color} strokeWidth={1.6} fill="none" />
        </>
      );
    case "pin":
      return (
        <>
          <Polygon points="12,3 5,13 19,13" fill={color} />
          <Circle cx={12} cy={17} r={4} fill={color} />
        </>
      );
    case "cap":
      return (
        <>
          <Polygon points="12,4 22,9 12,14 2,9" fill={color} />
          <Line x1={12} y1={14} x2={12} y2={19} stroke={color} strokeWidth={1.6} />
        </>
      );
    case "users":
      return (
        <>
          <Circle cx={8} cy={9} r={3} fill={color} />
          <Circle cx={16} cy={9} r={3} fill={color} />
          <Polygon points="2,20 2,17 8,14 8,20" fill={color} />
          <Polygon points="16,14 22,17 22,20 16,20" fill={color} />
        </>
      );
    case "chart":
      return (
        <>
          <Rect x={4} y={13} width={4} height={8} fill={color} />
          <Rect x={10} y={8} width={4} height={13} fill={color} />
          <Rect x={16} y={4} width={4} height={17} fill={color} />
        </>
      );
    case "globe":
      return (
        <>
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.4} fill="none" />
          <Ellipse cx={12} cy={12} rx={4} ry={9} stroke={color} strokeWidth={1.4} fill="none" />
          <Line x1={3} y1={12} x2={21} y2={12} stroke={color} strokeWidth={1.4} />
        </>
      );
    case "flag":
      return (
        <>
          <Line x1={5} y1={3} x2={5} y2={21} stroke={color} strokeWidth={2} />
          <Polygon points="5,4 19,7 5,10" fill={color} />
        </>
      );
    case "briefcase":
      return (
        <>
          <Rect x={3} y={8} width={18} height={12} rx={1} stroke={color} strokeWidth={1.6} fill="none" />
          <Rect x={9} y={4} width={6} height={4} rx={1} stroke={color} strokeWidth={1.6} fill="none" />
        </>
      );
  }
}

const iconContact: IconType = "person";
const iconEducation: IconType = "cap";
const iconReferences: IconType = "users";
const iconAbout: IconType = "person";
const iconJob: IconType = "briefcase";
const iconSkills: IconType = "chart";
const iconLanguage: IconType = "globe";
const iconHobbies: IconType = "flag";
const iconPhone: IconType = "phone";
const iconWeb: IconType = "mail";
const iconLocation: IconType = "pin";

const styles = StyleSheet.create({
  page: { padding: 10, fontFamily: "Helvetica" },
  frame: { position: "relative", width: 561.28, height: 807.89, border: `7px solid ${TEAL}`, backgroundColor: "#ffffff" },
  watermark: { position: "absolute", top: "44%", left: "12%", fontSize: 30, color: "#e5e7eb", opacity: 0.5, transform: "rotate(-30deg)", zIndex: 50 },
  sidebarBg: { position: "absolute", left: 0, top: 0, width: 234.6, height: 807.89, backgroundColor: SIDEBAR_BG },
  divider: { position: "absolute", left: 260, top: 0, width: 1.2, height: 807.89, backgroundColor: "#333333" },

  photo: { borderRadius: 999, objectFit: "cover", border: "3px solid #ffffff" },
  photoFallback: { borderRadius: 999, backgroundColor: "#a9ddd3", border: "3px solid #ffffff" },
  nameText: { fontSize: 15, fontWeight: 700, color: DARK_NAVY },
  subtitleText: { fontSize: 8.5, color: "#3f5c56" },

  headingText: { fontSize: 11, fontWeight: 700, color: "#1a1a1a" },
  smallText: { fontSize: 8, color: "#333" },

  eduTitle: { fontSize: 9, fontWeight: 700, color: DARK_NAVY },
  eduSub: { fontSize: 7.6, color: "#4a5a58" },

  refName: { fontSize: 8.7, fontWeight: 700, color: DARK_NAVY },
  refMeta: { fontSize: 7.4, color: "#4a5a58" },

  piLabel: { fontSize: 8, color: "#4a5a58" },
  piValue: { fontSize: 8.4, fontWeight: 700, color: DARK_NAVY },
  piRow: { flexDirection: "row" },

  jobTitle: { fontSize: 9, fontWeight: 700, color: DARK_NAVY },
  jobDate: { fontSize: 7.6, color: "#4a5a58" },
  jobCompany: { fontSize: 8, fontStyle: "italic", color: "#4a5a58" },
  jobDesc: { fontSize: 7.6, lineHeight: 1.3, color: "#444" },

  skillName: { fontSize: 8.2, fontWeight: 700, color: DARK_NAVY },
  skillTrack: { height: 5, backgroundColor: "#e2f2ef", borderRadius: 3 },
  skillFill: { height: 5, backgroundColor: BADGE_TEAL, borderRadius: 3 },

  bullet: { fontSize: 8.3, color: "#333" },
});

function IconBadge({ icon, size = 22.7, x, y }: { icon: IconType; size?: number; x: number; y: number }) {
  return (
    <View style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: BADGE_TEAL, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
        <IconShape type={icon} color="#ffffff" />
      </Svg>
    </View>
  );
}

function MainHeading({ icon, y, children }: { icon: IconType; y: number; children: string }) {
  return (
    <>
      <IconBadge icon={icon} x={MAIN_LEFT} y={y} />
      <View style={mainBox(MAIN_TEXT_LEFT, y + 5.5, MAIN_WIDTH, 15)}>
        <Text style={styles.headingText}>{children}</Text>
      </View>
    </>
  );
}

export default function CvPdfDocument({ data, showWatermark }: { data: CvData; showWatermark: boolean }) {
  const edu = data.education;
  const refs = data.references;
  const jobs = data.workExperience;
  const skills = data.skills;
  const langs = data.languages;
  const hobbies = data.hobbies;

  /* ---- main column vertical rhythm (final pt, fixed) ---- */
  const PI_TOP = 57.4;
  const PI_ROWS_TOP = PI_TOP + 28;
  const ROW_H = 14.5;

  const JOB_TOP = 245.4;
  const JOB_ROWS_TOP = JOB_TOP + 28;
  const JOB_ENTRY_H = 54;

  const SKILLS_TOP = 450.4;
  const SKILLS_ROWS_TOP = SKILLS_TOP + 28;
  const SKILL_ROW_H = 18;

  const LH_TOP = 547.4;
  const LH_ROWS_TOP = LH_TOP + 28;
  const LH_ROW_H = 13;

  const personalRows: [string, string][] = [
    ["Father's Name", data.fatherName],
    ["Mother's Name", data.motherName],
    ["Permanent Address", data.permanentAddress],
    ["Present Address", data.presentAddress],
    ["Date of Birth", data.dateOfBirth],
    ["Religion", data.religion],
    ["Nationality", data.nationality],
    ["Marital Status", data.maritalStatus],
    ["Sex", data.sex],
    ["Blood Group", data.bloodGroup],
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.frame}>
          {showWatermark && <Text style={styles.watermark}>GO INTERNATIONAL BD</Text>}

          <View style={styles.sidebarBg} />
          <View style={styles.divider} />

          {/* ============ PHOTO ============ */}
          <View style={sidebarBox(283, 556, 946, 1219)}>
            {data.photo ? (
              <Image src={data.photo} style={{ ...styles.photo, width: "100%", height: "100%" }} />
            ) : (
              <View style={{ ...styles.photoFallback, width: "100%", height: "100%" }} />
            )}
          </View>

          {/* ============ NAME ============ */}
          <View style={sidebarBox(249, 240, 981, 300)}>
            <Text style={styles.nameText}>{(data.fullName || "Your Name").toUpperCase()}</Text>
          </View>
          <View style={sidebarBox(263, 379, 964, 415)}>
            <Text style={styles.subtitleText}>{data.jobTitle}</Text>
          </View>

          {/* ============ CONTACT ME ============ */}
          <IconBadge icon={iconContact} size={22.7} x={71.5} y={298.8} />
          <View style={sidebarBox(461, 1380, 904, 1432)}><Text style={styles.headingText}>CONTACT ME</Text></View>

          <IconBadge icon={iconPhone} size={16} x={95.7} y={332.0} />
          <View style={sidebarBox(497, 1513, 950, 1549)}><Text style={styles.smallText}>{data.phone}</Text></View>

          <IconBadge icon={iconWeb} size={16} x={82.7} y={345.2} />
          <View style={sidebarBox(443, 1571, 1010, 1611)}><Text style={styles.smallText}>{data.email}</Text></View>

          <IconBadge icon={iconLocation} size={16} x={68.9} y={358.6} />
          <View style={sidebarBox(374, 1633, 1050, 1690)}><Text style={styles.smallText}>{data.presentAddress}</Text></View>

          {/* ============ EDUCATION ============ */}
          <IconBadge icon={iconEducation} size={22.7} x={76.8} y={411.2} />
          <View style={sidebarBox(484, 1895, 881, 1947)}><Text style={styles.headingText}>EDUCATION</Text></View>

          <View style={sidebarBox(350, 2020, 879, 2055)}><Text style={styles.eduTitle}>{edu[0]?.institution}</Text></View>
          <View style={sidebarBox(384, 2093, 849, 2119)}><Text style={styles.eduSub}>{edu[0]?.level}</Text></View>
          <View style={sidebarBox(517, 2151, 716, 2182)}><Text style={styles.eduSub}>{edu[0]?.year}</Text></View>

          <View style={sidebarBox(335, 2241, 895, 2276)}><Text style={styles.eduTitle}>{edu[1]?.institution}</Text></View>
          <View style={sidebarBox(363, 2314, 872, 2340)}><Text style={styles.eduSub}>{edu[1]?.level}</Text></View>
          <View style={sidebarBox(511, 2372, 724, 2403)}><Text style={styles.eduSub}>{edu[1]?.year}</Text></View>

          {/* ============ REFERENCES ============ */}
          <IconBadge icon={iconReferences} size={22.7} x={72.6} y={572.2} />
          <View style={sidebarBox(458, 2627, 899, 2679)}><Text style={styles.headingText}>REFERENCES</Text></View>

          <View style={sidebarBox(441, 2753, 891, 2787)}><Text style={styles.refName}>{refs[0]?.name}</Text></View>
          <View style={sidebarBox(340, 2810, 890, 2846)}><Text style={styles.refMeta}>{refs[0]?.phone ? `Tel: ${refs[0].phone}` : ""}</Text></View>
          <View style={sidebarBox(340, 2865, 890, 2904)}><Text style={styles.refMeta}>{refs[0]?.email}</Text></View>

          <View style={sidebarBox(420, 3010, 811, 3045)}><Text style={styles.refName}>{refs[1]?.name}</Text></View>
          <View style={sidebarBox(344, 3067, 886, 3103)}><Text style={styles.refMeta}>{refs[1]?.phone ? `Tel: ${refs[1].phone}` : ""}</Text></View>
          <View style={sidebarBox(344, 3122, 886, 3158)}><Text style={styles.refMeta}>{refs[1]?.email}</Text></View>

          {/* ============ PERSONAL INFORMATION (replaces About Me) ============ */}
          <MainHeading icon={iconAbout} y={PI_TOP}>PERSONAL INFORMATION</MainHeading>
          {personalRows.map(([label, value], i) => (
            <View key={label} style={{ ...mainBox(MAIN_TEXT_LEFT, PI_ROWS_TOP + i * ROW_H, MAIN_WIDTH, ROW_H), ...styles.piRow }}>
              <Text style={{ ...styles.piLabel, width: 92 }}>{label}</Text>
              <Text style={{ ...styles.piValue, width: MAIN_WIDTH - 92 }}>{value}</Text>
            </View>
          ))}

          {/* ============ JOB EXPERIENCE (compact) ============ */}
          <MainHeading icon={iconJob} y={JOB_TOP}>JOB EXPERIENCE</MainHeading>
          {[0, 1, 2].map((i) => {
            const top = JOB_ROWS_TOP + i * JOB_ENTRY_H;
            const job = jobs[i];
            return (
              <View key={i}>
                <View style={mainBox(MAIN_TEXT_LEFT, top, MAIN_WIDTH * 0.62, 12)}><Text style={styles.jobTitle}>{job?.position}</Text></View>
                <View style={mainBox(MAIN_TEXT_LEFT + MAIN_WIDTH * 0.62, top, MAIN_WIDTH * 0.38, 12)}><Text style={styles.jobDate}>{job ? `${job.startDate} - ${job.endDate}` : ""}</Text></View>
                <View style={mainBox(MAIN_TEXT_LEFT, top + 13, MAIN_WIDTH, 11)}><Text style={styles.jobCompany}>{job?.company}</Text></View>
                <View style={mainBox(MAIN_TEXT_LEFT, top + 26, MAIN_WIDTH, 22)}><Text style={styles.jobDesc}>{job?.description}</Text></View>
              </View>
            );
          })}

          {/* ============ SKILLS ============ */}
          <MainHeading icon={iconSkills} y={SKILLS_TOP}>SKILLS</MainHeading>
          {[0, 1, 2, 3, 4].map((idx) => {
            const skill = skills[idx];
            if (!skill) return null;
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const colLeft = col === 0 ? MAIN_TEXT_LEFT : MAIN_TEXT_LEFT + MAIN_WIDTH / 2 + 5;
            const colWidth = MAIN_WIDTH / 2 - 5;
            const top = SKILLS_ROWS_TOP + row * SKILL_ROW_H;
            return (
              <View key={idx}>
                <View style={mainBox(colLeft, top, colWidth, 10)}><Text style={styles.skillName}>{skill.name}</Text></View>
                <View style={{ ...mainBox(colLeft, top + 11, colWidth, 5), ...styles.skillTrack }}>
                  <View style={{ ...styles.skillFill, width: `${Math.min(5, Math.max(1, skill.level)) * 20}%` }} />
                </View>
              </View>
            );
          })}

          {/* ============ LANGUAGE / HOBBIES ============ */}
          <IconBadge icon={iconLanguage} x={MAIN_LEFT} y={LH_TOP} />
          <View style={mainBox(MAIN_TEXT_LEFT, LH_TOP + 5.5, MAIN_WIDTH / 2 - 5, 15)}><Text style={styles.headingText}>LANGUAGE</Text></View>

          <IconBadge icon={iconHobbies} x={MAIN_LEFT + MAIN_WIDTH / 2 + 5} y={LH_TOP} />
          <View style={mainBox(MAIN_TEXT_LEFT + MAIN_WIDTH / 2 + 5, LH_TOP + 5.5, MAIN_WIDTH / 2 - 5, 15)}><Text style={styles.headingText}>HOBBIES</Text></View>

          {[0, 1, 2, 3].map((i) => {
            const lang = langs[i];
            if (!lang) return null;
            return (
              <View key={i} style={mainBox(MAIN_TEXT_LEFT, LH_ROWS_TOP + i * LH_ROW_H, MAIN_WIDTH / 2 - 5, LH_ROW_H)}>
                <Text style={styles.bullet}>• {lang.name}</Text>
              </View>
            );
          })}
          {[0, 1, 2].map((i) => {
            const hobby = hobbies[i];
            if (!hobby) return null;
            return (
              <View key={i} style={mainBox(MAIN_TEXT_LEFT + MAIN_WIDTH / 2 + 5, LH_ROWS_TOP + i * LH_ROW_H, MAIN_WIDTH / 2 - 5, LH_ROW_H)}>
                <Text style={styles.bullet}>• {hobby}</Text>
              </View>
            );
          })}

        </View>
      </Page>
    </Document>
  );
}
