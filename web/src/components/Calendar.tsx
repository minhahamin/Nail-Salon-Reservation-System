'use client';
import { useEffect, useMemo, useState } from "react";
import { formatLocalISO, setTime } from "@/lib/time";

type MonthData = Record<number, { bookings: number; blocks: number }>;

type Props = {
	designerId?: string;
	dateISO: string; // selected date (local ISO)
	onChange: (dateISO: string) => void;
};

export default function Calendar({ designerId, dateISO, onChange }: Props) {
	const selected = new Date(dateISO);
	const [cursor, setCursor] = useState<{ y: number; m: number }>({ y: selected.getFullYear(), m: selected.getMonth() + 1 });
	const [days, setDays] = useState<MonthData>({});

	useEffect(() => {
		const load = async () => {
			if (!designerId) {
				setDays({});
				return;
			}
			const res = await fetch(`/api/admin/month?designerId=${encodeURIComponent(designerId)}&year=${cursor.y}&month=${cursor.m}`);
			if (res.ok) {
				const data = await res.json();
				setDays(data.days || {});
			} else {
				setDays({});
			}
		};
		load();
	}, [designerId, cursor.y, cursor.m]);

	const firstDay = useMemo(() => new Date(cursor.y, cursor.m - 1, 1), [cursor]);
	const lastDate = useMemo(() => new Date(cursor.y, cursor.m, 0).getDate(), [cursor]);
	const leading = (firstDay.getDay() + 7) % 7;
	const cells = useMemo(() => {
		const arr: { key: string; day?: number }[] = [];
		for (let i = 0; i < leading; i++) arr.push({ key: `e-${i}` });
		for (let d = 1; d <= lastDate; d++) arr.push({ key: `d-${d}`, day: d });
		return arr;
	}, [leading, lastDate]);

	const goto = (offset: number) => {
		const d = new Date(cursor.y, cursor.m - 1 + offset, 1);
		setCursor({ y: d.getFullYear(), m: d.getMonth() + 1 });
	};

	return (
		<div className="rounded border bg-white/70 p-3 text-black">
			<div className="mb-2 flex items-center justify-between">
				<button className="rounded border px-2 py-1 text-sm hover:bg-gray-100" onClick={() => goto(-1)}>이전</button>
				<div className="text-sm font-medium">
					{cursor.y}년 {cursor.m}월
				</div>
				<button className="rounded border px-2 py-1 text-sm hover:bg-gray-100" onClick={() => goto(1)}>다음</button>
			</div>
			<div className="grid grid-cols-7 gap-1 text-center text-xs">
				{["일", "월", "화", "수", "목", "금", "토"].map(d => (
					<div key={d} className="py-1 font-medium">
						{d}
					</div>
				))}
				{cells.map(cell => {
					if (!cell.day) return <div key={cell.key} />;
					const count = days[cell.day];
					const cellDate = new Date(cursor.y, cursor.m - 1, cell.day);
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					cellDate.setHours(0, 0, 0, 0);
					const isPast = cellDate < today;
					const isSelected =
						selected.getFullYear() === cursor.y && selected.getMonth() + 1 === cursor.m && selected.getDate() === cell.day;
					return (
						<button
							key={cell.key}
							type="button"
							disabled={isPast}
							onClick={() => {
								if (isPast) return;
								const local = setTime(new Date(cursor.y, cursor.m - 1, cell.day), "00:00");
								onChange(formatLocalISO(local));
							}}
							className={`h-12 rounded border text-sm ${
								isPast
									? "cursor-not-allowed opacity-40 bg-gray-100"
									: isSelected
										? "border-pink-600 bg-pink-200"
										: "hover:bg-gray-100"
							}`}
						>
							<div>{cell.day}</div>
							{count && (
								<div className="mt-0.5 text-[10px]">
									{count.bookings ? <span className="text-green-700">예약 {count.bookings}</span> : null}
									{count.blocks ? <span className="ml-1 text-gray-700">차단 {count.blocks}</span> : null}
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}



