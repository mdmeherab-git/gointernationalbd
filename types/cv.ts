/* =========================================================
   CV BUILDER - SHARED TYPES + PRESET OPTION LISTS
========================================================= */

export type MrzFields = {
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  nationality?: string;
  birthDate?: string;
  sex?: string;
  expirationDate?: string;
  personalNumber?: string;
};

/* ---------------------------------------------------------
   PRESET OPTION LISTS
   Used to populate <select> dropdowns so users can pick
   instead of typing. Every list includes "other" so the
   user can still type something custom if needed.
--------------------------------------------------------- */

export const EDUCATION_LEVELS = [
  "SSC",
  "HSC",
  "Vocational / Trade Certificate",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Other",
];

export const JOB_CATEGORIES = [
  "Driver",
  "Factory Worker",
  "Electrician",
  "Plumber",
  "Welder",
  "Cleaner",
  "Construction Worker",
  "Technician",
  "Cook",
  "Tailor",
  "Mason",
  "Carpenter",
  "Security Guard",
  "Other",
];

export const SKILL_PRESETS = [
  "Driving",
  "Welding",
  "Electrical Wiring",
  "Machine Operation",
  "Computer Skills",
  "Cooking",
  "Tailoring",
  "Masonry",
  "Plumbing",
  "Carpentry",
  "English Communication",
  "Other",
];

export const LANGUAGE_PRESETS = [
  "Bengali",
  "English",
  "Arabic",
  "Hindi",
  "Urdu",
  "Malay",
  "Korean",
  "Japanese",
  "Other",
];

export const LANGUAGE_LEVELS = ["Basic", "Intermediate", "Fluent", "Native"];

export const HOBBY_PRESETS = [
  "Reading Books",
  "Traveling",
  "Sports",
  "Gardening",
  "Cooking",
  "Photography",
  "Music",
  "Playing Chess",
  "Other",
];

export const DOCUMENT_TYPES = [
  "Passport Copy",
  "NID Copy",
  "Driving License",
  "Educational Certificate",
  "Medical Report",
  "Other",
];

export const RELIGION_OPTIONS = ["Islam", "Hindu", "Christian", "Buddhist", "Other"];
export const MARITAL_STATUS_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];
export const SEX_OPTIONS = ["Male", "Female", "Other"];
export const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/* ---------------------------------------------------------
   DATA TYPES
--------------------------------------------------------- */

export type WorkExperience = {
  id: string;
  position: string; // from JOB_CATEGORIES or custom text
  company: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type Education = {
  id: string;
  level: string; // from EDUCATION_LEVELS or custom text
  institution: string;
  year: string;
};

export type LanguageSkill = {
  id: string;
  name: string; // from LANGUAGE_PRESETS or custom text
  level: string; // from LANGUAGE_LEVELS
};

export type Skill = {
  id: string;
  name: string; // from SKILL_PRESETS or custom text
  level: number; // 1-5, rendered as a progress bar
};

export type Reference = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

export type CvData = {
  fullName: string;
  dateOfBirth: string;
  nationality: string;

  photo: string | null;
  jobTitle: string;
  email: string;
  phone: string;
  fatherName: string;
  motherName: string;
  presentAddress: string;
  permanentAddress: string;
  religion: string;
  maritalStatus: string;
  sex: string;
  bloodGroup: string;
  aboutMe: string;

  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  languages: LanguageSkill[];
  hobbies: string[];
  references: Reference[];
};

export const emptyCvData: CvData = {
  fullName: "",
  dateOfBirth: "",
  nationality: "",
  photo: null,
  jobTitle: "",
  email: "",
  phone: "",
  fatherName: "",
  motherName: "",
  presentAddress: "",
  permanentAddress: "",
  religion: "",
  maritalStatus: "",
  sex: "",
  bloodGroup: "",
  aboutMe: "",
  workExperience: [
    { id: "job-1", position: "", company: "", startDate: "", endDate: "", description: "" },
    { id: "job-2", position: "", company: "", startDate: "", endDate: "", description: "" },
    { id: "job-3", position: "", company: "", startDate: "", endDate: "", description: "" },
  ],
  education: [
    { id: "edu-1", level: "", institution: "", year: "" },
    { id: "edu-2", level: "", institution: "", year: "" },
  ],
  skills: [
    { id: "skill-1", name: "", level: 3 },
    { id: "skill-2", name: "", level: 3 },
    { id: "skill-3", name: "", level: 3 },
    { id: "skill-4", name: "", level: 3 },
    { id: "skill-5", name: "", level: 3 },
  ],
  languages: [
    { id: "lang-1", name: "", level: "" },
    { id: "lang-2", name: "", level: "" },
    { id: "lang-3", name: "", level: "" },
    { id: "lang-4", name: "", level: "" },
  ],
  hobbies: ["", "", ""],
  references: [
    { id: "ref-1", name: "", phone: "", email: "" },
    { id: "ref-2", name: "", phone: "", email: "" },
  ],
};

/* ---------------------------------------------------------
   MAX LENGTHS — computed from each field's fixed box size in
   the reference template, so typed text can never overflow
   into a neighboring fixed-position element.
--------------------------------------------------------- */

export const MAX_LEN = {
  fullName: 22,
  jobTitle: 32,
  phone: 18,
  email: 28,
  address: 32,
  eduInstitution: 26,
  eduYear: 14,
  refName: 22,
  refPhone: 18,
  refEmail: 26,
  jobCompany: 30,
  jobDate: 14,
  jobDescription: 110,
  skillName: 20,
  languageName: 14,
  hobby: 22,
  personalInfoValue: 32,
  fatherMotherName: 26,
};
