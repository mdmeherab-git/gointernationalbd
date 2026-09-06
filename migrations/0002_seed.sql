-- Seed data — mirrors what used to be hardcoded in the page components.
-- Safe to re-run: fixed ids + INSERT OR IGNORE.

-- ---- Circulars (from app/jobs/page.tsx `jobs`) --------------------------------
INSERT OR IGNORE INTO circulars
  (id, country, country_code, flag, category, title, sponsor, salary, vacancy, duty, accommodation, deadline, posted, description, requirements, is_featured, status, sort_order)
VALUES
  ('seed-cir-1','Saudi Arabia','sa','🇸🇦','Driver','Driver','MCL Overseas','SAR 1,500',20,'8 Hours','Provided','30 Aug 2026','19 Aug 2026',
   'Experienced drivers are required for an overseas employment opportunity in Saudi Arabia.',
   '["Valid passport","Driving experience","Medical fitness","Basic communication ability"]',0,'active',1),

  ('seed-cir-2','Saudi Arabia','sa','🇸🇦','Factory Worker','Factory Worker','MCL Overseas','SAR 1,300',50,'8 Hours','Provided','02 Sep 2026','19 Aug 2026',
   'Factory workers are required for a reputed company in Saudi Arabia.',
   '["Valid passport","Physically fit","Factory work ability","Medical fitness"]',0,'active',2),

  ('seed-cir-3','Saudi Arabia','sa','🇸🇦','Electrician','Electrician','MCL Overseas','SAR 1,700',25,'8 Hours','Provided','05 Sep 2026','19 Aug 2026',
   'Skilled electricians are required for electrical installation and maintenance work.',
   '["Electrical work experience","Valid passport","Technical knowledge","Medical fitness"]',0,'active',3),

  ('seed-cir-4','Malaysia','my','🇲🇾','Factory Worker','Factory Worker','MCL Overseas','RM 1,700',100,'8 Hours','Provided','10 Sep 2026','19 Aug 2026',
   'Factory workers are required for a Malaysian industrial company.',
   '["Valid passport","Physically fit","Factory work ability","Medical fitness"]',0,'active',4),

  ('seed-cir-5','UAE','ae','🇦🇪','Electrician','Electrician','MCL Overseas','AED 1,500',30,'8 Hours','Provided','08 Sep 2026','18 Aug 2026',
   'Experienced electricians are required for technical work in the UAE.',
   '["Electrical experience","Technical knowledge","Valid passport","Medical fitness"]',0,'active',5),

  ('seed-cir-6','Qatar','qa','🇶🇦','Welder','Welder','MCL Overseas','QAR 1,500',15,'8 Hours','Provided','12 Sep 2026','18 Aug 2026',
   'Skilled welders are required for industrial and construction-related work.',
   '["Welding experience","Technical skill","Valid passport","Medical fitness"]',0,'active',6),

  ('seed-cir-7','Oman','om','🇴🇲','Cleaner','Cleaner','MCL Overseas','OMR 120',40,'8 Hours','Provided','15 Sep 2026','17 Aug 2026',
   'Cleaners are required for general cleaning and maintenance duties in Oman.',
   '["Valid passport","Physically fit","Responsible attitude","Medical fitness"]',0,'active',7);

-- ---- Notices (from components/NoticeBoardList.tsx FALLBACK_NOTICES) ----------
INSERT OR IGNORE INTO notices
  (id, title_bn, title_en, notice_date, tag_type, tag_label_bn, tag_label_en, status, sort_order)
VALUES
  ('seed-not-1',
   'সম্প্রতি সংযুক্ত আরব আমিরাতে ভিসা বাতিল হওয়া প্রবাসী বাংলাদেশি নাগরিকদের তথ্য নিম্নে দেখুন',
   'Information on Bangladeshi nationals whose UAE visas were recently cancelled',
   '2026-09-01','new','নতুন','New','active',1),
  ('seed-not-2',
   '৩ ক্যাটাগরিতে বাণিজ্যিক গুরুত্বপূর্ণ ব্যক্তি (অনিবাসী বাংলাদেশি)-২০২৭ নির্বাচন সংক্রান্ত বিজ্ঞপ্তি',
   'Notice on the 2027 selection of commercially important persons (NRB) in 3 categories',
   '2026-08-30','new','নতুন','New','active',2),
  ('seed-not-3',
   'বার্ষিক ক্রয় পরিকল্পনা ২০২৬-২৭',
   'Annual procurement plan 2026-27',
   '2026-08-17','report','বিভিন্ন প্রতিবেদন','Reports','active',3);

-- ---- Popular countries (first 15 of app/countries.ts) -----------------------
INSERT OR IGNORE INTO popular_countries (id, code, name, sort_order, visible) VALUES
  ('pc-my','my','Malaysia',1,1),
  ('pc-sa','sa','Saudi Arabia',2,1),
  ('pc-ae','ae','UAE',3,1),
  ('pc-kw','kw','Kuwait',4,1),
  ('pc-qa','qa','Qatar',5,1),
  ('pc-om','om','Oman',6,1),
  ('pc-sg','sg','Singapore',7,1),
  ('pc-ro','ro','Romania',8,1),
  ('pc-rs','rs','Serbia',9,1),
  ('pc-it','it','Italy',10,1),
  ('pc-hu','hu','Hungary',11,1),
  ('pc-lt','lt','Lithuania',12,1),
  ('pc-bh','bh','Bahrain',13,1),
  ('pc-at','at','Austria',14,1),
  ('pc-be','be','Belgium',15,1);

-- ---- Site settings (from app/page.tsx `defaultNotice`) ----------------------
INSERT OR IGNORE INTO site_settings
  (id, contact_phone, contact_whatsapp, contact_email, office_address, notice_enabled, notice_bn, notice_en, notice_speed, notice_direction)
VALUES
  ('main','','','', '', 1,
   'বিশেষ বিজ্ঞপ্তি: নতুন চাকরির সার্কুলার প্রকাশিত হয়েছে। বিস্তারিত জানতে সার্কুলার দেখুন।',
   'Special Notice: New overseas job circulars have been published. Check the latest circulars for details.',
   25,'left');
