export default function Home() {
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
          <div className="absolute inset-0 z-10 flex items-center">

            <div className="w-full px-12 max-md:px-6">

              <div className="max-w-[600px]">

                {/* BADGE */}
                <div className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-white/95 px-5 py-2 text-sm text-blue-600 shadow-md">

                  <span>🛡️</span>

                  <span className="ml-2">
                    100+ Countries Official Visa Check
                  </span>

                </div>


                {/* TITLE */}
                <h1 className="text-5xl font-bold leading-tight text-[#000000] max-lg:text-4xl">

                  Check Official{" "}

                  <span className="text-blue-600">
                    Visa Status
                  </span>

                  <br />

                  for Multiple Countries

                </h1>


                {/* DESCRIPTION */}
                <p className="mt-6 max-w-[600px] text-lg leading-7 text-gray-700">

                  Check your visa status directly from official
                  government sources. Fast, reliable and 100% secure.

                </p>


                {/* VISA CHECK BOX */}
                <div className="mt-8 w-fit rounded-2xl bg-white p-2 shadow-xl">

                  <div className="flex items-center gap-2">

                    {/* COUNTRY */}
                    <div className="flex h-14 w-36 items-center justify-between rounded-xl border border-gray-200 px-4 text-gray-700">

                      <span>
                        Select
                        <br />
                        Country
                      </span>

                      <span>
                       ⌄
                      </span>

                    </div>


                    {/* VISA TYPE */}
                    <div className="flex h-14 w-36 items-center justify-between rounded-xl border border-gray-200 px-4 text-gray-700">

                      <span>
                        Select Visa
                        <br />
                        Type
                      </span>

                      <span>
                        ⌄
                      </span>

                    </div>


                    {/* PASSPORT NUMBER */}
                    <div className="flex h-14 w-52 items-center rounded-xl border border-gray-200 px-4 text-gray-300">

                      Passport Number

                    </div>


                    {/* CHECK BUTTON */}
                    <button className="h-14 w-40 rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700">

                      🔍 Check Visa
                      <br />
                      Now

                    </button>

                  </div>


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


      {/* ================= SERVICES SECTION ================= */}

      <section className="bg-white py-16">

        <div className="mx-auto max-w-7xl px-6">

          <h2 className="text-center text-3xl font-bold text-[#071B41]">
            Explore Our Services
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
            Fast, reliable and secure immigration and visa assistance.
          </p>

        </div>

      </section>

    </main>
  );
}