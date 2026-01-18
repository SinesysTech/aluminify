'use client'

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalendarIcon, Clock4, Globe } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Timezone display name mapping
const TIMEZONE_NAMES: Record<string, string> = {
	'America/Sao_Paulo': 'BrasÃ­lia (GMT-3)',
	'America/New_York': 'Nova York (GMT-5)',
	'America/Los_Angeles': 'Los Angeles (GMT-8)',
	'Europe/London': 'Londres (GMT+0)',
	'Europe/Paris': 'Paris (GMT+1)',
	'UTC': 'UTC',
}

interface LeftPanelProps {
	showForm: boolean | null;
	timeZone: string;
	durationMinutes?: number;
}

export function LeftPanel({ showForm, timeZone, durationMinutes = 30 }: LeftPanelProps) {
	const locale = 'pt-BR';
	const searchParams = useSearchParams();
	const slotParam = searchParams.get("slot");
	const durationParam = searchParams.get("duration");

	// Use URL param if available, otherwise use prop
	const displayDuration = durationParam ? Number(durationParam) : durationMinutes;

	// Get readable timezone name
	const timezoneName = TIMEZONE_NAMES[timeZone] || timeZone;

	return (
		<div className="flex flex-col gap-4 w-[280px] border-r pr-6">
			<div className="grid gap-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="h-12 w-12 bg-gray-200 rounded-full border flex items-center justify-center text-xs text-gray-500">
							IMG
						</div>
					</TooltipTrigger>
					<TooltipContent>Professor</TooltipContent>
				</Tooltip>
				<p className="text-gray-11 text-sm font-semibold">Agendamento</p>
			</div>
			<div className="grid gap-3">
				<p className="text-gray-12 text-2xl font-bold">Sessao Individual</p>
				{showForm && slotParam && (
					<div className="flex text-gray-12">
						<CalendarIcon className="size-4 mr-2" />
						<div className="flex flex-col text-sm font-semibold">
							<p>
								{new Date(slotParam).toLocaleDateString(locale, {
									dateStyle: "full",
									timeZone
								})}
							</p>
							<p>
								{new Date(slotParam).toLocaleTimeString(locale, {
									timeStyle: "short",
									timeZone
								})}
							</p>
						</div>
					</div>
				)}
				<div className="flex items-center text-gray-12">
					<Clock4 className="size-4 mr-2" />
					<p className="text-sm font-semibold">{displayDuration} min</p>
				</div>
				<div className="flex items-center text-muted-foreground">
					<Globe className="size-3 mr-2" />
					<p className="text-xs">{timezoneName}</p>
				</div>
			</div>
		</div>
	);
}
