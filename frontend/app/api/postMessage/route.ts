'use server'

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const BACKEND_URL = process.env.BACKEND_URL;

function getQueryEndpoint() {
    if (!BACKEND_URL) {
        throw new Error("BACKEND_URL is not configured");
    }

    return new URL("query", BACKEND_URL).toString();
}

function extractAiMessage(payload: unknown) {
    if (typeof payload === "string") {
        return payload.trim();
    }

    if (!payload || typeof payload !== "object") {
        return "";
    }

    const candidate = payload as Record<string, unknown>;
    const possibleKeys = [
        "answer",
        "response",
        "message",
        "result",
        "output",
    ];

    for (const key of possibleKeys) {
        const value = candidate[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return "";
}

async function fetchAiResponse(question: string) {
    const response = await fetch(getQueryEndpoint(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Backend query failed with status ${response.status}`);
    }

    const payload = await response.json();
    console.log('backend payload', payload);
    const aiMessage = extractAiMessage(payload);
    console.log('aimessage', aiMessage);

    if (!aiMessage) {
        throw new Error("Backend query returned an empty response");
    }

    return aiMessage;
}

// post data to supabase
export async function POST(req:Request) {
    const supabase =  await createClient()

    const formData = await req.formData()

    console.log(formData)

    const message = formData.get('message') as string
    const sender = formData.get('sender') as string
    const chatid = formData.get('chatid') as string

    if (!message?.trim() || !sender || !chatid) {
        return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // insert message to messages table
    const {data, error} = await supabase
    .from('messages')
    .insert([{
        message,
        sender, 
        chat_id: chatid
    }])
    .select()

    
    if(error) return Response.json({error: error.message}, { status: 400 })
    console.log("backend created message")

    let aiMessage = "";

    try {
        aiMessage = await fetchAiResponse(message);
    } catch (backendError) {
        console.error(backendError);
        return Response.json(
            { error: "Failed to get AI response" },
            { status: 502 }
        );
    }

    const { data: aiData, error: aiError } = await supabase
    .from('messages')
    .insert([{
        message: aiMessage,
        sender: 'ai',
        chat_id: chatid
    }])
    .select()

    if (aiError) {
        return Response.json({ error: aiError.message }, { status: 400 })
    }

    revalidatePath(`/dashboard/chat/${chatid}`)

    return Response.json({success: true, data, ai: aiData})

}
