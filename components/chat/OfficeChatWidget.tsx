"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { usePathname } from "next/navigation";

const POSITION_KEY = "gib-office-chat-position-v1";
const HIDDEN_KEY = "gib-office-chat-hidden-v1";

const SIZE = 54;
const EDGE = 12;
const CHAT_WIDTH = 360;
const CHAT_HEIGHT = 560;

type Position = { x: number; y: number };

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
  messages?: Message[];
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

function getDefaultPosition(): Position {
  if (typeof window === "undefined") return { x: EDGE, y: EDGE };

  const isMobile = window.innerWidth < 768;

  return {
    x: Math.max(
      EDGE,
      window.innerWidth - (isMobile ? 16 : 192) - SIZE,
    ),
    y: 88,
  };
}

function clampPosition(position: Position): Position {
  if (typeof window === "undefined") return position;

  return {
    x: Math.min(
      Math.max(EDGE, position.x),
      Math.max(EDGE, window.innerWidth - SIZE - EDGE),
    ),
    y: Math.min(
      Math.max(EDGE, position.y),
      Math.max(EDGE, window.innerHeight - SIZE - EDGE),
    ),
  };
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
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
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
  const dragRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedPosition = window.localStorage.getItem(POSITION_KEY);
    const savedHidden = window.localStorage.getItem(HIDDEN_KEY);

    if (savedPosition) {
      try {
        setPosition(
          clampPosition(JSON.parse(savedPosition) as Position),
        );
      } catch {
        setPosition(getDefaultPosition());
      }
    } else {
      setPosition(getDefaultPosition());
    }

    setHidden(savedHidden === "1");
    setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const timer = window.setTimeout(() => {
      if (!window.localStorage.getItem(HIDDEN_KEY)) {
        setShowWelcome(true);
      }
    }, 5000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleResize() {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setPosition((current) => {
        const next = clampPosition(current);
        window.localStorage.setItem(POSITION_KEY, JSON.stringify(next));
        return next;
      });
    }

    function handleOutside(event: globalThis.PointerEvent) {
      if (
        widgetRef.current &&
        !widgetRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("resize", handleResize);
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Chat load করা যায়নি।",
      );
    }
  }

  useEffect(() => {
    const poll = () => {
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
    setShowWelcome(false);
    setChatLoading(true);
    loadChat(true).finally(() => setChatLoading(false));
  }, [open, pathname]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, open]);

  function savePosition(next: Position) {
    const safe = clampPosition(next);
    setPosition(safe);
    window.localStorage.setItem(POSITION_KEY, JSON.stringify(safe));
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;

    const rect = event.currentTarget.getBoundingClientRect();

    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const distance = Math.hypot(
      event.clientX - drag.startX,
      event.clientY - drag.startY,
    );

    if (distance > 5) suppressClickRef.current = true;

    setPosition(
      clampPosition({
        x: event.clientX - drag.offsetX,
        y: event.clientY - drag.offsetY,
      }),
    );
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    savePosition({
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY,
    });

    dragRef.current = null;
  }

  function handleIconClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    setShowWelcome(false);
    setOpen((value) => !value);
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

  async function uploadAttachment(file: File, kind: "document" | "media" | "audio") {
    if (uploading) return;

    setUploading(true);
    setSelectedFileName(file.name);
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);

      const res = await fetch("/api/chat/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "File upload করা যায়নি।");
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
      };

      if (!res.ok) {
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
    setShowWelcome(false);
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

  function formatBytes(size?: number | null) {
    if (!size || size < 1) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (hidden) {
    return (
      <button
        type="button"
        aria-label="Show Chat with Office"
        onClick={restoreWidget}
        className="fixed z-[9999] flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white shadow-lg transition hover:scale-105 hover:shadow-xl"
        style={{ left: position.x, top: position.y }}
      >
        <img src="/logo.svg" alt="" className="h-7 w-7 object-contain" />
      </button>
    );
  }

  const isMobile = viewport.width > 0 && viewport.width < 640;
  const chatAbove = position.y > (viewport.height || 800) - CHAT_HEIGHT;
  const chatOnLeft = position.x < CHAT_WIDTH;

  const chatClass = isMobile
    ? "fixed left-3 right-3 z-[10000] flex h-[min(560px,calc(100vh-24px))] flex-col"
    : "absolute z-[10000] flex h-[560px] w-[360px] max-w-[calc(100vw-24px)] flex-col";

  const chatStyle = isMobile
    ? {
        top: 12,
        bottom: 12,
      }
    : chatOnLeft
      ? chatAbove
        ? { left: 0, bottom: 64 }
        : { left: 0, top: 64 }
      : chatAbove
        ? { right: 0, bottom: 64 }
        : { right: 0, top: 64 };

  return (
    <div
      ref={widgetRef}
      className="fixed z-[9999]"
      style={{ left: position.x, top: position.y }}
    >
      {showWelcome && !open && (
        <div className="absolute right-0 top-[62px] w-[280px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
          <button
            type="button"
            onClick={() => setShowWelcome(false)}
            className="absolute right-2 top-2 text-[#7C3AED] hover:text-[#6D28D9]"
            aria-label="Close"
          >
            ×
          </button>

          <div className="flex items-start gap-3">
            <img src="/logo.svg" alt="" className="mt-0.5 h-9 w-9 shrink-0 object-contain" />
            <div className="pr-3">
              <p className="text-sm font-bold text-[#0B2A55]">
                GO International BD
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                👋 হ্যালো! কী খুঁজছেন? ভিসা, চাকরি, মেডিকেল বা অন্য কোনো বিষয়ে সাহায্য লাগলে আমাদের সাথে Chat করুন।
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowWelcome(false);
                  setOpen(true);
                }}
                className="mt-3 rounded-full bg-[#0B4DBB] px-4 py-2 text-xs font-bold text-white hover:bg-[#093f98]"
              >
                💬 Chat with Office
              </button>
            </div>
          </div>
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

          <div
            ref={messagesRef}
            className="flex-1 space-y-3 overflow-y-auto bg-[#f7f9fc] px-3 py-4"
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
            className="flex items-end gap-2 border-t border-gray-200 bg-white p-3"
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
              className="max-h-24 min-h-[42px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#0B4DBB] focus:ring-2 focus:ring-blue-100 disabled:bg-red-50 disabled:text-red-500"
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

      <button
        type="button"
        aria-label="Chat with Office"
        aria-expanded={open}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleIconClick}
        className="relative flex h-[54px] w-[54px] touch-none select-none items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-lg ring-1 ring-gray-200 transition hover:scale-105 hover:shadow-xl"
      >
        <img
          src="/logo.svg"
          alt="Chat with Office"
          draggable={false}
          className="h-[48px] w-[48px] object-contain"
        />

        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}

        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
      </button>

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
