"use client";

import { SubmitEvent, useState } from "react";

import { Input } from "@/components/ui/input";

type ChatMessageFormProps = {
  chatId: string;
  disabled?: boolean;
  onSendMessage?: (message: string) => Promise<void>;
};

export function ChatMessageForm({
  chatId,
  disabled = false,
  onSendMessage,
}: ChatMessageFormProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    setMessage("");

    if (onSendMessage) {
      await onSendMessage(trimmedMessage);
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
      setMessage(trimmedMessage);
      return;
    }
  };

  return (
    <form className="flex w-full" onSubmit={handleSubmit}>
      <Input
        className="h-12 w-full border-none bg-white px-4"
        id="text-input"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="What should we learn today?"
        disabled={disabled}
      />
    </form>
  );
}
