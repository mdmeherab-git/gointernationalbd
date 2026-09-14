"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  profilePhotoKey: string;
  passportNumber: string;
  passportIssue: string;
  passportExpiry: string;
};

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photoVersion, setPhotoVersion] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportIssue, setPassportIssue] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          ok?: boolean;
          user?: Profile;
        };

        if (!res.ok || !data.user) {
          if (!cancelled) setError("প্রোফাইল লোড করা যায়নি / Could not load profile");
          return;
        }

        if (!cancelled) {
          setProfile(data.user);
          setName(data.user.name);
          setEmail(data.user.email || "");
          setPassportNumber(data.user.passportNumber);
          setPassportIssue(data.user.passportIssue);
          setPassportExpiry(data.user.passportExpiry);
        }
      } catch {
        if (!cancelled) setError("সংযোগে সমস্যা / Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function saveChanges(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          name,
          email,
          passportNumber,
          passportIssue,
          passportExpiry,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: Profile;
      };

      if (!res.ok) {
        setError(data.error || "প্রোফাইল আপডেট করা যায়নি / Could not update profile");
        return;
      }

      if (data.user) setProfile(data.user);
      setSuccess("প্রোফাইল আপডেট হয়েছে / Profile updated");
    } catch {
      setError("সংযোগে সমস্যা / Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(file: File) {
    setError("");
    setSuccess("");
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch("/api/auth/profile-photo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        profilePhotoKey?: string;
      };

      if (!res.ok) {
        setError(data.error || "ছবি আপলোড করা যায়নি / Could not upload photo");
        return;
      }

      setProfile((prev) => (prev ? { ...prev, profilePhotoKey: data.profilePhotoKey || "x" } : prev));
      setPhotoVersion((v) => v + 1);
      setSuccess("ছবি আপডেট হয়েছে / Photo updated");
    } catch {
      setError("সংযোগে সমস্যা / Network error");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemovePhoto() {
    setError("");
    setSuccess("");
    setUploadingPhoto(true);

    try {
      const res = await fetch("/api/auth/profile-photo", {
        method: "DELETE",
        credentials: "include",
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error || "ছবি মুছে ফেলা যায়নি / Could not delete photo");
        return;
      }

      setProfile((prev) => (prev ? { ...prev, profilePhotoKey: "" } : prev));
      setPhotoVersion((v) => v + 1);
      setSuccess("ছবি মুছে ফেলা হয়েছে / Photo removed");
    } catch {
      setError("সংযোগে সমস্যা / Network error");
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <p className="text-sm text-gray-500">লোড হচ্ছে... / Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error || "প্রোফাইল পাওয়া যায়নি / Profile not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">

        <Link
          href="/account"
          className="mb-4 inline-block text-sm font-semibold text-gray-500 hover:text-blue-600"
        >
          ← ড্যাশবোর্ড / Dashboard
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

          <h1 className="mb-6 text-xl font-extrabold text-[#0B2A55]">
            আমার প্রোফাইল / My Profile
          </h1>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
          {success && (
            <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              {success}
            </p>
          )}

          {/* PHOTO */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-4xl text-gray-400">
              {profile.profilePhotoKey ? (
                <img
                  key={photoVersion}
                  src={`/api/auth/profile-photo?v=${photoVersion}`}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                "👤"
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-700">
                {uploadingPhoto ? "..." : "ছবি পরিবর্তন করুন / Change Photo"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoChange(file);
                  }}
                />
              </label>

              {profile.profilePhotoKey && (
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={handleRemovePhoto}
                  className="text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-60"
                >
                  মুছে ফেলুন / Remove
                </button>
              )}
            </div>

            <p className="text-center text-xs text-gray-400">
              JPG, PNG অথবা WebP · সর্বোচ্চ ৫ MB
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={saveChanges} className="space-y-4">

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                নাম / Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                মোবাইল নম্বর / Mobile Number
              </label>
              <input
                value={profile.phone}
                disabled
                className={`${INPUT_CLASS} bg-gray-100 text-gray-500`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Gmail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                maxLength={80}
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Passport Number
                </label>
                <input
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  maxLength={30}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Passport Issue Date
                </label>
                <input
                  value={passportIssue}
                  onChange={(e) => setPassportIssue(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  maxLength={20}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Passport Expiry Date
                </label>
                <input
                  value={passportExpiry}
                  onChange={(e) => setPassportExpiry(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  maxLength={20}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#0B4DBB] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#093f98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
