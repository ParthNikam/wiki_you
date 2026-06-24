<<<<<<< HEAD
'use server'

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: chat, error } = await supabase
    .from("chats")
    .insert([
      {
        creator: user.id,
        name: "New chat",
      },
    ])
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/chat/${chat.id}`);

  return Response.json({ success: true, chat });
=======
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
>>>>>>> dev/frontend-auth
}
