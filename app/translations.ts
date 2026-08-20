export const translations = {
  bn: {
    nav: {
      home: "হোম",
      visaCheck: "ভিসা চেক",
      aiAssistant: "এআই অ্যাসিস্ট্যান্ট",
      jobs: "চাকরি",
      news: "নিউজ",
      aboutUs: "আমাদের সম্পর্কে",
      contact: "যোগাযোগ",
      login: "লগইন",
      register: "রেজিস্টার",
    },

    home: {
      officialVisa: "১০০+ দেশের অফিসিয়াল ভিসা চেক",
      title1: "অফিসিয়াল",
      title2: "ভিসা স্ট্যাটাস",
      title3: "চেক করুন",
      multipleCountries: "বিভিন্ন দেশের জন্য",
      description:
        "অফিসিয়াল সরকারি উৎস থেকে সরাসরি আপনার ভিসার স্ট্যাটাস চেক করুন। দ্রুত, নির্ভরযোগ্য এবং নিরাপদ।",
      selectCountry: "দেশ নির্বাচন করুন",
      selectVisaType: "ভিসার ধরন নির্বাচন করুন",
      passportNumber: "পাসপোর্ট নম্বর",
      checkVisa: "এখনই ভিসা চেক করুন",
      security: "আমরা আপনার পাসপোর্টের তথ্য সংরক্ষণ করি না। এটি ১০০% নিরাপদ।",
      popularCountries: "জনপ্রিয় দেশসমূহ",
      searchCountry: "দেশ খুঁজুন...",
    },

    jobs: {
      title: "বিদেশে চাকরির সার্কুলার",
      description:
        "বিভিন্ন দেশের সর্বশেষ বিদেশি চাকরির সুযোগ খুঁজে দেখুন।",
      searchJob: "চাকরি খুঁজুন...",
      allCountries: "সব দেশ",
      allCategories: "সব ক্যাটাগরি",
      driver: "ড্রাইভার",
      factoryWorker: "ফ্যাক্টরি ওয়ার্কার",
      electrician: "ইলেকট্রিশিয়ান",
      plumber: "প্লাম্বার",
      cleaner: "ক্লিনার",
      constructionWorker: "কনস্ট্রাকশন ওয়ার্কার",
      welder: "ওয়েল্ডার",
      technician: "টেকনিশিয়ান",
      viewDetails: "বিস্তারিত দেখুন",
      applyNow: "এখনই আবেদন করুন",
      new: "নতুন",
      salary: "বেতন",
      duty: "ডিউটি",
      accommodation: "থাকা",
      provided: "প্রদান করা হবে",
    },

    footer: {
      quickLinks: "কুইক লিংক",
      importantLinks: "গুরুত্বপূর্ণ লিংক",
      privacyPolicy: "প্রাইভেসি পলিসি",
      terms: "শর্তাবলী",
      copyright: "সর্বস্বত্ব সংরক্ষিত।",
    },
  },

  en: {
    nav: {
      home: "Home",
      visaCheck: "Visa Check",
      aiAssistant: "AI Assistant",
      jobs: "Jobs",
      news: "News",
      aboutUs: "About Us",
      contact: "Contact",
      login: "Login",
      register: "Register",
    },

    home: {
      officialVisa: "100+ Countries Official Visa Check",
      title1: "Check Official",
      title2: "Visa Status",
      title3: "Online",
      multipleCountries: "for Multiple Countries",
      description:
        "Check your visa status directly from official government sources. Fast, reliable and secure.",
      selectCountry: "Select Country",
      selectVisaType: "Select Visa Type",
      passportNumber: "Passport Number",
      checkVisa: "Check Visa Now",
      security:
        "We never save your passport information. It's 100% secure.",
      popularCountries: "Popular Countries",
      searchCountry: "Search country...",
    },

    jobs: {
      title: "Overseas Job Circulars",
      description:
        "Find the latest overseas job opportunities from different countries.",
      searchJob: "Search job...",
      allCountries: "All Countries",
      allCategories: "All Categories",
      driver: "Driver",
      factoryWorker: "Factory Worker",
      electrician: "Electrician",
      plumber: "Plumber",
      cleaner: "Cleaner",
      constructionWorker: "Construction Worker",
      welder: "Welder",
      technician: "Technician",
      viewDetails: "View Details",
      applyNow: "Apply Now",
      new: "New",
      salary: "Salary",
      duty: "Duty",
      accommodation: "Accommodation",
      provided: "Provided",
    },

    footer: {
      quickLinks: "Quick Links",
      importantLinks: "Important Links",
      privacyPolicy: "Privacy Policy",
      terms: "Terms & Conditions",
      copyright: "All rights reserved.",
    },
  },
} as const;

export type Language = keyof typeof translations;