'use client'

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useAuth } from "@/app/providers";


export default function Home() {

  const { user } = useAuth()
  if (user) redirect('/dashboard')
  return (
    <div className="bg-black flex flex-col justify-center h-screen items-center">
      <p className="text-3xl p-10 font-bold text-white text-center">Wiki You</p>
      <Link href="/auth/login" className="border border-1 rounded-xl hover:bg-gray-600 p-2">Get Started</Link>

    </div>
  );
}
