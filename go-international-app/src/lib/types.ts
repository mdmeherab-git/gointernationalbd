/** Shared DTO shapes mirroring the website's actual API responses (see the
 *  Next.js app's app/api/** routes) — kept in sync by hand since the two
 *  projects don't share a package. */

export type CurrentUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  profilePhotoKey?: string;
  passportNumber?: string;
  passportIssue?: string;
  passportExpiry?: string;
};

export type ApiCircular = {
  id: string;
  country: string;
  countryCode: string;
  flag: string;
  category: string;
  title: string;
  sponsor: string;
  salary: string;
  vacancy: number;
  duty: string;
  accommodation: string;
  deadline: string;
  posted: string;
  description: string;
  requirements: string[];
  circularUrl: string | null;
  circularType: 'image' | 'pdf' | null;
  isFeatured: boolean;
  featuredImageUrl: string | null;
  status: 'active' | 'inactive';
  sortOrder: number;
};

export type PublicNotice = {
  id: string;
  title_bn: string;
  title_en: string;
  notice_date: string;
  tag_type: 'new' | 'general' | 'report';
  tag_label_bn: string;
  tag_label_en: string;
  image_url: string | null;
};

export type PopularCountry = { code: string; name: string };

export type Application = {
  id: string;
  circular_id: string | null;
  job_title: string;
  job_country: string;
  applicant_name: string;
  phone: string;
  email: string;
  message: string;
  status: 'new' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  created_at: string;
};

export type MedicalStatus = 'not_started' | 'in_progress' | 'fit' | 'unfit' | 'completed';
export type VisaStatusValue =
  | 'not_started'
  | 'processing'
  | 'running'
  | 'issued'
  | 'rejected'
  | 'completed';
export type FlightStatus = 'not_scheduled' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type VisaStatus = {
  medical_status: MedicalStatus;
  visa_status: VisaStatusValue;
  flight_status: FlightStatus;
  flight_date: string;
  flight_airline: string;
  flight_pnr: string;
  remarks: string;
  updated_at: string | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: 'application' | 'visa' | 'medical' | 'flight' | 'general';
  link: string | null;
  is_read: number;
  created_at: string;
};

export type UserDocument = {
  id: string;
  document_type: 'passport' | 'cv' | 'photo' | 'nid' | 'medical_report' | 'visa_copy' | 'other';
  file_name: string;
  content_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
};

export type AccountSettings = {
  notify_application: number;
  notify_visa: number;
  notify_medical: number;
  notify_general: number;
  language_pref: 'bn' | 'en';
};

export type ChatMessage = {
  id: string;
  sender_type: 'user' | 'admin' | 'ai';
  message: string;
  created_at: string;
  attachment_key: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  attachment_size: number | null;
  attachment_kind: 'document' | 'media' | 'audio' | null;
  is_read: number;
};
