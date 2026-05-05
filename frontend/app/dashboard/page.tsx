"use client";

import { useAuth } from "@/app/providers";
import { Input } from "@/components/ui/input";
import { useRouter, redirect } from "next/navigation";
import { useState } from "react";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const userData = user?.user_metadata;

  const [input, setInput] = useState("");


  const handleInput = async (data: string) => {
    // post input to api/query
    const formData = new FormData()
    formData.append('message',data)
    formData.append('sender', user?.id || "ai")
    formData.append('type', 'message')

    const res = await fetch('/api/query', {
      method: 'POST',
      body: formData,
    })

    const result = await res.json();
    
    if (result.chat_id) {
      console.log("recieved chat_id, pushing to ", result.chat_id);
      router.push(`dashboard/s/${result.chat_id}`)
    }

  };


  return (
    <div className="h-screen bg-black flex flex-col gap-4 items-center justify-center">
      <div className="text-4xl font-bold text-white/80 italic">Hello Parth</div>


      <form onSubmit={(e) => {
        e.preventDefault();
        handleInput(input);
      }}>
        <Input
          className="w-2xl p-4 border-none bg-white"
          id="text-input"
          value={input}
          onChange={(e) => {setInput(e.target.value)}}
          placeholder="What should we learn today?"
        />
      </form>

    </div>
  );
}
