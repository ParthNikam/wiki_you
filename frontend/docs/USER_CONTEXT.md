# User Context & Persistent Sessions Guide

## 📚 Overview

The app now includes a **UserProvider** that manages user state globally using React Context. This persists user information across all sessions and pages without reloading.

## 🏗️ Architecture

### Files Created:
1. **`app/providers.tsx`** - UserProvider & useUser hook
2. **`components/user-menu.tsx`** - Display user email/avatar
3. **`components/logout-button.tsx`** - Logout functionality
4. **`components/protected-page-wrapper.tsx`** - Redirect unauthenticated users
5. **`app/dashboard/page.tsx`** - Example protected page

## 🔌 Usage Guide

### 1. Access User in Any Component

```tsx
'use client'

import { useUser } from '@/app/providers'

export function MyComponent() {
  const { user, loading } = useUser()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  return <div>Welcome {user.email}</div>
}
```

### 2. Protect a Page

```tsx
'use client'

import { ProtectedPageWrapper } from '@/components/protected-page-wrapper'

export default function ProtectedPage() {
  return (
    <ProtectedPageWrapper>
      {/* Content only shows if user is authenticated */}
      <div>This is protected content</div>
    </ProtectedPageWrapper>
  )
}
```

### 3. Display User Menu

```tsx
import { UserMenu } from '@/components/user-menu'

export function Header() {
  return (
    <header>
      <h1>My App</h1>
      <UserMenu /> {/* Shows user email or "Sign In" link */}
    </header>
  )
}
```

### 4. Add Logout Button

```tsx
import { LogoutButton } from '@/components/logout-button'

export function UserProfile() {
  return (
    <div>
      <p>User profile</p>
      <LogoutButton />
    </div>
  )
}
```

## 🔄 How It Works

### UserProvider Flow:

```
1. App mounts → UserProvider fetches current user
2. Sets up auth subscription to listen for login/logout
3. User state automatically updates when:
   - User logs in
   - User logs out
   - User's email is confirmed
   - User profile changes
4. All child components can access user via useUser() hook
5. On page refresh → User restored from session cookies
```

### Session Persistence:

- Supabase automatically manages session cookies
- Middleware refreshes session on every request
- UserProvider syncs with Supabase auth state
- User data survives page refreshes and navigation

## 💾 User Object Structure

```typescript
interface User {
  id: string                    // Unique user ID
  email: string                 // User's email
  email_confirmed_at: string    // When email was verified
  identities: Identity[]        // Auth providers (Google, email, etc.)
  // ... other Supabase fields
}
```

### Access User Data:

```tsx
const { user } = useUser()

// Get specific info
user.id              // User ID
user.email           // Email address
user.email_confirmed_at  // Email verified timestamp
user.identities?.[0]?.provider  // "google", "email", etc.
user.user_metadata   // Custom user data (if set)
user.app_metadata    // App-specific metadata
```

## 🔐 Context API Reference

### useUser() Hook

```typescript
const { user, loading, refreshUser } = useUser()

// Properties:
user: User | null          // Current authenticated user
loading: boolean           // True while fetching user
refreshUser: () => Promise<void>  // Manually refresh user data
```

## 📋 Common Patterns

### Pattern 1: Show Different UI for Logged In / Not Logged In

```tsx
'use client'

import { useUser } from '@/app/providers'

export function AuthStatus() {
  const { user, loading } = useUser()

  if (loading) return <span>...</span>

  return (
    <div>
      {user ? (
        <p>Logged in as {user.email}</p>
      ) : (
        <a href="/auth/login">Sign in</a>
      )}
    </div>
  )
}
```

### Pattern 2: Redirect Unauthenticated Users

```tsx
'use client'

import { useUser } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function ProtectedComponent() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) return <div>Loading...</div>
  if (!user) return null

  return <div>Protected content</div>
}
```

### Pattern 3: Access User ID for API Calls

```tsx
'use client'

import { useUser } from '@/app/providers'

export function UserBoard() {
  const { user } = useUser()

  async function fetchUserData() {
    const res = await fetch(`/api/users/${user?.id}`)
    // ...
  }

  return <button onClick={fetchUserData}>Load My Data</button>
}
```

### Pattern 4: Real-Time Sync with Database

```tsx
'use client'

import { useUser } from '@/app/providers'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function UserPreferences() {
  const { user } = useUser()
  const [preferences, setPreferences] = useState(null)

  useEffect(() => {
    if (!user) return

    const supabase = createClient()

    // Subscribe to real-time updates
    const subscription = supabase
      .from('user_preferences')
      .on('*', (payload) => {
        if (payload.new.user_id === user.id) {
          setPreferences(payload.new)
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return <div>Preferences: {JSON.stringify(preferences)}</div>
}
```

## 🚀 Next Steps

1. **Store User Preferences** - Create a user_preferences table linked to auth.users
2. **User Metadata** - Use `supabase.auth.updateUser()` to store custom fields
3. **Real-Time Database** - Combine useUser() with Supabase subscriptions
4. **User Avatars** - Add profile pictures via Supabase Storage
5. **Profile Page** - Create `/app/profile/page.tsx` to edit user info

## 📖 Example: Creating a Profile Page

```tsx
'use client'

import { useUser } from '@/app/providers'
import { ProtectedPageWrapper } from '@/components/protected-page-wrapper'

export default function ProfilePage() {
  const { user, refreshUser } = useUser()

  return (
    <ProtectedPageWrapper>
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Profile</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm">Email</label>
              <p className="text-white text-lg">{user?.email}</p>
            </div>
            
            <div>
              <label className="text-gray-300 text-sm">User ID</label>
              <p className="text-white text-sm font-mono">{user?.id}</p>
            </div>

            <button
              onClick={() => refreshUser()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh User Data
            </button>
          </div>
        </div>
      </div>
    </ProtectedPageWrapper>
  )
}
```

## ❓ Troubleshooting

### User is null after login
- Ensure middleware is running (updates session cookies)
- Check browser console for auth errors
- Verify Supabase keys in `.env.local`

### User context not available
- Make sure component is marked with `'use client'`
- Component must be inside `UserProvider`
- Use the `useUser` hook, not `UserContext` directly

### Session lost on refresh
- Middleware.ts must be set up correctly
- Check that Supabase cookies are being set
- Verify `NEXT_PUBLIC_SUPABASE_*` environment variables

## 📞 Related Files

- `lib/auth/actions.ts` - Auth server actions (login, logout)
- `middleware.ts` - Session refresh on every request
- `utils/supabase/server.ts` - Server-side Supabase client
- `utils/supabase/client.ts` - Client-side Supabase client
- `app/(auth)/callback/route.ts` - OAuth callback handler
