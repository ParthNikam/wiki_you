'use client'

import { useUser } from '@/app/providers'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

export function ProtectedPageWrapper({ children }: { children: ReactNode }) {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-white text-xl font-semibold mb-2">Loading...</div>
          <div className="text-gray-400">Authenticating your session</div>
        </div>
      </div>
    )
  }

  if (!user) {
    redirect('/auth/login')
  }

  return <>{children}</>
}
