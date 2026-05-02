'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  user: User | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


export default function AuthProvider({children, initialUser}: {children: React.ReactNode, initialUser: User | null}) {
    const [user, setUser] = useState<User | null>(initialUser)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const {data: {subscription}} = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null)
            if (event === 'SIGNED_OUT') {
                router.refresh()
            }
        })
        return () => subscription.unsubscribe()        
    }, [supabase, router])

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login') // Optional: redirect after logout
    }


    return (
        <AuthContext.Provider value={{user, signOut}}>
            {children}
        </AuthContext.Provider>
    )
}


export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}