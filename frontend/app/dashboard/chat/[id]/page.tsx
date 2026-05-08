import { redirect, notFound } from "next/navigation";

import { ChatMessageForm } from "@/components/chat-message-form";
import { getChatPageData } from "@/lib/get-chat";

type ChatPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  const { user, chat, messages, error } = await getChatPageData(id);

  if (!user) {
    redirect("/auth/login");
  }

  if (!chat) {
    notFound();
  }

  if (error && error !== "not_found") {
    console.error(error);
  }

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-black">
      <div className="border-b border-white/10 px-6 py-4">
        <h1 className="text-lg font-semibold text-white">
          {chat.name || "Untitled chat"}
        </h1>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.length ? (
            messages.map((message) => {
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
                    {message.message}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-sm text-white/60">
              No messages yet. Start the conversation below.
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 px-6 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          <ChatMessageForm chatId={id} />
        </div>
      </div>
    </div>
  );
}
