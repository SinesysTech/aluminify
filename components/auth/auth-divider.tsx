import { cn } from '@/lib/utils'

interface AuthDividerProps {
  text?: string
  className?: string
}

export function AuthDivider({
  text = 'OU ENTRE COM SENHA',
  className,
}: AuthDividerProps) {
  return (
    <div className={cn('relative flex items-center py-2', className)}>
      <div className="flex-grow border-t border-gray-200" />
      <span className="mx-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {text}
      </span>
      <div className="flex-grow border-t border-gray-200" />
    </div>
  )
}
