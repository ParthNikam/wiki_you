'use server'

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

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

    revalidatePath(`/dashboard/chat/${chatid}`)

    return Response.json({success: true, data})

}


// store query into supabase 
// get back an id

// POST query to backend 
// get back a response 



