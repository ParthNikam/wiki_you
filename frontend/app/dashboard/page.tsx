'use client'

// import { useUser } from '@/app/providers'
// import { ProtectedPageWrapper } from '@/components/protected-page-wrapper'
// import { LogoutButton } from '@/components/logout-button'

export default function DashboardPage() {
  // const { user } = useUser()

  return (
    // <ProtectedPageWrapper>
      <div className="min-h-screen bg-black">
        <header className="border-b border-gray-800 bg-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Wiki You</h1>
            <div className="flex items-center gap-4">
              {/* {user && ( */}
                <>
                  <div className="text-right">
                    {/* <div className="text-white font-semibold">{user.email}</div> */}
                    <div className="text-gray-400 text-sm">Account</div>
                  </div>
                  {/* <LogoutButton /> */}
                </>
              {/* )} */}
            </div>
          </div>
        </header>

        {/* <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
            <h2 className="text-3xl font-bold text-white mb-4">Welcome Back!</h2>
            <p className="text-gray-300 mb-6">
              You're logged in as <span className="font-semibold">{user?.email}</span>
            </p>

            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">User Information</h3>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="text-gray-400">Email:</span> {user?.email}
                  </p>
                  <p>
                    <span className="text-gray-400">ID:</span> {user?.id}
                  </p>
                  <p>
                    <span className="text-gray-400">Provider:</span>{' '}
                    {user?.identities?.[0]?.provider || 'email'}
                  </p>
                  <p>
                    <span className="text-gray-400">Email Verified:</span>{' '}
                    {user?.email_confirmed_at ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-300 mb-2">💡 Tip</h3>
                <p className="text-blue-200">
                  Your session is persisted using React Context and Supabase. The user information
                  automatically syncs across all pages in your app. The context listens to auth
                  changes and updates in real-time.
                </p>
              </div>
            </div>
          </div>
        </main> */}
      </div>
    // </ProtectedPageWrapper>
  )
}
