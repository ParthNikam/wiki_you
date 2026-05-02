"use client";

import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const userData = user?.user_metadata;
  return (
    <div className="h-screen bg-black flex flex-col gap-4 items-center justify-center">
      <div className="text-4xl font-bold text-white/80 italic">
        Hello Parth
      </div>
      <Input className="w-2xl p-4 border-none bg-white" id="text-input" placeholder="What should we learn today?"/>
    </div>
  );
}
