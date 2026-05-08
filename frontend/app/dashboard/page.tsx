"use client";

import { useAuth } from "@/app/providers";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState("");

  const handleInput = async (data: string) => {
    const trimmedData = data.trim();
    if (!trimmedData) {
      return;
    }

    const formData = new FormData();
    formData.append("message", trimmedData);
    formData.append("sender", "user");
    formData.append("type", "message");

    const res = await fetch("/api/createChat", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (result.chat_id) {
      console.log("recieved chat_id, pushing to ", result.chat_id);
      router.push(`/dashboard/chat/${result.chat_id}`);
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col gap-4 items-center justify-center">
      <div className="text-4xl font-bold text-white/80 italic">Hello Parth</div>

      <div className="border-t border-white/10 px-6 pb-4">
        <div className="mx-auto w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInput(input);
            }}
          >
            <Input
              className="h-12 w-full border-none bg-white px-4"
              id="text-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              placeholder="What should we learn today?"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
