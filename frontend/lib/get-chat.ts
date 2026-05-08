import { createClient } from "@/utils/supabase/server";

export async function getChatPageData(chatId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      chat: null,
      messages: [],
      error: "unauthorized",
    };
  }

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .eq("creator", user.id)
    .single();

  if (chatError || !chat) {
    return {
      user,
      chat: null,
      messages: [],
      error: "not_found",
    };
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  return {
    user,
    chat,
    messages: messages ?? [],
    error: messagesError?.message ?? null,
  };
}
