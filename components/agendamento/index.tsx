'use client'

import { Calendar } from "@/components/ui/calendar";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { FormPanel } from "./form-panel";
import { LeftPanel } from "./left-panel";
import { RightPanel } from "./right-panel";
import { ptBR } from "date-fns/locale";

interface AgendamentoSchedulerProps {
    professorId: string;
}

export function AgendamentoScheduler({ professorId }: AgendamentoSchedulerProps) {
	const router = useRouter();

	const searchParams = useSearchParams();
	const dateParam = searchParams.get("date");
	const slotParam = searchParams.get("slot");
    console.log("Date:", dateParam, "Slot:", slotParam);

	// Default timezone to local or hardcoded for now
	const [timeZone] = React.useState("America/Sao_Paulo"); 
	
    // Initialize date from URL or undefined to avoid hydration mismatch
    // (server time != client time). We set 'today' in useEffect if no param.
    const initialDate = dateParam ? new Date(dateParam + 'T12:00:00') : undefined;
	const [date, setDate] = React.useState<Date | undefined>(initialDate);

    React.useEffect(() => {
        if (!date && !dateParam) {
            setDate(new Date());
        }
    }, [date, dateParam]);

	const handleChangeDate = (newDate: Date | undefined) => {
        if (!newDate) return;
		setDate(newDate);
		const url = new URL(window.location.href);
        // Format YYYY-MM-DD
		url.searchParams.set(
			"date",
			newDate.toISOString().split("T")[0],
		);
        // Clear slot when date changes
        url.searchParams.delete("slot");
		router.replace(url.toString(), { scroll: false });
	};

	const handleChangeAvailableTime = (slotIso: string) => {
        // Slot is already ISO string from RightPanel
		const url = new URL(window.location.href);
		url.searchParams.set("slot", slotIso);
		router.replace(url.toString(), { scroll: false });
	};

	const showForm = !!dateParam && !!slotParam;

	return (
		<div className="w-full bg-background px-8 py-6 rounded-md max-w-max mx-auto border">
			<div className="flex gap-6">
				<LeftPanel
					showForm={showForm}
                    timeZone={timeZone}
				/>
				{!showForm ? (
					<>
						<Calendar
							mode="single"
                            selected={date}
                            onSelect={handleChangeDate}
                            locale={ptBR}
                            className="rounded-md border"
						/>
                        {date && (
    						<RightPanel
	    						{...{ date, timeZone, handleChangeAvailableTime, professorId }}
		    				/>
                        )}
					</>
				) : (
					<FormPanel professorId={professorId} timeZone={timeZone} />
				)}
			</div>
		</div>
	);
}
