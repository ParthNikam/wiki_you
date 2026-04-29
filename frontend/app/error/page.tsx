'use client'

import { useSearchParams } from 'next/navigation'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'An error occurred during authentication'

  return (
    <div className="bg-black flex flex-col justify-center h-screen items-center px-4">
      <div className="max-w-md text-center">
        <p className="text-3xl font-bold text-white mb-4">Authentication Error</p>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="space-y-4">
          <a
            href="/auth/login"
            className="inline-block bg-white text-black font-semibold py-2 px-6 rounded-full hover:bg-gray-200"
          >
            Back to Login
          </a>
          <p>
            <a href="/auth/signup" className="text-blue-400 hover:text-blue-300">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
