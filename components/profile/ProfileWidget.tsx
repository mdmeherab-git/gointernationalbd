"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const POSITION_KEY = "gib-profile-widget-position-v1";
const HIDDEN_KEY = "gib-profile-widget-hidden-v1";

const SIZE = 52;
const EDGE = 12;
const MENU_WIDTH = 300;
const MENU_HEIGHT = 500;

type User = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  profilePhotoKey: string;
};

type Position = {
  x: number;
  y: number;
};

function getDefaultPosition(): Position {
  if (typeof window === "undefined") {
    return {
      x: EDGE,
      y: EDGE,
    };
  }

  const isMobile = window.innerWidth < 768;

  return {
    x: Math.max(
      EDGE,
      window.innerWidth -
        (isMobile ? 16 : 192) -
        SIZE,
    ),
    y: 12,
  };
}

function clampPosition(
  position: Position,
): Position {
  if (typeof window === "undefined") {
    return position;
  }

  return {
    x: Math.min(
      Math.max(EDGE, position.x),
      Math.max(
        EDGE,
        window.innerWidth -
          SIZE -
          EDGE,
      ),
    ),

    y: Math.min(
      Math.max(EDGE, position.y),
      Math.max(
        EDGE,
        window.innerHeight -
          SIZE -
          EDGE,
      ),
    ),
  };
}

