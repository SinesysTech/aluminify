import { cn } from "@/lib/utils"

interface AluminifyLogoProps {
    className?: string
}

export function AluminifyLogo({ className }: AluminifyLogoProps) {
    return (
        <div className={cn("flex items-center justify-center", className)}>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
                A
            </div>
        </div>
    )
}
