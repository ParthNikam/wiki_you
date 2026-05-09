import { redirect, notFound } from "next/navigation";

import { ChatThread } from "@/components/chat-thread";
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

      <ChatThread
        key={`${id}-${messages.length}-${messages.at(-1)?.id ?? "empty"}`}
        chatId={id}
        initialMessages={messages}
      />
    </div>
  );
}
