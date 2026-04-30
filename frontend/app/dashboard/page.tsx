'use client'

import { useAuth } from '@/app/providers'
// import { ProtectedPageWrapper } from '@/components/protected-page-wrapper'
// import { LogoutButton } from '@/components/logout-button'


export default function DashboardPage() {
  const { user } = useAuth()

  return (
    // <ProtectedPageWrapper>
      <div className="min-h-screen bg-black">
        <header className="border-b border-gray-800 bg-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Wiki You</h1>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <div className="text-right">
                    <div className="text-white font-semibold">{user.email}</div>
                    <div className="text-gray-400 text-sm">Account</div>
                  </div>
                  {/* <LogoutButton /> */}
                </>
              )}
            </div>
          </div>
        </header>
      </div>
    // </ProtectedPageWrapper>
  )
}
