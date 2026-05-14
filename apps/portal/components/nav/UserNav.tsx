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
        <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-[#242424] border border-[#363636] p-0">
          <User className="h-4 w-4 text-[#898989]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#171717] border-[#363636] text-[#fafafa]" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Plantcor Operator</p>
            <p className="text-xs leading-none text-[#898989]">
              admin@arch-systems.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#363636]" />
        <DropdownMenuItem className="hover:bg-[#242424] cursor-pointer">
          <Shield className="mr-2 h-4 w-4" />
          <span>Security Status</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-[#242424] cursor-pointer">
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-[#242424] cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#363636]" />
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
