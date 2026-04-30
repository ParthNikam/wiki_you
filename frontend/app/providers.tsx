'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

const AuthContext = createContext<{user: User | null}>({user: null})


export default function AuthProvider({children, initialUser}: {children: React.ReactNode, initialUser: User | null}) {
    const [user, setUser] = useState<User | null>(initialUser)

    const supabase = createClient()

    useEffect(() => {
        const {data: {subscription}} = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null)
        })
    }, [supabase])

    return (
        <AuthContext.Provider value={{user}}>
            {children}
        </AuthContext.Provider>
    )
}



export const useAuth = () => useContext(AuthContext)