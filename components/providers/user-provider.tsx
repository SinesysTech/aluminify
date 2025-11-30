'use client'

import { createContext, useContext, useMemo } from 'react'

import type { AppUser } from '@/types/user'

const UserContext = createContext<AppUser | null>(null)

export function UserProvider({
  user,
  children,
}: {
  user: AppUser
  children: React.ReactNode
}) {
  const value = useMemo(() => user, [user])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useCurrentUser() {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error('useCurrentUser must be used within a UserProvider')
  }

  return context
}











