"use client";

import { SubmitEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";

type ChatMessageFormProps = {
  chatId: string;
};

export function ChatMessageForm({ chatId }: ChatMessageFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    const formData = new FormData();
    formData.append("message", trimmedMessage);
    formData.append("sender", "user");
    formData.append("chatid", chatId);

    const response = await fetch("/api/postMessage", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("Failed to post message");
      return;
    }

    setMessage("");
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <form className="flex w-full" onSubmit={handleSubmit}>
      <Input
        className="h-12 w-full border-none bg-white px-4"
        id="text-input"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="What should we learn today?"
        disabled={isPending}
      />
    </form>
  );
}
