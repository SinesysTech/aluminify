"use client"

import { useState, useEffect, useCallback } from "react"

interface UseStreakDaysReturn {
  streakDays: number
  isLoading: boolean
  isError: boolean
}

export function useStreakDays(): UseStreakDaysReturn {
  const [streakDays, setStreakDays] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const fetchStreak = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)

    try {
      const response = await fetch("/api/dashboard/user")

      if (!response.ok) {
        throw new Error("Falha ao buscar dados de streak")
      }

      const result = await response.json()
      setStreakDays(result.data?.streakDays ?? 0)
    } catch (err) {
      console.error("Erro ao buscar streak:", err)
      setIsError(true)
      setStreakDays(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStreak()
  }, [fetchStreak])

  return { streakDays, isLoading, isError }
}
