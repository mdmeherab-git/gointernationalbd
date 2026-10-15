"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { trackPixel } from "../../lib/meta-pixel";
import { buildWhatsappUrl } from "../../lib/whatsapp";

const HIDDEN_KEY = "gib-office-chat-hidden-v1";

// Scrolled past this many px = "scrolled down" (label stays tucked in).
const HELP_LABEL_SCROLL_THRESHOLD = 40;
// Every time "হেল্প" slides out (first load, scrolling up, top of page) it
// stays out this long, then sinks back into the icon.
const HELP_LABEL_VISIBLE_MS = 2000;
// Ignore tiny scroll jitters when deciding the scroll direction.
const HELP_LABEL_SCROLL_DELTA = 6;

type Message = {
  id: string;
  sender_type: "user" | "admin" | "ai";
  message: string;
  created_at: string;
  is_read?: number;
  attachment_name?: string | null;
  attachment_mime?: string | null;
  attachment_size?: number | null;
  attachment_kind?: "document" | "media" | "audio" | null;
};

type ChatResponse = {
  authenticated?: boolean;
  needsIdentity?: boolean;
  messages?: Message[];
  messageCount?: number;
  unread?: number;
  error?: string;
};


function IconBase({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </IconBase>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </IconBase>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m3 16 4.5-4.5a2 2 0 0 1 2.83 0L13 14.17l1.17-1.17a2 2 0 0 1 2.83 0L21 17" />
    </IconBase>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5M8.5 21.5h7" />
    </IconBase>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
    </IconBase>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </IconBase>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 14h10l1-14" />
    </IconBase>
  );
}

function MoreVerticalIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </IconBase>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />
    </IconBase>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </IconBase>
  );
}

/* Glass-look message bubble (3 dots) used directly as the chat head. */
function ChatGlassIcon({ className = "h-[62px] w-[62px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      style={{ filter: "drop-shadow(0 6px 9px rgba(16,69,214,0.45))" }}
    >
      <defs>
        <linearGradient id="gib-glass-body" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4EC1FB" />
          <stop offset="1" stopColor="#1045D6" />
        </linearGradient>
        <linearGradient id="gib-glass-shine" x1="0" y1="8" x2="0" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gib-glass-rim" x1="6" y1="8" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="gib-glass-glow" cx="0.5" cy="1" r="0.7">
          <stop offset="0" stopColor="#8FDCFF" stopOpacity="0.6" />
          <stop offset="1" stopColor="#8FDCFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M20 8h24a14 14 0 0 1 14 14v10a14 14 0 0 1-14 14H31L17 58l2-12h-1A14 14 0 0 1 6 32V22A14 14 0 0 1 20 8Z"
        fill="url(#gib-glass-body)"
      />
      <path
        d="M20 8h24a14 14 0 0 1 14 14v10a14 14 0 0 1-14 14H31L17 58l2-12h-1A14 14 0 0 1 6 32V22A14 14 0 0 1 20 8Z"
        fill="url(#gib-glass-glow)"
      />
      <path
        d="M20 10.5h24a11.5 11.5 0 0 1 11.2 8.9C47 15.4 33 14.4 8.8 19.4A11.5 11.5 0 0 1 20 10.5Z"
        fill="url(#gib-glass-shine)"
      />
      <path
        d="M20 8h24a14 14 0 0 1 14 14v10a14 14 0 0 1-14 14H31L17 58l2-12h-1A14 14 0 0 1 6 32V22A14 14 0 0 1 20 8Z"
        fill="none"
        stroke="url(#gib-glass-rim)"
        strokeWidth="1.6"
      />
      <circle cx="22" cy="27.5" r="3.7" fill="#FFFFFF" />
      <circle cx="32" cy="27.5" r="3.7" fill="#FFFFFF" />
      <circle cx="42" cy="27.5" r="3.7" fill="#FFFFFF" />
      <circle cx="49" cy="14.5" r="1.6" fill="#FFFFFF" fillOpacity="0.9" />
    </svg>
  );
}


