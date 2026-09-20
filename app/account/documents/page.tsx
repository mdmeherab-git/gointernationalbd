"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Doc = {
  id: string;
  document_type: string;
  file_name: string;
  content_type: string;
  file_size: number;
  created_at: string;
};

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  passport: "Passport",
  cv: "CV",
  photo: "Passport Photo",
  nid: "NID",
  medical_report: "Medical Report",
  visa_copy: "Visa Copy",
  other: "Other",
};

const MAX_MB = 10;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AccountDocumentsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [documentType, setDocumentType] = useState("other");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/account/documents", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/account/login");
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { documents?: Doc[] };
    setDocs(data.documents ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadFile(file: File) {
    setError("");
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Document সর্বোচ্চ ${MAX_MB}MB হতে পারবে।`);
      return;
    }
    setUploading(true);
    try {
      const presignRes = await fetch("/api/account/documents/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mime: file.type, size: file.size, documentType }),
      });
      const presign = (await presignRes.json().catch(() => ({}))) as {
        mode?: string;
        uploadUrl?: string;
        key?: string;
        error?: string;
      };
      if (!presignRes.ok) {
        setError(presign.error || "Upload prepare করা যায়নি।");
        return;
      }

      if (presign.mode === "direct" && presign.uploadUrl && presign.key) {
        const putRes = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "content-type": file.type },
          body: file,
        });
        if (!putRes.ok) {
          setError("File upload করা যায়নি।");
          return;
        }
        const completeRes = await fetch("/api/account/documents/complete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ key: presign.key, fileName: file.name, mime: file.type, documentType }),
        });
        const completeData = (await completeRes.json().catch(() => ({}))) as { error?: string };
        if (!completeRes.ok) {
          setError(completeData.error || "File upload করা যায়নি।");
          return;
        }
      } else {
        const form = new FormData();
        form.append("file", file);
        form.append("documentType", documentType);
        const proxyRes = await fetch("/api/account/documents", { method: "POST", body: form });
        const proxyData = (await proxyRes.json().catch(() => ({}))) as { error?: string };
        if (!proxyRes.ok) {
          setError(proxyData.error || "File upload করা যায়নি।");
          return;
        }
      }

      await load();
    } catch {
      setError("সংযোগে সমস্যা / Network error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeDoc(id: string) {
    if (!confirm("এই document মুছে ফেলতে চান? / Delete this document?")) return;
    await fetch(`/api/account/documents/${id}`, { method: "DELETE" });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/account" className="mb-4 inline-block text-sm font-semibold text-gray-500 hover:text-blue-600">
          ← ড্যাশবোর্ড / Dashboard
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="mb-6 text-xl font-extrabold text-[#0B2A55]">আমার ডকুমেন্টস / My Documents</h1>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>
          )}

          {/* UPLOAD */}
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-dashed border-gray-300 p-4 sm:flex-row sm:items-center">
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none"
            >
              {Object.entries(DOCUMENT_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="flex-1 cursor-pointer rounded-xl border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50">
              {uploading ? "আপলোড হচ্ছে... / Uploading..." : "📤 Upload Document"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                }}
              />
            </label>
          </div>
          <p className="mb-6 -mt-3 text-xs text-gray-400">JPG, PNG, WebP, GIF অথবা PDF · সর্বোচ্চ {MAX_MB}MB</p>

          {loading && <p className="py-6 text-center text-sm text-gray-400">লোড হচ্ছে... / Loading...</p>}

          {!loading && docs.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-4xl">📋</p>
              <p className="mt-3 text-sm text-gray-500">এখনো কোনো document আপলোড করা হয়নি।</p>
            </div>
          )}

          <div className="space-y-3">
            {docs.map((doc) => {
              const isImage = doc.content_type.startsWith("image/");
              return (
                <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-xl">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/account/documents/${doc.id}/file`}
                        alt={doc.file_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "📄"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0B2A55]">{doc.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {DOCUMENT_TYPE_LABEL[doc.document_type] ?? doc.document_type} · {formatSize(doc.file_size)} ·{" "}
                      {doc.created_at?.slice(0, 10)}
                    </p>
                  </div>
                  <a
                    href={`/api/account/documents/${doc.id}/file?download=1`}
                    download={doc.file_name}
                    className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    ⬇
                  </a>
                  <button
                    type="button"
                    onClick={() => removeDoc(doc.id)}
                    className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
