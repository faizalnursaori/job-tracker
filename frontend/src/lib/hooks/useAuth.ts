'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!session
  const user = session?.user

  const logout = useCallback(async () => {
    // Clear backend token
    localStorage.removeItem('authToken')
    
    // Sign out from NextAuth
    await signOut({ redirect: false })
    
    // Redirect to sign in page
    router.push('/auth/signin')
  }, [router])

  const getAuthToken = useCallback(() => {
    return localStorage.getItem('authToken')
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    getAuthToken,
    session,
  }
} 