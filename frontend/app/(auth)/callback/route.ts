import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const proto = request.headers.get('x-forwarded-proto')
      const host =
        forwardedHost || (proto ? `${proto}://${request.headers.get('host')}` : '')
      const redirectUrl = host + next
      return NextResponse.redirect(redirectUrl)
    }
  }

  // redirect the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}
