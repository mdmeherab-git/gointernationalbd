import type { ReactNode } from "react";
import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin/widgets";

export const metadata: Metadata = {
  title: "Admin — GO International BD",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AdminShell>{children}</AdminShell>
    </ToastProvider>
  );
}
