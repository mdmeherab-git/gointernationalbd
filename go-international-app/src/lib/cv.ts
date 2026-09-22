/**
 * Mirrors the website's CV Builder data shape (types/cv.ts) exactly, so a
 * CV built on mobile round-trips through the same `/api/account/cv` JSON
 * blob and PDF field layout as the one built on the website. Hand-synced —
 * if the website's types/cv.ts changes, update this file to match.
 */

export const EDUCATION_LEVELS = [
  'SSC',
  'HSC',
  'Vocational / Trade Certificate',
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
  'Other',
];

export const JOB_CATEGORIES = [
  'Driver',
  'Factory Worker',
  'Electrician',
  'Plumber',
  'Welder',
  'Cleaner',
  'Construction Worker',
  'Technician',
  'Cook',
  'Tailor',
  'Mason',
  'Carpenter',
  'Security Guard',
  'Other',
];

export const SKILL_PRESETS = [
  'Driving',
  'Welding',
  'Electrical Wiring',
  'Machine Operation',
  'Computer Skills',
  'Cooking',
  'Tailoring',
  'Masonry',
  'Plumbing',
  'Carpentry',
  'English Communication',
  'Other',
];

export const LANGUAGE_PRESETS = ['Bengali', 'English', 'Arabic', 'Hindi', 'Urdu', 'Malay', 'Korean', 'Japanese', 'Other'];

export const LANGUAGE_LEVELS = ['Basic', 'Intermediate', 'Fluent', 'Native'];

export const HOBBY_PRESETS = ['Reading Books', 'Traveling', 'Sports', 'Gardening', 'Cooking', 'Photography', 'Music', 'Playing Chess', 'Other'];

export const RELIGION_OPTIONS = ['Islam', 'Hindu', 'Christian', 'Buddhist', 'Other'];
export const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed'];
export const SEX_OPTIONS = ['Male', 'Female', 'Other'];
export const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export type WorkExperience = {
  id: string;
  position: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type Education = {
  id: string;
  level: string;
  institution: string;
  year: string;
};

export type LanguageSkill = {
  id: string;
  name: string;
  level: string;
};

export type Skill = {
  id: string;
  name: string;
  level: number;
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
  passportNumber: string;
  passportIssue: string;
  passportExpiry: string;
  aboutMe: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  languages: LanguageSkill[];
  hobbies: string[];
  references: Reference[];
};

export const emptyCvData: CvData = {
  fullName: '',
  dateOfBirth: '',
  nationality: '',
  photo: null,
  jobTitle: '',
  email: '',
  phone: '',
  fatherName: '',
  motherName: '',
  presentAddress: '',
  permanentAddress: '',
  religion: '',
  maritalStatus: '',
  sex: '',
  bloodGroup: '',
  passportNumber: '',
  passportIssue: '',
  passportExpiry: '',
  aboutMe: '',
  workExperience: [
    { id: 'job-1', position: '', company: '', startDate: '', endDate: '', description: '' },
    { id: 'job-2', position: '', company: '', startDate: '', endDate: '', description: '' },
    { id: 'job-3', position: '', company: '', startDate: '', endDate: '', description: '' },
  ],
  education: [
    { id: 'edu-1', level: '', institution: '', year: '' },
    { id: 'edu-2', level: '', institution: '', year: '' },
  ],
  skills: [
    { id: 'skill-1', name: '', level: 3 },
    { id: 'skill-2', name: '', level: 3 },
    { id: 'skill-3', name: '', level: 3 },
    { id: 'skill-4', name: '', level: 3 },
    { id: 'skill-5', name: '', level: 3 },
  ],
  languages: [
    { id: 'lang-1', name: '', level: '' },
    { id: 'lang-2', name: '', level: '' },
    { id: 'lang-3', name: '', level: '' },
    { id: 'lang-4', name: '', level: '' },
  ],
  hobbies: ['', '', ''],
  references: [
    { id: 'ref-1', name: '', phone: '', email: '' },
    { id: 'ref-2', name: '', phone: '', email: '' },
  ],
};

/** Merges saved/partial data (which may predate a field, or come from the
 * old mobile-only simplified form) onto the full default shape so every
 * section always has the right number of fixed slots. */
export function mergeCvData(saved: Partial<CvData> | null | undefined): CvData {
  if (!saved) return JSON.parse(JSON.stringify(emptyCvData));
  const base = JSON.parse(JSON.stringify(emptyCvData)) as CvData;
  return {
    ...base,
    ...saved,
    workExperience: base.workExperience.map((slot, i) => ({ ...slot, ...(saved.workExperience?.[i] ?? {}) })),
    education: base.education.map((slot, i) => ({ ...slot, ...(saved.education?.[i] ?? {}) })),
    skills: base.skills.map((slot, i) => ({ ...slot, ...(saved.skills?.[i] ?? {}) })),
    languages: base.languages.map((slot, i) => ({ ...slot, ...(saved.languages?.[i] ?? {}) })),
    hobbies: base.hobbies.map((slot, i) => saved.hobbies?.[i] ?? slot),
    references: base.references.map((slot, i) => ({ ...slot, ...(saved.references?.[i] ?? {}) })),
  };
}

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
  passportNumber: 18,
  passportDate: 14,
};
