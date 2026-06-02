/* eslint-disable no-undef */
import type { Meta, StoryObj } from "@storybook/react";
import { LoginCardShell } from "./LoginCardShell";
import { LoginForm } from "./LoginForm";
import { AlertTriangle, Lock, Clock } from "lucide-react";
import React from "react";

// Mock next/navigation for Storybook environment
const mockRouter = {
  push: () => {},
  refresh: () => {},
};
const mockSearchParams = {
  get: (_key: string) => null,
};

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

const meta: Meta<typeof LoginCardShell> = {
  title: "Auth/LoginCard",
  component: LoginCardShell,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="w-[450px] p-6 bg-gradient-to-tr from-slate-100 to-slate-200 min-h-[600px] flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LoginCardShell>;

export const Default: Story = {
  render: () => (
    <LoginCardShell>
      {/* Title bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-arch-border-subtle bg-arch-surface-secondary/30">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-3 h-3 rounded-full bg-mac-red border border-arch-border-subtle" />
          <span className="w-3 h-3 rounded-full bg-mac-yellow border border-arch-border-subtle" />
          <span className="w-3 h-3 rounded-full bg-mac-green border border-arch-border-subtle" />
        </div>
        <span className="flex-1 text-center text-[13px] font-medium text-arch-text-secondary select-none pr-14">
          Arch — System Sign In
        </span>
      </div>

      {/* Login form section */}
      <div className="p-6 space-y-4 border-b border-arch-border-subtle bg-white/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--accent-blue)]">Welcome Back</span>
          <div className="flex items-center gap-1.5 text-[10px] text-arch-accent-green">
            <Lock className="w-3 h-3" strokeWidth={1.5} />
            <span>Secure</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-300 rounded shrink-0 flex items-center justify-center font-bold text-slate-700">A</div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">Arch</h1>
            <p className="text-arch-text-tertiary text-sm">Sign in to Arch Systems</p>
          </div>
        </div>

        <LoginForm />
      </div>

      {/* Enterprise Footer */}
      <div className="px-4 py-2.5 flex items-center justify-between text-[10px] text-arch-text-tertiary bg-arch-surface-secondary/15">
        <div className="flex items-center gap-2">
          <span>Arch Systems v2.4.1</span>
          <span className="w-1 h-1 rounded-full bg-arch-text-tertiary" />
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            Updated 02 Jun 2026
          </span>
        </div>
        <span className="uppercase tracking-wider font-medium">Arch OS</span>
      </div>
    </LoginCardShell>
  ),
};

export const SystemUnavailable: Story = {
  render: () => (
    <div className="rounded-xl overflow-hidden border border-arch-border-primary bg-arch-surface-secondary/40 backdrop-blur-3xl shadow-window w-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-arch-border-subtle bg-arch-surface-secondary/30">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-3 h-3 rounded-full bg-mac-red border border-arch-border-subtle" />
          <span className="w-3 h-3 rounded-full bg-mac-yellow border border-arch-border-subtle" />
          <span className="w-3 h-3 rounded-full bg-mac-green border border-arch-border-subtle" />
        </div>
        <span className="flex-1 text-center text-[13px] font-medium text-arch-text-secondary select-none pr-14">
          Arch — System Sign In
        </span>
      </div>
      <div className="p-6 space-y-4 text-center bg-white/40">
        <AlertTriangle className="w-8 h-8 text-arch-accent-red mx-auto" strokeWidth={1.5} />
        <h1 className="text-lg font-semibold text-arch-text-primary">System Unavailable</h1>
        <p className="text-sm text-arch-text-tertiary">
          Unable to reach authentication services. Please try again shortly or contact IT Support.
        </p>
      </div>
    </div>
  ),
};

export const IntroOverlayActive: Story = {
  render: () => (
    <div className="relative w-full h-[600px] border border-slate-300 rounded-xl overflow-hidden flex items-center justify-center">
      {/* Visual representation of overlay */}
      <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-white space-y-4 text-center">
        <h2 className="text-xl font-bold tracking-widest text-slate-300 uppercase">Arch Systems</h2>
        <p className="text-xs text-slate-500 max-w-xs">Initializing industrial operations terminal...</p>
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="w-2/3 h-full bg-white animate-pulse" />
        </div>
        <button className="text-xs text-slate-400 border border-slate-700 px-3 py-1 rounded hover:bg-slate-800 transition-colors">
          Skip Intro
        </button>
      </div>
      <div className="opacity-10 pointer-events-none">
        {Default.render?.()}
      </div>
    </div>
  ),
};
