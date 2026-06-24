import type { Metadata } from "next";
<<<<<<< HEAD
import { Geist, Geist_Mono, JetBrains_Mono, Inter } from "next/font/google";
=======
import { Geist, Geist_Mono, Inter } from "next/font/google";
>>>>>>> dev/frontend-auth
import "./globals.css";
import AuthProvider from "@/app/providers";
import { createClient } from "@/utils/supabase/server";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});
<<<<<<< HEAD

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});
=======
>>>>>>> dev/frontend-auth

const geistSans = Geist({variable: "--font-geist-sans",subsets: ["latin"],});
const geistMono = Geist_Mono({variable: "--font-geist-mono",subsets: ["latin"],});
export const metadata: Metadata = {title: "Wiki You",description: "Collaborative wiki platform",};


export default async function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  const supabase = await createClient();
  const { data: {user}} = await supabase.auth.getUser();

  return (
    <html
      lang="en"
<<<<<<< HEAD
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, jetbrainsMono.variable, "font-sans", inter.variable)}
=======
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
>>>>>>> dev/frontend-auth
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider initialUser={user}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
