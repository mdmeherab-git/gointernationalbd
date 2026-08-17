"use client";

import { useState } from "react";
import { countries } from "./countries";

export default function Home() {

const [countrySearch, setCountrySearch] = useState("");
const [selectedCountry, setSelectedCountry] = useState("");
const [visaType, setVisaType] = useState("");
const [passportNumber, setPassportNumber] = useState("");
const [saudiServicesOpen, setSaudiServicesOpen] = useState(false);
const [malaysiaServicesOpen, setMalaysiaServicesOpen] = useState(false);

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );
  const handleVisaCheck = () => {
  if (!selectedCountry) {
    alert("Please select a country.");
    return;
  }

  if (!visaType) {
    alert("Please select a visa type.");
    return;
  }

  if (!passportNumber.trim()) {
    alert("Please enter your passport number.");
    return;
  }

  if (selectedCountry === "sa") {
  setSaudiServicesOpen(true);
  return;
}

if (selectedCountry === "my") {
  setMalaysiaServicesOpen(true);
  return;
}

alert(
  `Visa check for ${selectedCountry.toUpperCase()} is not connected yet.`
);
};

  return (
    <main className="min-h-screen bg-white">

      {/* ================= TOP BAR ================= */}
      <div className="bg-[#071B41] text-white text-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">

          <div className="flex items-center gap-5">
            <span>✉ info@gointernationalbd.com</span>
            <span className="opacity-50">|</span>
            <span>☎ +88 01872 32 75 75</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Follow Us :</span> 
            <span>Facebook</span>
            <span>YouTube</span>
            <span>Instagram</span>
            <span>LinkedIn</span>
          </div>

        </div> 
      </div>


      {/* ================= MAIN HEADER ================= */}
      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">

          {/* LOGO */}
          <div>
            <div className="text-2xl font-bold tracking-tight">
              <span className="text-[#0B4DBB]">
                GO INTERNATIONAL
              </span>{" "}
              <span className="text-red-500">
                BD
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-600">
              Official Visa Check & Immigration Assistant
            </p>
          </div>


          {/* NAVIGATION */}
          <nav className="flex items-center gap-8 text-[17px]">

            <a
              href="#"
              className="text-blue-600"
            >
              Home
            </a>

            <a
              href="#"
              className="text-gray-800 hover:text-blue-600"
            >
              Visa Check
            </a>

            <a
              href="#"
              className="text-gray-800 hover:text-blue-600"
            >
              AI Assistant
            </a>

            <a
              href="#"
              className="text-gray-800 hover:text-blue-600"
            >
              Jobs
            </a>

            <a
              href="#"
              className="text-gray-800 hover:text-blue-600"
            >
              News
            </a>

            <a
              href="#"
              className="text-gray-800 hover:text-blue-600"
            >
              About Us
            </a>

            <a
              href="#"
              className="text-gray-800 hover:text-blue-600"
            >
              Contact
            </a>

          </nav>


          {/* LOGIN / REGISTER */}
          <div className="flex items-center gap-3">

            <button className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-500">
              Login
            </button>

            <button className="rounded-lg bg-blue-600 px-6 py-2.5 text-white hover:bg-blue-700">
              Register
            </button>

          </div>

        </div>

      </header>


      {/* =============================================== */}
      {/* ================ HERO SECTION ================= */}
      {/* =============================================== */}

      <section className="w-full bg-white">

        {/* 2 INCH LEFT + RIGHT SPACE */}
        <div className="relative mx-[192px] max-md:mx-0">

          {/* HERO IMAGE */}
          <img
            src="/hero.png"
            alt="Go International BD Travel" 
            className="block h-auto w-full"
          />

      


          {/* HERO CONTENT */}
                <div
                   className="absolute inset-0 z-10 flex items-center"
              style={{
                  transform: "translate(0px, 100px)",
                        }}
                      >
            <div className="w-full px-12 max-md:px-6">

              <div className="max-w-[600px]">

                {/* BADGE */}
                <div className=" relative -top-2 mb-6 inline-flex items-center rounded-full border 
                border-blue-200 bg-white/95 px-5 py-2 text-sm text-blue-600 shadow-md">

                  <span>🛡️</span>

                  <span className="ml-2">
                    100+ Countries Official Visa Check 
                  </span>

                </div>


                {/* TITLE */}
                <h1 className="relative -top-5 text-5xl font-bold leading-tight text-[#000000] max-lg:text-4xl">

                  Check Official{" "}

                  <span className="text-blue-600">
                    Visa Status
                  </span> 

                  <br />

                  for Multiple Countries

                </h1>


                {/* DESCRIPTION */}
                <p className=" relative -top-5 mt-4 max-w-[600px] text-lg leading-7 text-gray-700">

                  Check your visa status directly from official
                  government sources. Fast, reliable and 100% secure.

                </p>


                {/* VISA CHECK BOX */}
                <div className="mt-20 w-fit rounded-2xl bg-white p-2 shadow-xl">

                  <div className="flex items-center gap-2">

                    {/* COUNTRY */}
                     <select
                       value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
              className="h-14 w-36 rounded-xl border border-gray-200 bg-white px-3 text-gray-700 outline-none focus:border-blue-500"
                    >
                        <option value="">Select Country</option>

                     {countries.map((country) => (
                         <option key={country.code} value={country.code}>
                       {country.name}
                        </option>
                        ))}
                     </select>

                 {/* VISA TYPE */}
                  <select
                    value={visaType}
                    onChange={(e) => setVisaType(e.target.value)}
                 className="h-14 w-37 rounded-xl border border-gray-200 bg-white px-1 text-gray-700 outline-none focus:border-blue-500"
                      >
                      <option value="">Select Visa Type</option>
                      <option value="work">Work Visa</option>
                      <option value="tourist">Tourist Visa</option>
                      <option value="student">Student Visa</option>
                      <option value="business">Business Visa</option>
                      <option value="family">Family Visa</option>
                      <option value="transit">Transit Visa</option>
                   </select>


                    {/* PASSPORT NUMBER */}
                    <input
                     type="text"
                     value={passportNumber}
                     onChange={(e) => setPassportNumber(e.target.value)}
                     placeholder="Passport Number"
                     className="h-14 w-52 rounded-xl border border-gray-200 bg-white px-4 text-gray-700 
                     outline-none placeholder:text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />


                    <button
                     type="button"
                      onClick={handleVisaCheck}
                     className="h-14 w-40 rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700"
                     >
                      🔍 Check Visa
                      <br />
                     Now
                    </button>

                  </div>

                  {saudiServicesOpen && (
                         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                         <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                         <div className="mb-5 flex items-center justify-between">
                              <div>
                                <h3 className="text-xl font-bold text-[#0B2A55]">
                                 Saudi Arabia
                           </h3>

          <p className="mt-1 text-sm text-gray-500">
            Select a service to continue 
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSaudiServicesOpen(false)}
          className="text-2xl text-gray-400 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">

        <a
          href="https://visa.mofa.gov.sa/VisaPerson/GetApplicantData"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-500 hover:bg-blue-50"
        >
          <div>
            <div className="font-semibold text-gray-800">
              🛂 Saudi Visa Check
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Check Saudi visa information
            </div>
          </div>
          <span className="text-blue-600">→</span>
        </a>

        <a
          href="https://wafid.com/en/medical-status-search/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-green-500 hover:bg-green-50"
        >
          <div>
            <div className="font-semibold text-gray-800">
              🏥 Saudi Medical Check
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Check Wafid medical status
            </div>
          </div>
          <span className="text-green-600">→</span>
        </a>

        <a
          href="https://visa.mofa.gov.sa/VisaPerson/CheckMedicalResult"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-purple-500 hover:bg-purple-50"
        >
          <div>
            <div className="font-semibold text-gray-800">
              📋 Medical Update Check
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Check updated medical result
            </div>
          </div>
          <span className="text-purple-600">→</span>
        </a>

        <a
          href="https://visa.mofa.gov.sa/Enjaz/GetVisaInformation/Person"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-orange-500 hover:bg-orange-50"
        >
          <div>
            <div className="font-semibold text-gray-800">
              📄 Saudi Enjaz / Ocala Check
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Check Enjaz visa information
            </div>
          </div>
          <span className="text-orange-600">→</span>
        </a>

      </div>

      <button
        type="button"
        onClick={() => setSaudiServicesOpen(false)}
        className="mt-5 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        Close
      </button>

     </div>
   </div>
  )}

  {malaysiaServicesOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

      {/* HEADER */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#0B2A55]">
            🇲🇾 Malaysia
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Select a service to continue
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMalaysiaServicesOpen(false)}
          className="text-2xl text-gray-400 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      {/* VISA CHECK */}
      <a
        href="https://malaysiavisa.imi.gov.my/evisa/check-evisa"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-500 hover:bg-blue-50"
      >
        <div>
          <div className="font-semibold text-gray-800">
            🛂 Malaysia Visa Check
          </div>

          <div className="mt-1 text-xs text-gray-500">
            Check Malaysia eVISA status
          </div>
        </div>

        <span className="text-blue-600">→</span>
      </a>

      {/* MEDICAL CHECK */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">

        <div className="mb-3">
          <div className="font-semibold text-gray-800">
            🏥 Medical Check
          </div>

          <div className="mt-1 text-xs text-gray-500">
            Select medical center
          </div>
        </div>

        {/* CURRENT MEDICAL CENTER */}
        <a
          href="https://rhmcdhk.com/malaysia-medical-report/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 transition hover:border-green-500 hover:bg-green-50"
        >
          <div>
            <div className="text-sm font-medium text-gray-800">
              RHMC Medical Check
            </div>

            <div className="mt-1 text-xs text-gray-500">
              Check Malaysia medical report
            </div>
          </div>

          <span className="text-green-600">→</span>
        </a>

      </div>

      {/* CLOSE */}
      <button
        type="button"
        onClick={() => setMalaysiaServicesOpen(false)}
        className="mt-5 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        Close
      </button>

    </div>
  </div>
)}

{malaysiaServicesOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

      {/* HEADER */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#0B2A55]">
            🇲🇾 Malaysia
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Select a service to continue
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMalaysiaServicesOpen(false)}
          className="text-2xl text-gray-400 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      {/* VISA CHECK */}
      <a
        href="https://malaysiavisa.imi.gov.my/evisa/check-evisa"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-500 hover:bg-blue-50"
      >
        <div>
          <div className="font-semibold text-gray-800">
            🛂 Malaysia Visa Check
          </div>

          <div className="mt-1 text-xs text-gray-500">
            Check Malaysia eVISA status
          </div>
        </div>

        <span className="text-blue-600">→</span>
      </a>

      {/* MEDICAL CHECK */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">

        <div className="mb-3">
          <div className="font-semibold text-gray-800">
            🏥 Medical Check
          </div>

          <div className="mt-1 text-xs text-gray-500">
            Select medical center
          </div>
        </div>

        {/* CURRENT MEDICAL CENTER */}
        <a
          href="https://rhmcdhk.com/malaysia-medical-report/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 transition hover:border-green-500 hover:bg-green-50"
        >
          <div>
            <div className="text-sm font-medium text-gray-800">
              RHMC Medical Check
            </div>

            <div className="mt-1 text-xs text-gray-500">
              Check Malaysia medical report
            </div>
          </div>

          <span className="text-green-600">→</span>
        </a>

      </div>

      {/* CLOSE */}
      <button
        type="button"
        onClick={() => setMalaysiaServicesOpen(false)}
        className="mt-5 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        Close
      </button>

    </div>
  </div>
)}

              {/* SECURITY */}
                  <div className="mt-2 text-center text-xs text-gray-500">

                    🛡️ We never save your passport information.
                    It's 100% secure.

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>
      {/* POPULAR COUNTRIES + SERVICES */}
 <section className="w-full bg-white py-8">
  <div className="mx-[165px] max-md:mx-0 px-6">

    {/* POPULAR COUNTRIES */}  
 <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">

  {/* HEADER */}
  <div className="mb-5 flex items-center justify-between gap-4">

    <h2 className="text-xl font-bold text-[#0B2A55]">
      Popular Countries
    </h2>

    {/* SEARCH */}
    <div className="relative z-20 w-full max-w-[280px]">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </span>

      <input
        type="text"
        value={countrySearch}
        onChange={(e) => setCountrySearch(e.target.value)}
        placeholder="Search country..."
        className="relative z-20 w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>

  </div>

  {/* COUNTRIES */}
  <div className="overflow-x-auto pb-2">
    <div className="flex min-w-max gap-6">

      {filteredCountries.map((country) => (
        <button
          key={country.code}
          type="button"

            onClick={() => {
               if (country.code === "my") {
               setMalaysiaServicesOpen(true);
               }
             }}

          className="group w-[95px] flex-shrink-0 text-center"
        >
          <div className="mx-auto flex h-14 w-20 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-blue-300 group-hover:shadow-md">
            <img
              src={`/flags/${country.code}.svg`}
              alt={country.name}
              className="h-full w-full object-cover"
            />
          </div>

          <p className="mt-2 whitespace-nowrap text-sm font-medium text-gray-700 group-hover:text-blue-600">
            {country.name}
          </p>
        </button>
      ))}

    </div>
  </div>

