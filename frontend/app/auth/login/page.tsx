'use client'

import { login, signup, signInWithGoogle } from '@/lib/auth/actions'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function AuthPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const signupParam = searchParams.get('signup')
  const [isSignup, setIsSignup] = useState(signupParam === 'true')

  return (
    <div className="bg-black flex flex-col justify-center h-screen items-center px-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h1>

        {message && (
          <div className="mb-6 p-4 bg-red-900 text-red-200 rounded-lg text-sm">
            {message}
          </div>
        )}

        <form className="flex flex-col gap-4 mb-6">
          <input
            className="bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
            name="email"
            type="email"
            required
          />

          <input
            className="bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Password"
            name="password"
            type="password"
            required
          />

          {isSignup && (
            <input
              className="bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm Password"
              name="confirmPassword"
              type="password"
              required
            />
          )}

          <button
            className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-gray-200 transition"
            formAction={isSignup ? signup : login}
          >
            {isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">or continue with</span>
          </div>
        </div>

        <form className="mb-6">
          <button
            className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white font-semibold py-3 rounded-lg hover:bg-gray-700 transition border border-gray-700"
            formAction={signInWithGoogle}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </form>

        <p className="text-gray-400 text-center">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-400 hover:text-blue-300 font-semibold transition"
          >
            {isSignup ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}
