import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { message, sender } = await req.json()

  if (message) {
    return Response.json(
      { success: false, error: "Message is required." },
      { status: 400 }
    );
  }

  const newChat = await supabase
    .from("chats")
    .insert([{}])
    .select()
    .single();

  const chat_id = newChat.data.id;
  
  const newMessage = await supabase
    .from("messages")
    .insert({chat_id, message: message.trim(), sender, type: "user"})
    .select()
    .single();

  return Response.json({
    success: true,
    chat_id,
    message: newMessage,
  });
}
