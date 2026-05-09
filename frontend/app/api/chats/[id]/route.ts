'use server'

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getAuthorizedChat(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, chat: null, error: "Unauthorized" };
  }

  const { data: chat, error } = await supabase
    .from("chats")
    .select("id")
    .eq("id", id)
    .eq("creator", user.id)
    .single();

  if (error || !chat) {
    return { supabase, user, chat: null, error: "Not found" };
  }

  return { supabase, user, chat, error: null };
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, chat, error } = await getAuthorizedChat(id);

  if (error === "Unauthorized") {
    return Response.json({ error }, { status: 401 });
  }

  if (!chat) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }

  const body = await req.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const { data, error: updateError } = await supabase
    .from("chats")
    .update({ name })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 400 });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/chat/${id}`);

  return Response.json({ success: true, chat: data });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, chat, error } = await getAuthorizedChat(id);

  if (error === "Unauthorized") {
    return Response.json({ error }, { status: 401 });
  }

  if (!chat) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }

  const { error: messagesError } = await supabase
    .from("messages")
    .delete()
    .eq("chat_id", id);

  if (messagesError) {
    return Response.json({ error: messagesError.message }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("chats")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 400 });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/chat/${id}`);

  return Response.json({ success: true });
}
