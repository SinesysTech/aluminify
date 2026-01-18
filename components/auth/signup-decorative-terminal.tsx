'use client'

import { Check, ChevronRight, Loader2 } from 'lucide-react'

export function SignupDecorativeTerminal() {
  return (
    <div className="relative w-full max-w-md">
      {/* Glow Effect */}
      <div className="absolute -inset-4 rounded-full bg-blue-500 opacity-10 blur-[120px]" />

      {/* Terminal */}
      <div className="relative rounded-xl border border-gray-700 bg-[#0d1117] shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-800 bg-[#161b22] px-4 py-3">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="ml-2 font-mono text-xs text-gray-400">
            setup.sh â€” Aluminify CLI
          </span>
        </div>

        {/* Content */}
        <div className="p-4 font-mono text-sm">
          {/* Command */}
          <div className="flex items-center gap-2 text-gray-300">
            <ChevronRight className="h-4 w-4 text-green-500" />
            <span>aluminify init --cloud</span>
          </div>

          {/* Status Checks */}
          <div className="mt-4 space-y-2 text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Validating credentials...</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Provisioning database...</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Configuring storage bucket...</span>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
              <span className="text-yellow-400">Deploying edge functions...</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>CPU Usage</span>
              <span>42%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-gray-800">
              <div className="h-1 w-[42%] rounded-full bg-cyan-500" />
            </div>
          </div>

          {/* Ready Message */}
          <div className="mt-4 text-green-400">
            <span className="animate-pulse">â–‹</span>
          </div>
        </div>
      </div>
    </div>
  )
}
