"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  profilePhotoKey: string;
};

const QUICK_LINKS = [
  { href: "/account/profile", icon: "👤", label: "আমার প্রোফাইল / My Profile" },
  { href: "/account/cv", icon: "📄", label: "আমার CV / My CV" },
  { href: "/account/applications", icon: "💼", label: "আমার আবেদন / My Applications" },
  { href: "/account/visa-status", icon: "🌍", label: "ভিসা স্ট্যাটাস / Visa Status" },
  { href: "/account/documents", icon: "📋", label: "আমার ডকুমেন্টস / My Documents" },
  { href: "/account/notifications", icon: "🔔", label: "নোটিফিকেশন / Notifications" },
  { href: "/account/settings", icon: "⚙️", label: "অ্যাকাউন্ট সেটিংস / Account Settings" },
];

export default function AccountDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/auth/profile", {
          method: "GET",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/account/login");
          return;
        }

        const data = (await res.json().catch(() => ({}))) as {
          user?: Profile;
        };

        if (!cancelled && data.user) setProfile(data.user);
      } catch {
        // handled by the loading/empty states below
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <p className="text-sm text-gray-500">লোড হচ্ছে... / Loading...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">

        <Link href="/" className="mb-4 inline-block text-sm font-semibold text-gray-500 hover:text-blue-600">
          ← ওয়েবসাইটে ফিরে যান / Back to Home
        </Link>

        {/* PROFILE SUMMARY */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-3xl text-gray-400">
              {profile.profilePhotoKey ? (
                <img
                  src="/api/auth/profile-photo"
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                "👤"
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold text-[#0B2A55]">{profile.name}</p>
              <p className="truncate text-sm text-gray-500">{profile.phone}</p>
              {profile.email && <p className="truncate text-sm text-gray-500">{profile.email}</p>}
            </div>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 text-sm font-medium text-gray-700 last:border-b-0 hover:bg-gray-50"
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
