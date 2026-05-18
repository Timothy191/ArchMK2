"use client";

import { logout } from "~/app/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { User, LogOut, Settings, Bell, Shield } from "lucide-react";

export function UserNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-arch-surface-secondary/70 border border-arch-border-subtle p-0">
          <User className="h-4 w-4 text-arch-text-tertiary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-arch-surface-secondary/90 backdrop-blur-xl border-arch-border-subtle text-arch-text-primary" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Plantcor Operator</p>
            <p className="text-xs leading-none text-arch-text-tertiary">
              admin@arch-systems.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-arch-border-subtle" />
        <DropdownMenuItem className="hover:bg-arch-surface-tertiary cursor-pointer">
          <Shield className="mr-2 h-4 w-4" />
          <span>Security Status</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-arch-surface-tertiary cursor-pointer">
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-arch-surface-tertiary cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-arch-border-subtle" />
        <form action={logout}>
          <DropdownMenuItem className="text-red-400 hover:bg-red-400/10 cursor-pointer focus:bg-red-400/10 focus:text-red-400">
            <LogOut className="mr-2 h-4 w-4" />
            <button type="submit" className="w-full text-left">Sign out</button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
