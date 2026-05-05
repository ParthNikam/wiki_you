'use server'

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const BASE_URL = "127.0.0.1:8000"

// post data to supabase
export async function POST(req:Request) {
    const supabase =  await createClient()

    const formData = await req.formData()

    console.log(formData)

    const message = formData.get('message') as string
    const type = formData.get('type') as string
    const sender = formData.get('sender') as string

    // create a chat in the chats table
    const {data: chat, error: chatError} = await supabase
    .from('chats')
    .insert([{}])
    .select()
    .single()

    if (chatError) return Response.json({error: chatError.message})
    console.log("backend created chat", chat.id)

    // insert message to messages table
    const {data, error} = await supabase
    .from('messages')
    .insert([{
        message,
        type, 
        sender, 
        chat_id: chat.id
    }])
    .select()

    
    if(error) return Response.json({error: error.message})
    console.log("backend created message")

    return Response.json({success: true, chat_id: chat.id, data:data})

}


// store query into supabase 
// get back an id

// POST query to backend 
// get back a response 



