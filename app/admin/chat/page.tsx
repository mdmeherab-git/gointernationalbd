"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiSend } from "@/components/admin/api";
import { useAdminLang } from "@/components/admin/AdminShell";
import {
  Btn,
  Card,
  EmptyState,
  PageHeader,
  TextInput,
  Toggle,
  useToast,
} from "@/components/admin/widgets";

type ConversationSummary = {
  id: string;
  user_id: string | null;
  visitor_id: string | null;
  status: "open" | "closed" | "archived";
  ai_enabled: number;
  admin_deleted_at: string | null;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_phone: string | null;
  user_email: string | null;
  last_message: string | null;
  last_message_at: string | null;
  last_message_kind: "document" | "media" | "audio" | null;
  unread_count: number;
};

type Message = {
  id: string;
  sender_type: "user" | "admin" | "ai";
  message: string;
  created_at: string;
  is_read: number;
  attachment_key: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  attachment_size: number | null;
  attachment_kind: "document" | "media" | "audio" | null;
};

type ConversationDetail = ConversationSummary;

const STATUS_TABS = ["all", "open", "archived"] as const;
const TYPE_TABS = ["all", "user", "guest"] as const;
const READ_TABS = ["all", "unread", "read"] as const;
const LIST_POLL_MS = 6000;
const THREAD_POLL_MS = 4000;

