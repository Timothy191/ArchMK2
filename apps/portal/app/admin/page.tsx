"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { AdminTabs } from "~/features/admin/components/AdminTabs";
import { UsersTab } from "~/features/admin/tabs/UsersTab";
import { DepartmentsTab } from "~/features/admin/tabs/DepartmentsTab";
import { FleetTab } from "~/features/admin/tabs/FleetTab";
import { SitesTab } from "~/features/admin/tabs/SitesTab";
import { WebhooksTab } from "~/features/admin/tabs/WebhooksTab";
import { AuditLogsTab } from "~/features/admin/tabs/AuditLogsTab";
import { SettingsTab } from "~/features/admin/tabs/SettingsTab";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const supabase = createBrowserSupabaseClient();

  // Check auth and role
  supabase.auth
    .getUser()
    .then(({ data: { user } }: { data: { user: any } }) => {
      if (!user) {
        redirect("/login");
      }

      supabase
        .from("employees")
        .select("role")
        .eq("auth_id", user.id)
        .single()
        .then(({ data: employee }: { data: any }) => {
          if (employee?.role !== "admin") {
            redirect("/");
          }
        });
    });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-heading)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <span className="text-lg font-medium text-[var(--text-heading)]">
            Admin Dashboard
          </span>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <AdminTabs defaultValue="users" onValueChange={setActiveTab}>
          {activeTab === "users" && <UsersTab />}
          {activeTab === "departments" && <DepartmentsTab />}
          {activeTab === "fleet" && <FleetTab />}
          {activeTab === "sites" && <SitesTab />}
          {activeTab === "webhooks" && <WebhooksTab />}
          {activeTab === "audit-logs" && <AuditLogsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </AdminTabs>
      </main>
    </div>
  );
}
