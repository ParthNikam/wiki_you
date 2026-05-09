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
}
