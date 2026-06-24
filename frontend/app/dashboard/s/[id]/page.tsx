"use client"

import { useAuth } from "@/app/providers";
import { Input } from "@/components/ui/input";
import { useParams, useRouter, redirect } from "next/navigation";
import { useState } from "react";


export default function Page() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const userData = user?.user_metadata;
    const params = useParams();


    const [input, setInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // fetch user's messages and post new messages

    const handleQuery = async (input: string) => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/query", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    chat_id: params.id,
                    message: trimmedInput,
                    sender: user?.id
                }),
            });
            const data = await res.json()
            console.log('got somethin for ya', data);
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="h-screen bg-black flex flex-col gap-4 items-center justify-between">

            <div className="flex flex-col h-full w-2xl mt-10 justify-start text-white">
                textarea
            </div>

            <form onSubmit={(e) => {
                e.preventDefault();
                handleQuery(input);
            }}>
                <Input
                className="w-2xl mb-20 p-4 text-xl border-none rounded-xl bg-white"
                id="text-input"
                value={input}
                disabled={isSubmitting}
                onChange={(e) => {setInput(e.target.value)}}
                placeholder="What should we learn today?"
                />
            </form>
            
        </div>
    )
}