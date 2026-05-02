'use client'

export default function SignupConfirmationPage() {
  return (
    <div className="bg-black flex flex-col justify-center h-screen items-center px-4">
      <div className="max-w-md text-center">
        <p className="text-3xl font-bold text-white mb-4">Check Your Email</p>
        <p className="text-gray-300 mb-6">
          We've sent a confirmation link to your email address. Please click the link to verify your email and complete your sign-up.
        </p>
        <p className="text-gray-400 text-sm">
          If you don't see the email, please check your spam folder.
        </p>
        <p className="text-white mt-8">
          <a href="/auth/login" className="text-blue-400 hover:text-blue-300">
            Back to login
          </a>
        </p>
      </div>
    </div>
  )
}
