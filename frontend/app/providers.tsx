'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

interface UserContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser || null)
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    }
  }

  useEffect(() => {
    // Fetch user on mount
    refreshUser()

    // Subscribe to auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null)
    })

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    setLoading(false)
  }, [user])

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
