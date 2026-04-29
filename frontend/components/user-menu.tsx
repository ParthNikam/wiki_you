'use client'

import { useUser } from '@/app/providers'
import Link from 'next/link'

export function UserMenu() {
  const { user, loading } = useUser()

  if (loading) {
    return <div className="text-gray-400">Loading...</div>
  }

  if (!user) {
    return (
      <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
        Sign In
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {user.email?.[0].toUpperCase()}
          </span>
        </div>
        <span className="text-white text-sm">{user.email}</span>
      </div>
    </div>
  )
}
