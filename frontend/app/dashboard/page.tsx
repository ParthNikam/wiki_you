"use client";

import { useAuth } from "@/app/providers";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState("");
<<<<<<< HEAD

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
=======
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

>>>>>>> dev/frontend-auth

  return (
    <div className="h-screen bg-black flex flex-col gap-4 items-center justify-center">
      <div className="text-4xl font-bold text-white/80 italic">Hello Parth</div>

<<<<<<< HEAD
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
=======

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

>>>>>>> dev/frontend-auth
    </div>
  );
}