export default function ProfileWidget() {
  const pathname = usePathname();

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [open, setOpen] =
    useState(false);

  const [hidden, setHidden] =
    useState(false);

  const [position, setPosition] =
    useState<Position>({
      x: 0,
      y: 0,
    });

  const [photoVersion, setPhotoVersion] =
    useState(0);

  const [viewportHeight, setViewportHeight] =
    useState(0);

  const widgetRef =
    useRef<HTMLDivElement>(null);

  const lastPhotoKeyRef =
    useRef("");

  const dragRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const suppressClickRef =
    useRef(false);

  /* =====================================================
     INITIAL POSITION
  ===================================================== */

  useEffect(() => {
    const savedPosition =
      window.localStorage.getItem(
        POSITION_KEY,
      );

    const savedHidden =
      window.localStorage.getItem(
        HIDDEN_KEY,
      );

    if (savedPosition) {
      try {
        setPosition(
          clampPosition(
            JSON.parse(
              savedPosition,
            ) as Position,
          ),
        );
      } catch {
        setPosition(
          getDefaultPosition(),
        );
      }
    } else {
      setPosition(
        getDefaultPosition(),
      );
    }

    setHidden(
      savedHidden === "1",
    );

    setViewportHeight(
      window.innerHeight,
    );
  }, []);

  /* =====================================================
     LOAD CURRENT USER
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const res = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const data =
          (await res
            .json()
            .catch(() => ({}))) as {
            authenticated?: boolean;
            user?: User | null;
          };

        if (cancelled) {
          return;
        }

        const nextUser =
          data.authenticated &&
          data.user
            ? data.user
            : null;

        const nextPhotoKey =
          nextUser?.profilePhotoKey ||
          "";

        if (
          lastPhotoKeyRef.current !==
          nextPhotoKey
        ) {
          lastPhotoKeyRef.current =
            nextPhotoKey;

          setPhotoVersion(
            (value) => value + 1,
          );
        }

        setCurrentUser(
          nextUser,
        );
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  /* =====================================================
     REFRESH USER WHEN BROWSER BECOMES ACTIVE
  ===================================================== */

  useEffect(() => {
    async function refreshUser() {
      try {
        const res = await fetch(
          "/api/auth/me",
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        const data =
          (await res
            .json()
            .catch(() => ({}))) as {
            authenticated?: boolean;
            user?: User | null;
          };

        const nextUser =
          data.authenticated &&
          data.user
            ? data.user
            : null;

        const nextPhotoKey =
          nextUser?.profilePhotoKey ||
          "";

        if (
          lastPhotoKeyRef.current !==
          nextPhotoKey
        ) {
          lastPhotoKeyRef.current =
            nextPhotoKey;

          setPhotoVersion(
            (value) => value + 1,
          );
        }

        setCurrentUser(
          nextUser,
        );
      } catch {
        // Keep current state.
      }
    }

    function handleVisibility() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        refreshUser();
      }
    }

    window.addEventListener(
      "focus",
      refreshUser,
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility,
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshUser,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility,
      );
    };
  }, []);

  /* =====================================================
     KEEP INSIDE SCREEN
  ===================================================== */

  useEffect(() => {
    function handleResize() {
      setViewportHeight(
        window.innerHeight,
      );

      setPosition(
        (current) => {
          const next =
            clampPosition(current);

          window.localStorage.setItem(
            POSITION_KEY,
            JSON.stringify(next),
          );

          return next;
        },
      );
    }

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, []);

  /* =====================================================
     CLOSE MENU
  ===================================================== */

  useEffect(() => {
    function handleOutsideClick(
      event: globalThis.PointerEvent,
    ) {
      if (!widgetRef.current) {
        return;
      }

      if (
        !widgetRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handleOutsideClick,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  /* =====================================================
     SAVE POSITION
  ===================================================== */

  function savePosition(
    next: Position,
  ) {
    const safe =
      clampPosition(next);

    setPosition(safe);

    window.localStorage.setItem(
      POSITION_KEY,
      JSON.stringify(safe),
    );
  }

  /* =====================================================
     DRAG START
  ===================================================== */

  function handlePointerDown(
    event: PointerEvent<HTMLButtonElement>,
  ) {
    if (event.button !== 0) {
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    dragRef.current = {
      pointerId:
        event.pointerId,

      offsetX:
        event.clientX -
        rect.left,

      offsetY:
        event.clientY -
        rect.top,

      startX:
        event.clientX,

      startY:
        event.clientY,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );
  }

  /* =====================================================
     DRAG MOVE
  ===================================================== */

  function handlePointerMove(
    event: PointerEvent<HTMLButtonElement>,
  ) {
    const drag =
      dragRef.current;

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    const distance =
      Math.hypot(
        event.clientX -
          drag.startX,

        event.clientY -
          drag.startY,
      );

    if (distance > 5) {
      suppressClickRef.current =
        true;
    }

    setPosition(
      clampPosition({
        x:
          event.clientX -
          drag.offsetX,

        y:
          event.clientY -
          drag.offsetY,
      }),
    );
  }

  /* =====================================================
     DRAG END
  ===================================================== */

  function handlePointerUp(
    event: PointerEvent<HTMLButtonElement>,
  ) {
    const drag =
      dragRef.current;

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    savePosition({
      x:
        event.clientX -
        drag.offsetX,

      y:
        event.clientY -
        drag.offsetY,
    });

    dragRef.current = null;
  }

  /* =====================================================
     ICON CLICK
  ===================================================== */

  function handleIconClick() {
    if (
      suppressClickRef.current
    ) {
      suppressClickRef.current =
        false;

      return;
    }

    setOpen(
      (value) => !value,
    );
  }

  /* =====================================================
     HIDE
  ===================================================== */

  function hideWidget() {
    setOpen(false);
    setHidden(true);

    window.localStorage.setItem(
      HIDDEN_KEY,
      "1",
    );
  }

  /* =====================================================
     RESTORE
  ===================================================== */

  function restoreWidget() {
    setHidden(false);

    window.localStorage.setItem(
      HIDDEN_KEY,
      "0",
    );
  }

  /* =====================================================
     LOGOUT
  ===================================================== */

  async function logout() {
    try {
      const res = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!res.ok) {
        throw new Error(
          "Logout failed",
        );
      }

      setCurrentUser(null);
      setOpen(false);

      window.location.href = "/";
    } catch (error) {
      console.error(
        "Logout error:",
        error,
      );

      alert(
        "Logout করা যায়নি। আবার চেষ্টা করুন।",
      );
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (authLoading) {
    return null;
  }

  /* =====================================================
     HIDDEN STATE
  ===================================================== */

  if (hidden) {
    return (
      <button
        type="button"
        aria-label="Show profile"
        onClick={restoreWidget}
        className="fixed z-[9999] flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-base text-gray-600 shadow-lg transition hover:scale-105 hover:shadow-xl"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        👤
      </button>
    );
  }

  /* =====================================================
     DROPDOWN POSITION
  ===================================================== */

  const safeViewportHeight =
    viewportHeight || 800;

  const menuAbove =
    position.y >
    safeViewportHeight -
      MENU_HEIGHT;

  const menuOnLeft =
    position.x <
    MENU_WIDTH;

  const menuStyle =
    menuOnLeft
      ? menuAbove
        ? {
            left: 0,
            bottom: 60,
          }
        : {
            left: 0,
            top: 60,
          }
      : menuAbove
        ? {
            right: 0,
            bottom: 60,
          }
        : {
            right: 0,
            top: 60,
          };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div
      ref={widgetRef}
      className="fixed z-[9999]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* PROFILE DROPDOWN */}

      {open && (
        <div
          className="absolute z-[10000] w-[300px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          style={menuStyle}
        >
          {/* USER HEADER */}

          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xl text-gray-500">
              {currentUser?.profilePhotoKey ? (
                <img
                  key={photoVersion}
                  src="/api/auth/profile-photo"
                  alt={
                    currentUser.name
                  }
                  draggable={false}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                "👤"
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">
                {currentUser?.name ||
                  "Guest User"}
              </p>

              <p className="truncate text-xs text-gray-500">
                {currentUser?.email ||
                  currentUser?.phone ||
                  "GO International BD"}
              </p>
            </div>
          </div>

          {/* LOGGED IN */}

          {currentUser ? (
            <div className="p-2">

              <ProfileLink
                href="/account/profile"
                icon="👤"
                label="My Profile / আমার প্রোফাইল"
                onClick={() =>
                  setOpen(false)
                }
              />

              <ProfileLink
                href="/account/cv"
                icon="📄"
                label="My CV / আমার CV"
                onClick={() =>
                  setOpen(false)
                }
              />

              <ProfileLink
                href="/account/applications"
                icon="💼"
                label="My Applications / আবেদন"
                onClick={() =>
                  setOpen(false)
                }
              />

              <ProfileLink
                href="/account/visa-status"
                icon="🌍"
                label="Visa Status / ভিসা স্ট্যাটাস"
                onClick={() =>
                  setOpen(false)
                }
              />

              <ProfileLink
                href="/account/documents"
                icon="📋"
                label="My Documents / ডকুমেন্টস"
                onClick={() =>
                  setOpen(false)
                }
              />

              {/* CHAT WITH OFFICE */}

              <ProfileLink
                href="/account/chat"
                icon="💬"
                label="Chat with Office / অফিসে চ্যাট"
                onClick={() =>
                  setOpen(false)
                }
              />

              <ProfileLink
                href="/account/notifications"
                icon="🔔"
                label="Notifications / নোটিফিকেশন"
                onClick={() =>
                  setOpen(false)
                }
              />

              <ProfileLink
                href="/account/settings"
                icon="⚙️"
                label="Account Settings / সেটিংস"
                onClick={() =>
                  setOpen(false)
                }
              />

            </div>
          ) : (
            /* GUEST */

            <div className="p-2">

              <ProfileLink
                href="/account/login"
                icon="🔐"
                label="Login / লগইন"
                onClick={() =>
                  setOpen(false)
                }
              />

              <ProfileLink
                href="/register"
                icon="📝"
                label="Create Account / অ্যাকাউন্ট তৈরি"
                onClick={() =>
                  setOpen(false)
                }
              />

            </div>
          )}

          {/* BOTTOM ACTIONS */}

          <div className="border-t border-gray-100 p-2">

            <button
              type="button"
              onClick={hideWidget}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              <span>−</span>

              <span>
                Hide Profile
              </span>
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={logout}
                className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <span>🚪</span>

                <span>
                  Logout / লগআউট
                </span>
              </button>
            )}

          </div>
        </div>
      )}

      {/* FLOATING PROFILE HEAD */}

      <button
        type="button"
        aria-label="Profile"
        aria-expanded={open}
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          handlePointerUp
        }
        onPointerCancel={
          handlePointerUp
        }
        onClick={
          handleIconClick
        }
        className="flex h-[52px] w-[52px] touch-none select-none items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gray-100 text-gray-600 shadow-lg ring-1 ring-gray-200 transition hover:scale-105 hover:shadow-xl"
      >
        {currentUser?.profilePhotoKey ? (
          <img
            key={photoVersion}
            src="/api/auth/profile-photo"
            alt={
              currentUser.name
            }
            draggable={false}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <span className="text-2xl">
            👤
          </span>
        )}
      </button>
    </div>
  );
}

/* =========================================================
   PROFILE MENU LINK
========================================================= */

function ProfileLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
    >
      <span className="w-5 text-center">
        {icon}
      </span>

      <span>
        {label}
      </span>
    </Link>
  );
}