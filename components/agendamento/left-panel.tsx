'use client'

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocale } from "@react-aria/i18n";
import { CalendarIcon, Clock4 } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface LeftPanelProps {
	showForm: boolean | null;
}

export function LeftPanel({ showForm }: LeftPanelProps) {
	const { locale } = useLocale();
	const searchParams = useSearchParams();
	const slotParam = searchParams.get("slot");

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
				<p className="text-gray-12 text-2xl font-bold">Sessão Individual</p>
				{showForm && slotParam && (
					<div className="flex text-gray-12">
						<CalendarIcon className="size-4 mr-2" />
						<div className="flex flex-col text-sm font-semibold">
							<p>
								{new Date(slotParam).toLocaleString(locale, {
									dateStyle: "full",
								})}
							</p>
							<p>
								{new Date(slotParam).toLocaleString(locale, {
									timeStyle: "short",
								})}
							</p>
						</div>
					</div>
				)}
				<div className="flex items-center text-gray-12">
					<Clock4 className="size-4 mr-2" />
					<p className="text-sm font-semibold">30 min</p>
				</div>
                <div className="flex items-center text-gray-12">
                     <p className="text-xs text-muted-foreground">Fuso horário: Local</p>
                </div>
			</div>
		</div>
	);
}
