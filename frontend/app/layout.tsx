import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/app/providers";
import { createClient } from "@/utils/supabase/server";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const geistSans = Geist({variable: "--font-geist-sans",subsets: ["latin"],});
const geistMono = Geist_Mono({variable: "--font-geist-mono",subsets: ["latin"],});
export const metadata: Metadata = {title: "Wiki You",description: "Collaborative wiki platform",};


export default async function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  const supabase = await createClient();
  const { data: {user}} = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, jetbrainsMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider initialUser={user}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
