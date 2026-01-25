'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const hasMounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

  if (!hasMounted) {
    return null
  }

  return <>{children}</>
}

