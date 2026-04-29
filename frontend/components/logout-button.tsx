'use client'

import { logout } from '@/lib/auth/actions'
import { useUser } from '@/app/providers'

export function LogoutButton() {
  const { user } = useUser()

  if (!user) {
    return null
  }

  return (
    <button
      onClick={() => logout()}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
    >
      Logout
    </button>
  )
}