function formatBytes(size?: number | null) {
  if (!size || size < 1) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(value: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("bn-BD", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function formatDate(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function attachmentUrl(messageId: string) {
  return `/api/admin/chat/file?messageId=${encodeURIComponent(messageId)}`;
}

function conversationName(c: { user_name: string | null; visitor_id: string | null }) {
  if (c.user_name) return c.user_name;
  if (c.visitor_id) return `Guest-${c.visitor_id.slice(-6)}`;
  return "Guest";
}

const KIND_ICON: Record<string, string> = {
  document: "📄",
  media: "📷",
  audio: "🎙️",
};

export default function AdminChatPage() {
  const { t } = useAdminLang();
  const toast = useToast();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_TABS)[number]>("all");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_TABS)[number]>("all");
  const [readFilter, setReadFilter] = useState<(typeof READ_TABS)[number]>("all");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingKindRef = useRef<"document" | "media" | "audio" | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setQ(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadList = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (q) params.set("q", q);
    return apiGet<{ conversations: ConversationSummary[] }>(`/api/admin/chat?${params}`)
      .then((d) => setConversations(d.conversations))
      .catch((e) => {
        if ((e as Error).message !== "unauthorized") toast.push((e as Error).message, "err");
      });
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (q) params.set("q", q);
    apiGet<{ conversations: ConversationSummary[] }>(`/api/admin/chat?${params}`)
      .then((d) => setConversations(d.conversations))
      .catch((e) => {
        if ((e as Error).message !== "unauthorized") toast.push((e as Error).message, "err");
      })
      .finally(() => setLoadingList(false));
    const interval = window.setInterval(loadList, LIST_POLL_MS);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, q]);

  const loadThread = (id: string, showSpinner = false) => {
    if (showSpinner) setLoadingThread(true);
    return apiGet<{ conversation: ConversationDetail; messages: Message[] }>(
      `/api/admin/chat/${id}`,
    )
      .then((d) => {
        setDetail(d.conversation);
        setMessages(d.messages);
        setConversations((list) =>
          list.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
        );
      })
      .catch((e) => {
        if ((e as Error).message !== "unauthorized") toast.push((e as Error).message, "err");
      })
      .finally(() => showSpinner && setLoadingThread(false));
  };

  function closeThread() {
    setSelectedId(null);
    setDetail(null);
    setMessages([]);
  }

  useEffect(() => {
    if (!selectedId) return;
    apiGet<{ conversation: ConversationDetail; messages: Message[] }>(
      `/api/admin/chat/${selectedId}`,
    )
      .then((d) => {
        setDetail(d.conversation);
        setMessages(d.messages);
        setConversations((list) =>
          list.map((c) => (c.id === selectedId ? { ...c, unread_count: 0 } : c)),
        );
      })
      .catch((e) => {
        if ((e as Error).message !== "unauthorized") toast.push((e as Error).message, "err");
      })
      .finally(() => setLoadingThread(false));
    const interval = window.setInterval(() => loadThread(selectedId, false), THREAD_POLL_MS);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [messages]);

  const unreadConversationCount = useMemo(
    () => conversations.filter((c) => c.unread_count > 0).length,
    [conversations],
  );

  const visibleConversations = useMemo(() => {
    if (readFilter === "unread") return conversations.filter((c) => c.unread_count > 0);
    if (readFilter === "read") return conversations.filter((c) => c.unread_count === 0);
    return conversations;
  }, [conversations, readFilter]);

  async function sendReply() {
    const text = reply.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    try {
      await apiSend(`/api/admin/chat/${selectedId}`, "POST", { message: text });
      setReply("");
      await loadThread(selectedId, false);
      await loadList();
    } catch (e) {
      toast.push((e as Error).message, "err");
    } finally {
      setSending(false);
    }
  }

  function pickAttachment(kind: "document" | "media" | "audio") {
    setAttachMenuOpen(false);
    pendingKindRef.current = kind;
    if (!fileInputRef.current) return;
    fileInputRef.current.accept =
      kind === "document"
        ? ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip,application/x-rar-compressed"
        : kind === "audio"
          ? "audio/*"
          : "image/*,video/*";
    fileInputRef.current.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const kind = pendingKindRef.current;
    if (!file || !kind || !selectedId) return;
    await uploadAttachment(file, kind);
  }

  async function uploadAttachment(file: File, kind: "document" | "media" | "audio") {
    if (!selectedId || uploadingFile) return;
    setUploadingFile(true);
    try {
      const presignRes = await fetch("/api/admin/chat/upload/presign", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedId,
          fileName: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
          kind,
        }),
      });
      const presignData = (await presignRes.json().catch(() => ({}))) as {
        mode?: "direct" | "proxy";
        uploadUrl?: string;
        key?: string;
        error?: string;
      };
      if (!presignRes.ok) throw new Error(presignData.error || "File upload করা যায়নি।");

      if (presignData.mode === "direct" && presignData.uploadUrl && presignData.key) {
        const putRes = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: { "content-type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!putRes.ok) throw new Error("File upload করা যায়নি (storage)।");

        const completeRes = await fetch("/api/admin/chat/upload/complete", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            conversationId: selectedId,
            key: presignData.key,
            name: file.name,
            mime: file.type || "application/octet-stream",
            kind,
          }),
        });
        const completeData = (await completeRes.json().catch(() => ({}))) as { error?: string };
        if (!completeRes.ok) throw new Error(completeData.error || "File upload করা যায়নি।");
      } else {
        const form = new FormData();
        form.append("file", file);
        form.append("kind", kind);
        form.append("conversationId", selectedId);
        await apiSend("/api/admin/chat/upload", "POST", form);
      }

      await loadThread(selectedId, false);
      await loadList();
    } catch (e) {
      toast.push((e as Error).message, "err");
    } finally {
      setUploadingFile(false);
    }
  }

  async function runAction(action: string, value?: boolean) {
    if (!selectedId) return;
    setMenuOpen(false);
    try {
      await apiSend(`/api/admin/chat/${selectedId}`, "PATCH", { action, value });
      if (action === "delete_for_me" || action === "delete_conversation") {
        toast.push(t("কথোপকথন সরানো হয়েছে", "Conversation removed"));
        closeThread();
        await loadList();
        return;
      }
      await loadThread(selectedId, false);
      await loadList();
      toast.push(t("আপডেট হয়েছে", "Updated"));
    } catch (e) {
      toast.push((e as Error).message, "err");
    }
  }

  function confirmAction(action: "delete_for_me" | "delete_conversation") {
    const msg =
      action === "delete_for_me"
        ? t(
            "এই কথোপকথনটি শুধু আপনার (Admin) তালিকা থেকে সরানো হবে। ইউজার এখনো এটি দেখতে পাবে। এগিয়ে যাবেন?",
            "This conversation will be removed from your (Admin) list only. The user will still see it. Continue?",
          )
        : t(
            "এই কথোপকথনটি উভয় পক্ষের জন্যই লুকানো হবে (data মুছে যাবে না)। এগিয়ে যাবেন?",
            "This conversation will be hidden for both sides (no data is deleted). Continue?",
          );
    if (confirm(msg)) runAction(action);
  }

  return (
    <>
      <PageHeader
        title={t("চ্যাট সেন্টার", "Chat Center")}
        subtitle={t(
          "সকল guest ও registered user কথোপকথন এক জায়গায়।",
          "All guest and registered user conversations in one place.",
        )}
        action={
          unreadConversationCount > 0 ? (
            <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
              {t(`অপঠিত: ${unreadConversationCount}`, `Unread: ${unreadConversationCount}`)}
            </span>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]" style={{ minHeight: 560 }}>
        {/* Conversation list */}
        <Card className={`flex flex-col overflow-hidden ${selectedId ? "hidden lg:flex" : "flex"}`}>
          <div className="space-y-2.5 border-b border-gray-100 p-3">
            <TextInput
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("নাম বা মোবাইল দিয়ে খুঁজুন...", "Search name or mobile...")}
            />
            <div className="flex flex-wrap gap-1.5">
              {READ_TABS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReadFilter(r)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    readFilter === r
                      ? "bg-red-500 text-white"
                      : "border border-gray-200 bg-white text-gray-600"
                  }`}
                >
                  {r === "all"
                    ? t("সব", "All")
                    : r === "unread"
                      ? t("অপঠিত", "Unread")
                      : t("পঠিত", "Read")}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_TABS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                    statusFilter === s
                      ? "bg-[#0B4DBB] text-white"
                      : "border border-gray-200 bg-white text-gray-600"
                  }`}
                >
                  {s === "all" ? t("সব", "All") : s === "open" ? t("চলমান", "Open") : t("আর্কাইভ", "Archived")}
                </button>
              ))}
              <span className="mx-1 self-center text-gray-300">|</span>
              {TYPE_TABS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTypeFilter(s)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                    typeFilter === s
                      ? "bg-purple-100 text-purple-700"
                      : "border border-gray-200 bg-white text-gray-600"
                  }`}
                >
                  {s === "all" ? t("সব", "All") : s === "user" ? t("রেজিস্টার্ড", "Registered") : t("গেস্ট", "Guest")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingList && <EmptyState text={t("লোড হচ্ছে...", "Loading...")} />}
            {!loadingList && visibleConversations.length === 0 && (
              <EmptyState
                text={
                  readFilter === "unread"
                    ? t("কোনো অপঠিত কথোপকথন নেই", "No unread conversations")
                    : t("কোনো কথোপকথন নেই", "No conversations")
                }
              />
            )}
            {visibleConversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50 ${
                  selectedId === c.id ? "bg-blue-50" : c.unread_count > 0 ? "bg-red-50/50" : ""
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg">
                  {c.user_id ? "👤" : "🌐"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-sm ${
                        c.unread_count > 0 ? "font-extrabold text-[#0B2A55]" : "font-bold text-[#0B2A55]"
                      }`}
                    >
                      {conversationName(c)}
                    </p>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {formatTime(c.last_message_at || c.updated_at)}
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 truncate text-xs ${
                      c.unread_count > 0 ? "font-semibold text-gray-700" : "text-gray-500"
                    }`}
                  >
                    {c.last_message_kind ? `${KIND_ICON[c.last_message_kind]} ` : ""}
                    {c.last_message || t("কোনো বার্তা নেই", "No messages yet")}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {c.status === "archived" && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500">
                        {t("আর্কাইভড", "Archived")}
                      </span>
                    )}
                    {!c.ai_enabled ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                        {t("Human", "Human")}
                      </span>
                    ) : null}
                    {c.unread_count > 0 && (
                      <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Thread */}
        <Card className={`flex flex-col overflow-hidden ${selectedId ? "flex" : "hidden lg:flex"}`}>
          {!selectedId || !detail ? (
            <EmptyState
              text={
                loadingThread
                  ? t("লোড হচ্ছে...", "Loading...")
                  : t("একটি কথোপকথন নির্বাচন করুন", "Select a conversation")
              }
            />
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                <button
                  type="button"
                  onClick={closeThread}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 lg:hidden"
                >
                  ←
                </button>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg">
                  {detail.user_id ? "👤" : "🌐"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-[#0B2A55]">
                    {conversationName(detail)}
                  </p>
                  <p className="truncate text-[11px] text-gray-500">
                    {detail.user_phone || detail.user_email || t("গেস্ট ইউজার", "Guest user")}
                  </p>
                </div>

                <Toggle
                  checked={!!detail.ai_enabled}
                  onChange={(v) => runAction("toggle_ai", v)}
                  label={
                    detail.ai_enabled
                      ? t("AI Assistant: ON", "AI Assistant: ON")
                      : t("Office Team: Active", "Office Team: Active")
                  }
                />

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >
                    ⋮
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                      {detail.status === "archived" ? (
                        <MenuItem onClick={() => runAction("unarchive")}>
                          📤 {t("আর্কাইভ থেকে ফেরান", "Unarchive")}
                        </MenuItem>
                      ) : (
                        <MenuItem onClick={() => runAction("archive")}>
                          🗄️ {t("আর্কাইভ করুন", "Archive")}
                        </MenuItem>
                      )}
                      <MenuItem onClick={() => confirmAction("delete_for_me")}>
                        🙈 {t("Delete for Me", "Delete for Me")}
                      </MenuItem>
                      <MenuItem danger onClick={() => confirmAction("delete_conversation")}>
                        🗑️ {t("Delete Conversation", "Delete Conversation")}
                      </MenuItem>
                    </div>
                  )}
                </div>
              </div>

              <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto bg-[#f7f9fc] px-4 py-4">
                {messages.length === 0 ? (
                  <EmptyState text={t("কোনো বার্তা নেই", "No messages yet")} />
                ) : (
                  messages.map((m, index) => {
                    const isAdmin = m.sender_type === "admin";
                    const isAi = m.sender_type === "ai";
                    const isLastAdminMessage =
                      isAdmin &&
                      !messages.slice(index + 1).some((x) => x.sender_type === "admin");
                    const showSeen = isLastAdminMessage && m.is_read === 1;
                    return (
                      <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                            isAdmin
                              ? "rounded-br-md bg-[#0B4DBB] text-white"
                              : "rounded-bl-md border border-gray-200 bg-white text-gray-700"
                          }`}
                        >
                          {!isAdmin && (
                            <p className="mb-1 text-[10px] font-bold text-[#0B4DBB]">
                              {isAi ? "🤖 GO Assistant" : "👤 User"}
                            </p>
                          )}
                          {isAdmin && (
                            <p className="mb-1 text-[10px] font-bold text-blue-100">
                              👨‍💼 Office Team
                            </p>
                          )}

                          {m.attachment_kind ? (
                            <div className="space-y-2">
                              {m.attachment_kind === "media" && m.attachment_mime?.startsWith("image/") && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={attachmentUrl(m.id)}
                                  alt={m.attachment_name || "Image"}
                                  className="max-h-56 w-full max-w-[260px] rounded-xl object-cover"
                                />
                              )}
                              {m.attachment_kind === "media" && m.attachment_mime?.startsWith("video/") && (
                                <video
                                  controls
                                  preload="metadata"
                                  src={attachmentUrl(m.id)}
                                  className="max-h-56 w-full max-w-[260px] rounded-xl"
                                />
                              )}
                              {m.attachment_kind === "audio" && (
                                <audio controls preload="metadata" src={attachmentUrl(m.id)} className="h-9 max-w-[260px]" />
                              )}
                              {m.attachment_kind === "document" && (
                                <a
                                  href={attachmentUrl(m.id)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                                    isAdmin ? "bg-white/10" : "bg-purple-50"
                                  }`}
                                >
                                  <span className="text-lg">📄</span>
                                  <span className="min-w-0">
                                    <span className="block truncate text-xs font-semibold">
                                      {m.attachment_name || m.message}
                                    </span>
                                    {m.attachment_size ? (
                                      <span className={`block text-[9px] ${isAdmin ? "text-blue-100" : "text-gray-400"}`}>
                                        {formatBytes(m.attachment_size)}
                                      </span>
                                    ) : null}
                                  </span>
                                </a>
                              )}
                              {m.attachment_kind !== "document" && m.attachment_name && (
                                <p className="max-w-[240px] truncate text-[10px] font-medium">
                                  {m.attachment_name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-sm leading-5">{m.message}</p>
                          )}

                          <p className={`mt-1 text-[9px] ${isAdmin ? "text-blue-100" : "text-gray-400"}`}>
                            {formatDate(m.created_at)} {formatTime(m.created_at)}
                          </p>
                          {showSeen && (
                            <p className="mt-0.5 text-right text-[9px] text-blue-100">Seen</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-gray-100 p-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelected}
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAttachMenuOpen((v) => !v)}
                    disabled={uploadingFile}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    title={t("Attachment", "Attachment")}
                  >
                    {uploadingFile ? "…" : "📎"}
                  </button>
                  {attachMenuOpen && (
                    <div className="absolute bottom-12 left-0 z-20 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                      <MenuItem onClick={() => pickAttachment("document")}>
                        📄 {t("Document", "Document")}
                      </MenuItem>
                      <MenuItem onClick={() => pickAttachment("media")}>
                        🖼️ {t("Photo/Video", "Photo/Video")}
                      </MenuItem>
                      <MenuItem onClick={() => pickAttachment("audio")}>
                        🎙️ {t("Audio", "Audio")}
                      </MenuItem>
                    </div>
                  )}
                </div>
                <TextInput
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder={t("আপনার বার্তা লিখুন...", "Type your reply...")}
                  className="flex-1"
                />
                <Btn onClick={sendReply} disabled={sending || !reply.trim()}>
                  {sending ? "…" : t("পাঠান", "Send")}
                </Btn>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-semibold hover:bg-gray-50 ${
        danger ? "text-red-600" : "text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
