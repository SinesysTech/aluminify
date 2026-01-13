'use client'

import { Gauge } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function LoginDecorativeCard() {
  return (
    <Card className="w-full max-w-sm transform rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition-transform duration-500 hover:rotate-0 -rotate-2 gap-0">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
          <Gauge className="h-4 w-4 text-gray-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">System Status</span>
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 ml-4" />
        <span className="text-xs text-green-600">Operational</span>
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        {/* API Latency */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">API Latency</span>
            <span className="text-xs font-medium text-gray-700">45ms</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div className="h-1.5 w-[15%] rounded-full bg-green-500" />
          </div>
        </div>

        {/* Flashcards Today */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">Flashcards Today</span>
            <span className="text-xs font-medium text-gray-700">1,240,592</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div className="h-1.5 w-[78%] rounded-full bg-blue-500" />
          </div>
        </div>

        {/* Uptime */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">Uptime</span>
            <span className="text-xs font-medium text-gray-700">99.99%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div className="h-1.5 w-[99%] rounded-full bg-green-500" />
          </div>
        </div>
      </div>

      {/* Node ID */}
      <div className="mt-4 text-right">
        <span className="font-mono text-[10px] text-gray-400">node-br-south-01</span>
      </div>
    </Card>
  )
}
