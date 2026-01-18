'use client'

import { SiGoogle, SiGithub } from '@icons-pack/react-simple-icons'

interface OAuthButtonsProps {
  onGoogleClick?: () => void
  onGithubClick?: () => void
  disabled?: boolean
}

export function OAuthButtons({
  onGoogleClick,
  onGithubClick,
  disabled,
}: OAuthButtonsProps) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onGoogleClick}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 py-2.5 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SiGoogle className="h-5 w-5" />
        <span className="text-sm font-medium text-gray-700">
          Continuar com Google Workspace
        </span>
      </button>

      <button
        type="button"
        onClick={onGithubClick}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 py-2.5 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SiGithub className="h-5 w-5" />
        <span className="text-sm font-medium text-gray-700">
          Continuar com GitHub
        </span>
      </button>
    </div>
  )
}
