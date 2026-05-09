"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ChatMessageForm } from "@/components/chat-message-form";
import { ChatScrollContainer } from "@/components/chat-scroll-container";
import { MarkdownMessage } from "@/components/markdown-message";
import { Skeleton } from "@/components/ui/skeleton";

type ChatMessage = {
  id: string;
  message: string;
  sender: string;
};

type OptimisticMessage = ChatMessage & {
  optimistic?: boolean;
};

type ChatThreadProps = {
  chatId: string;
  initialMessages: ChatMessage[];
};

export function ChatThread({ chatId, initialMessages }: ChatThreadProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [optimisticMessages, setOptimisticMessages] = useState<
    OptimisticMessage[]
  >([]);
  const [isAwaitingAiResponse, setIsAwaitingAiResponse] = useState(false);

  const messages = useMemo(
    () => [...initialMessages, ...optimisticMessages],
    [initialMessages, optimisticMessages]
  );

  const handleSendMessage = async (message: string) => {
    const optimisticMessage: OptimisticMessage = {
      id: `optimistic-${Date.now()}`,
      message,
      sender: "user",
      optimistic: true,
    };

    setOptimisticMessages((current) => [...current, optimisticMessage]);
    setIsAwaitingAiResponse(true);

    const formData = new FormData();
    formData.append("message", message);
    formData.append("sender", "user");
    formData.append("chatid", chatId);

    const response = await fetch("/api/postMessage", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      setOptimisticMessages((current) =>
        current.filter((item) => item.id !== optimisticMessage.id)
      );
      setIsAwaitingAiResponse(false);
      console.error("Failed to post message");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      <ChatScrollContainer
        className="no-scrollbar flex-1 overflow-y-auto px-6 py-6"
        scrollKey={messages.length + (isAwaitingAiResponse ? 1 : 0)}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.length || isAwaitingAiResponse ? (
            <>
              {messages.map((message) => {
                const isUser = message.sender === "user";
                const isAi = message.sender === "ai";

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        isUser
                          ? "bg-white text-black"
                          : isAi
                            ? "bg-white/10 text-white"
                            : "bg-white/5 text-white/80"
                      }`}
                    >
                      {isAi ? (
                        <MarkdownMessage content={message.message} />
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {message.message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isAwaitingAiResponse && (
                <div className="flex justify-start">
                  <div className="flex w-full max-w-[80%] flex-col gap-2 rounded-2xl bg-white/10 px-4 py-4">
                    <Skeleton className="h-4 w-32 bg-white/20" />
                    <Skeleton className="h-4 w-full bg-white/20" />
                    <Skeleton className="h-4 w-3/4 bg-white/20" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-sm text-white/60">
              No messages yet. Start the conversation below.
            </div>
          )}
        </div>
      </ChatScrollContainer>

      <div className="border-t border-white/10 px-6 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          <ChatMessageForm
            chatId={chatId}
            disabled={isAwaitingAiResponse || isRefreshing}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </>
  );
}
