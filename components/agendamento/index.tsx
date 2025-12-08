'use client'

import { Calendar } from "@/components/calendar"; // Assuming this exists from the demo
import {
	type CalendarDate,
	getLocalTimeZone,
	getWeeksInMonth,
	today,
} from "@internationalized/date";
import type { DateValue } from "@react-aria/calendar";
import { useLocale } from "@react-aria/i18n";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { FormPanel } from "./form-panel";
import { LeftPanel } from "./left-panel";
import { RightPanel } from "./right-panel";

interface AgendamentoSchedulerProps {
    professorId: string;
}

export function AgendamentoScheduler({ professorId }: AgendamentoSchedulerProps) {
	const router = useRouter();
	const { locale } = useLocale();

	const searchParams = useSearchParams();
	const dateParam = searchParams.get("date");
	const slotParam = searchParams.get("slot");

	// Default timezone to local or hardcoded for now
	const [timeZone] = React.useState("America/Sao_Paulo"); 
	const [date, setDate] = React.useState(today(getLocalTimeZone()));
	const [focusedDate, setFocusedDate] = React.useState<CalendarDate | null>(
		date,
	);

	const weeksInMonth = getWeeksInMonth(focusedDate as DateValue, locale);

	const handleChangeDate = (date: DateValue) => {
		setDate(date as CalendarDate);
		const url = new URL(window.location.href);
		url.searchParams.set(
			"date",
			date.toDate(timeZone).toISOString().split("T")[0],
		);
        // Clear slot when date changes
        url.searchParams.delete("slot");
		router.push(url.toString());
	};

	const handleChangeAvailableTime = (slotIso: string) => {
        // Slot is already ISO string from RightPanel
		const url = new URL(window.location.href);
		url.searchParams.set("slot", slotIso);
		router.push(url.toString());
	};

	const showForm = !!dateParam && !!slotParam;

	return (
		<div className="w-full bg-background px-8 py-6 rounded-md max-w-max mx-auto border">
			<div className="flex gap-6">
				<LeftPanel
					showForm={showForm}
				/>
				{!showForm ? (
					<>
						<Calendar
							minValue={today(getLocalTimeZone())}
							defaultValue={today(getLocalTimeZone())}
							value={date}
							onChange={handleChangeDate}
							onFocusChange={(focused) => setFocusedDate(focused)}
						/>
						<RightPanel
							{...{ date, timeZone, weeksInMonth, handleChangeAvailableTime, professorId }}
						/>
					</>
				) : (
					<FormPanel professorId={professorId} />
				)}
			</div>
		</div>
	);
}
