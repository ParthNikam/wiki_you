'use client'

import { useAuth } from '@/app/providers'


export default function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
      <div className="min-h-screen bg-black">
        <header className="border-b border-gray-800 bg-black">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Wiki You</h1>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <div className="text-right">
                    <div className="text-white font-semibold">{user.email}</div>
                    <div className="text-gray-400 text-sm">Account</div>
                  </div>
                  <button onClick={signOut}>logout</button>
                </>
              )}
            </div>
          </div>
        </header>

        
      </div>    
  )
}
