"use client";

import { useAuth } from "@/app/providers";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleInput = async (data: string) => {
    const trimmedInput = data.trim();
    if (!trimmedInput || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        body: JSON.stringify({
          message: trimmedInput,
          sender: user?.id || "ai"
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error || "Failed to create chat.");
      }

      if (payload.chat_id) {
        setInput("");
        router.push(`/dashboard/s/${payload.chat_id}`);
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    } finally {
      setIsSubmitting(false);
    }

  };


  return (
    <div className="h-screen bg-black flex flex-col gap-4 items-center justify-center">
      <div className="text-4xl font-bold text-white/80 italic">Hello Parth</div>


      <form onSubmit={(e) => {
        e.preventDefault();
        handleInput(input);
      }}>
        <Input
          className="w-2xl p-4 text-xl rounded-xl border-none bg-white"
          id="text-input"
          value={input}
          disabled={isSubmitting}
          onChange={(e) => {setInput(e.target.value)}}
          placeholder="What should we learn today?"
        />
      </form>

    </div>
  );
}