</div>


    {/* SERVICES */}
    <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

      {/* VISA CHECK */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-3xl">
          📄
        </div>

        <h3 className="text-lg font-bold text-[#0B2A55]">
          Official Visa Check
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Check visa status from official government sources.
        </p>

        <button className="mt-5 font-semibold text-blue-600 hover:text-blue-700">
          Check Now →
        </button>
      </div>


      {/* AI ASSISTANT */}
      <div className="rounded-2xl border border-green-100 bg-green-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-3xl">
          🤖
        </div>

        <h3 className="text-lg font-bold text-[#0B2A55]">
          AI Visa Assistant
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Ask anything about visa, jobs, requirements and more.
        </p>

        <button className="mt-5 font-semibold text-green-600 hover:text-green-700">
          Start Chat →
        </button>
      </div>


      {/* JOBS */}
      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 text-3xl">
          💼
        </div>

        <h3 className="text-lg font-bold text-[#0B2A55]">
          Job Circular
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Find latest overseas jobs from reliable sources.
        </p>

        <button className="mt-5 font-semibold text-purple-600 hover:text-purple-700">
          View Jobs →
        </button>
      </div>


      {/* TRACK APPLICATION */}
      <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100 text-3xl">
          📋
        </div>

        <h3 className="text-lg font-bold text-[#0B2A55]">
          Track Application
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Track your visa or application status easily.
        </p>

        <button className="mt-5 font-semibold text-orange-600 hover:text-orange-700">
          Track Now →
        </button>
      </div>

    </div>

  </div>
</section> 

    </main>
  );
}