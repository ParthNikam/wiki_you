import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const BASE_URL = "127.0.0.1:8000";

const generateResponse = async (message: string) => {
  return "your ai generated message";
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { chat_id, message, sender} = await req.json();

    // insert user message
    const { data, error } = await supabase
      .from("messages")
      .insert({ chat_id, message, sender, type: "user" })
      .select()
      .single();
  

    if (error) throw(error)
      
    // get ai response
    const aiText = await generateResponse(message);

    // insert ai response into database 
    await supabase
      .from("messages")
      .insert({ chat_id, message: aiText, sender, type: "ai"})
      .select()
      .single();

    return Response.json({ success: true, message: aiText });

  } catch (err: any) {
    console.error("Route Crash:", err);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