function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat("bn-BD", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function OfficeChatWidget() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [showLabel, setShowLabel] = useState(true);
  const [siteLang, setSiteLang] = useState<"bn" | "en">("bn");
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  // null until the first answer from the server, so the icon never flashes
  // a badge that is about to change.
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [welcomeText, setWelcomeText] = useState("");
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  // Guests give a name + phone before their first message.
  const [needsIdentity, setNeedsIdentity] = useState(false);
  const [identity, setIdentity] = useState({ name: "", phone: "", email: "" });
  const [identityBusy, setIdentityBusy] = useState(false);
  const [identityError, setIdentityError] = useState("");
  const [waSettings, setWaSettings] = useState({ number: "", message: "" });
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedHidden = window.localStorage.getItem(HIDDEN_KEY);

    setHidden(savedHidden === "1");
    setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    function handleResize() {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Scrolling up (or reaching the top) lets "হেল্প" slide out of the
    // icon for a couple of seconds; scrolling down tucks it in right away.
    let lastY = window.scrollY;
    let hideTimer: number | undefined;

    function revealLabel() {
      setShowLabel(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(
        () => setShowLabel(false),
        HELP_LABEL_VISIBLE_MS,
      );
    }

    function tuckLabel() {
      window.clearTimeout(hideTimer);
      setShowLabel(false);
    }

    function handleScroll() {
      const y = window.scrollY;

      if (y <= HELP_LABEL_SCROLL_THRESHOLD) {
        revealLabel();
      } else if (y < lastY - HELP_LABEL_SCROLL_DELTA) {
        revealLabel();
      } else if (y > lastY + HELP_LABEL_SCROLL_DELTA) {
        tuckLabel();
      } else {
        return;
      }

      lastY = y;
    }

    // First visit: show it, then it sinks into the icon.
    revealLabel();

    function handleOutside(event: globalThis.PointerEvent) {
      if (
        widgetRef.current &&
        !widgetRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setMenuOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(hideTimer);
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // The site's pages keep language in their own state (not a shared
  // context), so follow it through the header's language switch button:
  // it reads "English" while the page is in Bangla and "বাংলা" in English.
  useEffect(() => {
    function detectLanguage() {
      const buttons = document.querySelectorAll("header button");

      for (const button of buttons) {
        const text = button.textContent?.trim();

        if (text === "English") {
          setSiteLang("bn");
          return;
        }

        if (text === "বাংলা") {
          setSiteLang("en");
          return;
        }
      }
    }

    detectLanguage();

    const observer = new MutationObserver(detectLanguage);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [recordedAudioUrl]);

  async function loadChat(read = false) {
    try {
      setError("");

      const res = await fetch(
        `/api/chat${read ? "?read=1" : ""}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const data = (await res.json().catch(() => ({}))) as ChatResponse;

      if (!res.ok) {
        throw new Error(data.error || "Chat load করা যায়নি।");
      }

      setMessages(data.messages || []);
      setUnread(data.unread || 0);
      setNeedsIdentity(Boolean(data.needsIdentity));
      setAuthenticated(Boolean(data.authenticated));
      setMessageCount(data.messageCount ?? (data.messages || []).length);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Chat load করা যায়নি।",
      );
    }
  }

  useEffect(() => {
    const poll = () => {
      if (pathname?.startsWith("/admin")) return;
      if (open) {
        loadChat(true);
      } else {
        fetch("/api/chat?summary=1", {
          credentials: "include",
          cache: "no-store",
        })
          .then((res) => res.json())
          .then((data: ChatResponse) => {
            setUnread(data.unread || 0);
            setAuthenticated(Boolean(data.authenticated));
            setMessageCount(data.messageCount || 0);
          })
          .catch(() => {
            // Keep the current badge state.
          });
      }
    };

    poll();
    const interval = window.setInterval(poll, 5000);

    return () => window.clearInterval(interval);
  }, [open, pathname]);

  useEffect(() => {
    if (!open) return;
    setChatLoading(true);
    loadChat(true).finally(() => setChatLoading(false));
  }, [open, pathname]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, open]);

  // WhatsApp number / message are managed from /admin -> Settings.
  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/site-settings", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const st = d?.settings;
        if (!st) return;
        setWaSettings({
          number: String(st.contactWhatsapp || ""),
          message: String(st.contactWhatsappMessage || ""),
        });
        setWelcomeText(String(st.chatWelcomeMessage || "").trim());
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!menuOpen) setShowRegisterPrompt(false);
  }, [menuOpen]);

  // A visitor with no account and no chat history has one waiting message
  // from the office (the welcome). It is shown as "1", and reading it needs
  // an account. Anyone who already has chat history, or an account, sees the
  // real unread count instead.
  const guestWelcome =
    authenticated === false && messageCount === 0 && welcomeText !== "";
  const badgeCount = unread > 0 ? unread : guestWelcome ? 1 : 0;

  const waUrl = buildWhatsappUrl(
    waSettings.number,
    waSettings.message ||
      (siteLang === "en"
        ? "Hello, I need help from GO International BD."
        : "হ্যালো, আমি GO International BD থেকে সাহায্য চাই।"),
  );

  function handleIconClick() {
    if (open) {
      setOpen(false);
      return;
    }
    // With a WhatsApp number set (or a waiting welcome message), the icon
    // first offers a choice; otherwise it opens the chat straight away.
    if (waUrl || guestWelcome) {
      setMenuOpen((value) => !value);
      return;
    }
    trackPixel("Contact", { content_name: "Office Chat" });
    setOpen(true);
  }

  function openChatFromMenu() {
    setMenuOpen(false);
    trackPixel("Contact", { content_name: "Office Chat" });
    setOpen(true);
  }

  function handleAttachmentClick(kind: "document" | "media") {
    setShowAttachmentMenu(false);

    if (!attachmentInputRef.current) return;

    attachmentInputRef.current.accept =
      kind === "document"
        ? ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip,application/x-rar-compressed"
        : "image/*,video/*";

    attachmentInputRef.current.click();
  }

  async function uploadViaProxy(file: File, kind: "document" | "media" | "audio") {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);

    const res = await fetch("/api/chat/upload", {
      method: "POST",
      credentials: "include",
      body: form,
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error || "File upload করা যায়নি।");
    }
  }

  async function uploadDirectToR2(
    file: File,
    kind: "document" | "media" | "audio",
    uploadUrl: string,
    key: string,
  ) {
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "content-type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!putRes.ok) {
      throw new Error("File upload করা যায়নি (storage)।");
    }

    const completeRes = await fetch("/api/chat/upload/complete", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        key,
        name: file.name,
        mime: file.type || "application/octet-stream",
        kind,
      }),
    });

    const data = (await completeRes.json().catch(() => ({}))) as { error?: string };
    if (!completeRes.ok) {
      throw new Error(data.error || "File upload করা যায়নি।");
    }
  }

  async function uploadAttachment(file: File, kind: "document" | "media" | "audio") {
    if (uploading) return;

    setUploading(true);
    setSelectedFileName(file.name);
    setError("");

    try {
      const presignRes = await fetch("/api/chat/upload/presign", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
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

      if (!presignRes.ok) {
        throw new Error(presignData.error || "File upload করা যায়নি।");
      }

      if (presignData.mode === "direct" && presignData.uploadUrl && presignData.key) {
        await uploadDirectToR2(file, kind, presignData.uploadUrl, presignData.key);
      } else {
        // No direct-to-R2 credentials configured for this environment
        // (e.g. local dev) — fall back to the server-proxied route.
        await uploadViaProxy(file, kind);
      }

      setSelectedFileName("");
      await loadChat(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "File upload করা যায়নি।",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const accept = attachmentInputRef.current?.accept || "";
    const kind = accept.includes("image/*") || accept.includes("video/*")
      ? "media"
      : "document";

    await uploadAttachment(file, kind);
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state !== "inactive") {
      recorder.stop();
    }

    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
  }

  async function toggleRecording() {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("এই browser-এ voice recording support নেই।");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setRecordingSeconds(0);
      setError("");

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);

        setRecordedAudioUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return url;
        });

        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;

        const extension = (recorder.mimeType || "audio/webm").includes("mp4")
          ? "m4a"
          : (recorder.mimeType || "audio/webm").includes("ogg")
            ? "ogg"
            : "webm";

        await uploadAttachment(
          new File([blob], `voice-${Date.now()}.${extension}`, {
            type: recorder.mimeType || "audio/webm",
          }),
          "audio",
        );

        setRecordedAudioUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return "";
        });
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((value) => value + 1);
      }, 1000);
    } catch {
      setError("Microphone permission দেওয়া হয়নি বা microphone ব্যবহার করা যায়নি।");
    }
  }

  function clearRecordedAudio() {
    setRecordedAudioUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  }

  async function submitIdentity(event: React.FormEvent) {
    event.preventDefault();
    if (identityBusy) return;

    setIdentityBusy(true);
    setIdentityError("");

    try {
      const res = await fetch("/api/chat/identify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(identity),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(
          data.error ||
            (siteLang === "en"
              ? "Could not save your details."
              : "তথ্য সংরক্ষণ করা যায়নি।"),
        );
      }

      setNeedsIdentity(false);
      await loadChat(true);
    } catch (err) {
      setIdentityError(
        err instanceof Error
          ? err.message
          : siteLang === "en"
            ? "Could not save your details."
            : "তথ্য সংরক্ষণ করা যায়নি।",
      );
    } finally {
      setIdentityBusy(false);
    }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();

    const trimmed = message.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        if (data.code === "identity_required") setNeedsIdentity(true);
        throw new Error(data.error || "Message পাঠানো যায়নি।");
      }

      setMessage("");
      await loadChat(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Message পাঠানো যায়নি।",
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteChat() {
    if (!window.confirm("আপনি কি এই conversation delete করতে চান?")) {
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "DELETE",
        credentials: "include",
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "Chat delete করা যায়নি।");
      }

      setMessages([]);
      setUnread(0);
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Chat delete করা যায়নি।",
      );
    }
  }

  function hideWidget() {
    setOpen(false);
    setMenuOpen(false);
    setHidden(true);
    window.localStorage.setItem(HIDDEN_KEY, "1");
  }

  function restoreWidget() {
    setHidden(false);
    window.localStorage.setItem(HIDDEN_KEY, "0");
  }

  function attachmentUrl(messageId: string) {
    return `/api/chat/file?messageId=${encodeURIComponent(messageId)}`;
  }

  function downloadUrl(messageId: string) {
    return `${attachmentUrl(messageId)}&download=1`;
  }

  function formatBytes(size?: number | null) {
    if (!size || size < 1) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  // The site's pages use a 192px side margin from md (768px) up, so on
  // desktop the chat head's right edge lines up with the content edge.
  const isDesktop = viewport.width >= 768;
  const sideOffset = isDesktop ? 192 : 16;
  const bottomOffset = isDesktop ? 24 : 16;

  // The admin panel has its own Chat Center; the visitor chat icon (and its
  // "1" badge / register prompt) makes no sense there.
  if (pathname?.startsWith("/admin")) return null;

  if (hidden) {
    return (
      <button
        type="button"
        aria-label="Show Chat with Office"
        onClick={restoreWidget}
        className="fixed z-[9999] flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white shadow-lg transition hover:scale-105 hover:shadow-xl"
        style={{ right: sideOffset, bottom: bottomOffset }}
      >
        <img src="/logo.svg" alt="" className="h-7 w-7 object-contain" />
      </button>
    );
  }

  const isMobile = viewport.width > 0 && viewport.width < 640;

  const chatClass = isMobile
    ? "fixed left-3 right-3 z-[10000] flex h-[min(560px,calc(100vh-24px))] flex-col"
    : "absolute z-[10000] flex h-[560px] w-[360px] max-w-[calc(100vw-24px)] flex-col";

  const chatStyle = isMobile
    ? {
        top: 12,
        bottom: 12,
      }
    : { right: 0, bottom: "100%", marginBottom: 8 };

  return (
    <div
      ref={widgetRef}
      className="fixed z-[9999] flex flex-col items-end"
      style={{ right: sideOffset, bottom: bottomOffset }}
    >
      {menuOpen && !open && !showRegisterPrompt && (waUrl || guestWelcome) && (
        <div className="absolute bottom-full right-0 mb-2 flex gap-1.5 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
          <button
            type="button"
            onClick={() => {
              if (guestWelcome) setShowRegisterPrompt(true);
              else openChatFromMenu();
            }}
            className="flex w-[96px] flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 hover:bg-blue-50"
          >
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white">
              <img src="/logo.svg" alt="" className="h-9 w-9 object-contain" />
              {badgeCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </span>
            <span className="text-center text-[11px] font-bold leading-tight text-[#0B2A55]">
              Chat with Admin
            </span>
          </button>

          {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              setMenuOpen(false);
              trackPixel("Contact", { content_name: "WhatsApp" });
            }}
            className="flex w-[96px] flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 hover:bg-green-50"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </span>
            <span className="text-center text-[11px] font-bold leading-tight text-[#0B2A55]">
              WhatsApp
            </span>
          </a>
          )}
        </div>
      )}

      {/* A visitor tapped "Admin": the waiting message needs an account. */}
      {menuOpen && !open && showRegisterPrompt && (
        <div className="absolute bottom-full right-0 mb-2 w-[290px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="absolute right-3 top-2 text-lg leading-none text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ×
          </button>

          <div className="flex items-start gap-3">
            <span className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
              <img src="/logo.svg" alt="" className="h-7 w-7 object-contain" />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                1
              </span>
            </span>
            <div className="pr-4">
              <p className="text-sm font-bold text-[#0B2A55]">
                {siteLang === "en" ? "1 message from Admin" : "Admin-এর ১টি বার্তা আছে"}
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                {siteLang === "en"
                  ? "Create a free account to read it and chat with the office."
                  : "বার্তাটি দেখতে এবং অফিসের সাথে চ্যাট করতে বিনামূল্যে রেজিস্ট্রেশন করুন।"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <a
              href="/register"
              className="flex-1 rounded-full bg-[#0B4DBB] px-4 py-2 text-center text-xs font-bold text-white hover:bg-[#093f98]"
            >
              {siteLang === "en" ? "Register" : "রেজিস্টার করুন"}
            </a>
            <a
              href="/account/login"
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-center text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Login
            </a>
          </div>

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setMenuOpen(false);
                trackPixel("Contact", { content_name: "WhatsApp" });
              }}
              className="mt-3 block text-center text-[11px] font-semibold text-[#128C4A] hover:underline"
            >
              {siteLang === "en"
                ? "Or message us on WhatsApp — free, no account needed"
                : "অথবা WhatsApp-এ ফ্রি মেসেজ করুন, রেজিস্ট্রেশন লাগবে না"}
            </a>
          )}
        </div>
      )}

      {open && (
        <div
          className={`${chatClass} overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl`}
          style={chatStyle}
        >
          <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
              <img src="/logo.svg" alt="GO International BD" className="h-8 w-8 object-contain" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-[#0B2A55]">
                GO International BD
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span>💬 Chat with Office</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Active
                </span>
              </p>
            </div>

            <div className="relative flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7C3AED] transition hover:bg-purple-50 hover:text-[#6D28D9]"
                aria-label="Close chat"
                title="Close"
              >
                <ArrowUpIcon className="h-[19px] w-[19px]" />
              </button>

              <button
                type="button"
                onClick={() => setShowHeaderMenu((value) => !value)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7C3AED] transition hover:bg-purple-50 hover:text-[#6D28D9]"
                aria-label="Chat menu"
                title="Chat menu"
              >
                <MoreVerticalIcon className="h-[19px] w-[19px]" />
              </button>

              {showHeaderMenu && (
                <div className="absolute right-0 top-10 z-50 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      deleteChat();
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6D28D9]"
                  >
                    <TrashIcon className="h-[17px] w-[17px]" />
                    <span>Delete Chat</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {needsIdentity && (
            <form
              onSubmit={submitIdentity}
              className="flex-1 space-y-3 overflow-y-auto bg-[#f7f9fc] px-5 py-5"
            >
              <div className="text-center">
                <img src="/logo.svg" alt="" className="mx-auto h-12 w-12 object-contain" />
                <p className="mt-2 text-sm font-extrabold text-[#0B2A55]">
                  {siteLang === "en"
                    ? "Tell us who you are"
                    : "চ্যাট শুরুর আগে আপনার পরিচয় দিন"}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-700">
                  {siteLang === "en"
                    ? "So our team can reply to you and call back if needed."
                    : "যাতে আমাদের টিম আপনাকে উত্তর দিতে এবং প্রয়োজনে ফোন করতে পারে।"}
                </p>
              </div>

              <input
                required
                value={identity.name}
                onChange={(e) => setIdentity((v) => ({ ...v, name: e.target.value }))}
                maxLength={80}
                autoComplete="name"
                placeholder={siteLang === "en" ? "Your name *" : "আপনার নাম *"}
                className="w-full rounded-xl border border-gray-400 bg-white px-4 py-3 text-sm font-medium text-[#111827] opacity-100 outline-none placeholder:text-gray-600 placeholder:opacity-100 focus:border-[#7C3AED]"
              />
              <input
                required
                type="tel"
                value={identity.phone}
                onChange={(e) => setIdentity((v) => ({ ...v, phone: e.target.value }))}
                maxLength={25}
                autoComplete="tel"
                placeholder={siteLang === "en" ? "Mobile number *" : "মোবাইল নম্বর *"}
                className="w-full rounded-xl border border-gray-400 bg-white px-4 py-3 text-sm font-medium text-[#111827] opacity-100 outline-none placeholder:text-gray-600 placeholder:opacity-100 focus:border-[#7C3AED]"
              />
              <input
                type="email"
                value={identity.email}
                onChange={(e) => setIdentity((v) => ({ ...v, email: e.target.value }))}
                maxLength={160}
                autoComplete="email"
                placeholder={siteLang === "en" ? "Email (optional)" : "ইমেইল (ঐচ্ছিক)"}
                className="w-full rounded-xl border border-gray-400 bg-white px-4 py-3 text-sm font-medium text-[#111827] opacity-100 outline-none placeholder:text-gray-600 placeholder:opacity-100 focus:border-[#7C3AED]"
              />

              {identityError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                  {identityError}
                </p>
              )}

              <button
                type="submit"
                disabled={identityBusy}
                className="w-full rounded-xl bg-[#0B4DBB] px-4 py-3 text-sm font-bold text-white hover:bg-[#093f98] disabled:opacity-60"
              >
                {identityBusy
                  ? "..."
                  : siteLang === "en"
                    ? "Start chat"
                    : "চ্যাট শুরু করুন"}
              </button>
            </form>
          )}

          <div
            ref={messagesRef}
            className={`flex-1 space-y-3 overflow-y-auto bg-[#f7f9fc] px-3 py-4 ${
              needsIdentity ? "hidden" : ""
            }`}
          >
            {chatLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Chat loading...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center px-5 text-center">
                <div>
                  <img src="/logo.svg" alt="" className="mx-auto h-12 w-12 object-contain" />
                  <p className="mt-3 text-sm font-bold text-[#0B2A55]">
                    Welcome to GO International BD
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    ভিসা, চাকরি, মেডিকেল অথবা অন্য কোনো বিষয়ে জানতে Message করুন।
                  </p>
                </div>
              </div>
            ) : (
              messages.map((item, index) => {
                const isUser = item.sender_type === "user";
                const isAi = item.sender_type === "ai";
                const isLastUserMessage =
                  isUser &&
                  !messages.slice(index + 1).some((m) => m.sender_type === "user");
                const showSeen = isLastUserMessage && item.is_read === 1;

                return (
                  <div
                    key={item.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
                        isUser
                          ? "rounded-br-md bg-[#0B4DBB] text-white"
                          : "rounded-bl-md border border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      {!isUser && (
                        <p className="mb-1 text-[10px] font-bold text-[#0B4DBB]">
                          {isAi ? "🤖 GO Assistant" : "👨‍💼 Office Team"}
                        </p>
                      )}

                      {item.attachment_kind ? (
                        <div className="space-y-2">
                          {item.attachment_kind === "media" &&
                            item.attachment_mime?.startsWith("image/") && (
                              <img
                                src={attachmentUrl(item.id)}
                                alt={item.attachment_name || "Image"}
                                className="max-h-56 w-full max-w-[240px] rounded-xl object-cover"
                              />
                            )}

                          {item.attachment_kind === "media" &&
                            item.attachment_mime?.startsWith("video/") && (
                              <video
                                controls
                                preload="metadata"
                                src={attachmentUrl(item.id)}
                                className="max-h-56 w-full max-w-[240px] rounded-xl"
                              />
                            )}

                          {item.attachment_kind === "audio" && (
                            <audio
                              controls
                              preload="metadata"
                              src={attachmentUrl(item.id)}
                              className="h-9 max-w-[245px]"
                            />
                          )}

                          {item.attachment_kind === "document" && (
                            <a
                              href={attachmentUrl(item.id)}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                                isUser ? "bg-white/10" : "bg-purple-50"
                              }`}
                            >
                              <FileTextIcon
                                className={`h-5 w-5 shrink-0 ${
                                  isUser ? "text-white" : "text-[#7C3AED]"
                                }`}
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold">
                                  {item.attachment_name || item.message}
                                </span>
                                {item.attachment_size ? (
                                  <span className={`block text-[9px] ${isUser ? "text-blue-100" : "text-gray-400"}`}>
                                    {formatBytes(item.attachment_size)}
                                  </span>
                                ) : null}
                              </span>
                            </a>
                          )}

                          {item.attachment_kind !== "document" && item.attachment_name && (
                            <p className="max-w-[240px] truncate text-[10px] font-medium">
                              {item.attachment_name}
                            </p>
                          )}

                          <a
                            href={downloadUrl(item.id)}
                            download={item.attachment_name || true}
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold underline ${
                              isUser ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            ⬇ Download
                          </a>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm leading-5">
                          {item.message}
                        </p>
                      )}

                      <p
                        className={`mt-1 text-[9px] ${
                          isUser ? "text-blue-100" : "text-gray-400"
                        }`}
                      >
                        {formatTime(item.created_at)}
                      </p>
                      {showSeen && (
                        <p className="mt-0.5 text-right text-[9px] text-blue-100">
                          Seen
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          {uploading && selectedFileName && (
            <div className="border-t border-gray-100 bg-white px-3 pt-2">
              <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-xs text-[#6D28D9]">
                <PaperclipIcon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{selectedFileName}</span>
                <span className="shrink-0 font-semibold">Uploading...</span>
              </div>
            </div>
          )}

          <form
            onSubmit={sendMessage}
            className={`flex items-end gap-2 border-t border-gray-200 bg-white p-3 ${
              needsIdentity ? "hidden" : ""
            }`}
          >
            <input
              ref={attachmentInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelected}
            />

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu((value) => !value)}
                disabled={uploading || isRecording}
                className="flex h-[42px] w-[42px] items-center justify-center rounded-xl text-[#7C3AED] transition hover:bg-purple-50 hover:text-[#6D28D9]"
                aria-label="Attachments"
                title="Attachments"
              >
                <PaperclipIcon className="h-[21px] w-[21px]" />
              </button>

              {showAttachmentMenu && (
                <div className="absolute bottom-12 left-0 z-50 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl">
                  <button
                    type="button"
                    onClick={() => handleAttachmentClick("document")}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-purple-50"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED]">
                      <FileTextIcon className="h-[18px] w-[18px]" />
                    </span>
                    <span>Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAttachmentClick("media")}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-purple-50"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED]">
                      <ImageIcon className="h-[18px] w-[18px]" />
                    </span>
                    <span>Photos &amp; videos</span>
                  </button>
                </div>
              )}
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder={isRecording ? "Recording voice..." : "আপনার message লিখুন..."}
              disabled={isRecording || uploading}
              className="max-h-24 min-h-[42px] flex-1 resize-none rounded-xl border border-gray-400 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-600 placeholder:opacity-100 focus:border-[#0B4DBB] focus:ring-2 focus:ring-blue-100 disabled:bg-red-50 disabled:text-red-500"
            />

            <button
              type="button"
              onClick={toggleRecording}
              disabled={uploading}
              className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl transition ${
                isRecording
                  ? "bg-purple-100 text-[#7C3AED] hover:bg-purple-200"
                  : "text-[#7C3AED] hover:bg-purple-50 hover:text-[#6D28D9]"
              }`}
              aria-label={isRecording ? "Stop recording" : "Voice recording"}
              title={isRecording ? `Stop recording (${recordingSeconds}s)` : "Voice recording"}
            >
              {isRecording ? (
                <StopIcon className="h-[19px] w-[19px]" />
              ) : (
                <MicIcon className="h-[21px] w-[21px]" />
              )}
            </button>

            <button
              type="submit"
              disabled={loading || uploading || !message.trim() || isRecording}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#0B4DBB] text-white transition hover:bg-[#093f98] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              {loading ? (
                <span className="text-lg leading-none">…</span>
              ) : (
                <SendIcon className="h-[19px] w-[19px]" />
              )}
            </button>
          </form>

          <div className="border-t border-gray-100 bg-white px-3 py-1.5 text-center text-[9px] text-gray-400">
            AI Assistant + Office Team
          </div>
        </div>
      )}

      <div className="flex items-center">
        <button
          type="button"
          aria-label="Chat with Office"
          aria-expanded={open || menuOpen}
          onClick={handleIconClick}
          className="relative z-10 flex h-[62px] w-[62px] shrink-0 select-none items-center justify-center transition hover:scale-110 active:scale-95"
        >
          <ChatGlassIcon />

          {badgeCount > 0 && (
            <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </button>

        {/* Tucked behind the icon, so it slides out of / sinks into it. */}
        <button
          type="button"
          tabIndex={showLabel && !open && !menuOpen ? 0 : -1}
          aria-hidden={!(showLabel && !open && !menuOpen)}
          onClick={handleIconClick}
          className={`-ml-7 select-none overflow-hidden whitespace-nowrap rounded-full bg-white/90 py-2.5 text-base font-extrabold text-[#1045D6] shadow-[0_6px_16px_rgba(16,69,214,0.28)] ring-1 ring-sky-100 backdrop-blur transition-all duration-500 ease-in-out ${
            showLabel && !open && !menuOpen
              ? "max-w-[110px] pl-9 pr-5 opacity-100"
              : "pointer-events-none max-w-0 -translate-x-4 px-0 opacity-0"
          }`}
        >
          {siteLang === "en" ? "Help" : "হেল্প"}
        </button>
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={hideWidget}
          className="hidden rounded-full bg-white/90 px-2 py-0.5 text-[9px] text-gray-400 shadow-sm hover:text-gray-700 md:block"
        >
          Hide
        </button>
      </div>
    </div>
  );
}
