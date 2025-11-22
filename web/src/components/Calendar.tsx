'use client';
import { useEffect, useMemo, useState } from "react";
import { formatLocalISO, setTime } from "@/lib/time";

type MonthData = Record<number, { bookings: number; blocks: number; breaks: number }>;

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

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return (
		<div className="rounded-2xl bg-white/90 backdrop-blur-sm p-5 shadow-lg border border-pink-100">
			{/* 헤더 */}
			<div className="mb-4 flex items-center justify-between">
				<button
					className="h-9 w-9 rounded-lg border-2 border-gray-200 bg-white flex items-center justify-center hover:border-pink-400 hover:bg-pink-50 transition-all hover:scale-105"
					onClick={() => goto(-1)}
					type="button"
				>
					<svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<div className="flex items-center gap-2">
					<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
						<svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
					<div className="text-lg font-bold text-gray-800">
						{cursor.y}년 {cursor.m}월
					</div>
				</div>
				<button
					className="h-9 w-9 rounded-lg border-2 border-gray-200 bg-white flex items-center justify-center hover:border-pink-400 hover:bg-pink-50 transition-all hover:scale-105"
					onClick={() => goto(1)}
					type="button"
				>
					<svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>

			{/* 요일 헤더 */}
			<div className="grid grid-cols-7 gap-2 mb-2">
				{["일", "월", "화", "수", "목", "금", "토"].map((d, idx) => {
					const isWeekend = idx === 0 || idx === 6;
					return (
						<div
							key={d}
							className={`py-2 text-center text-xs font-semibold ${
								isWeekend ? "text-red-500" : "text-gray-600"
							}`}
						>
							{d}
						</div>
					);
				})}
			</div>

			{/* 날짜 그리드 */}
			<div className="grid grid-cols-7 gap-2">
				{cells.map(cell => {
					if (!cell.day) return <div key={cell.key} />;
					const count = days[cell.day];
					const cellDate = new Date(cursor.y, cursor.m - 1, cell.day);
					cellDate.setHours(0, 0, 0, 0);
					const isPast = cellDate < today;
					const isToday = cellDate.getTime() === today.getTime();
					const isSelected =
						selected.getFullYear() === cursor.y && selected.getMonth() + 1 === cursor.m && selected.getDate() === cell.day;
					const dayOfWeek = cellDate.getDay();
					const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

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
							className={`relative h-16 rounded-lg border-2 transition-all ${
								isPast
									? "cursor-not-allowed opacity-30 bg-gray-50 border-gray-100"
									: isSelected
										? "border-pink-600 bg-gradient-to-br from-pink-100 to-pink-200 shadow-md ring-2 ring-pink-200 scale-105"
										: isToday
											? "border-blue-400 bg-blue-50 hover:border-pink-400 hover:bg-pink-50 hover:shadow-sm"
											: "border-gray-200 bg-white hover:border-pink-400 hover:bg-pink-50 hover:shadow-sm"
							}`}
						>
							<div className="flex flex-col items-center justify-center h-full">
								{/* 날짜 숫자 */}
								<div
									className={`text-sm font-semibold mb-0.5 ${
										isPast
											? "text-gray-400"
											: isSelected
												? "text-pink-700"
												: isToday
													? "text-blue-600"
													: isWeekend
														? "text-red-500"
														: "text-gray-800"
									}`}
								>
									{cell.day}
								</div>

								{/* 오늘 표시 */}
								{isToday && !isSelected && (
									<div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
								)}

								{/* 예약/차단/브레이크 정보 */}
								{count && !isPast && (
									<div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
										{count.bookings > 0 && (
											<div 
												className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-green-100 border border-green-300"
												title={`예약 ${count.bookings}개`}
											>
												<div className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
												<span className="text-[10px] font-semibold text-green-700 leading-none">{count.bookings}</span>
											</div>
										)}
										{count.blocks > 0 && (
											<div 
												className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-orange-100 border border-orange-300"
												title={`차단 ${count.blocks}개`}
											>
												<div className="h-1.5 w-1.5 rounded-full bg-orange-500 flex-shrink-0" />
												<span className="text-[10px] font-semibold text-orange-700 leading-none">{count.blocks}</span>
											</div>
										)}
										{count.breaks > 0 && (
											<div 
												className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-pink-100 border border-pink-300"
												title={`브레이크타임 ${count.breaks}개`}
											>
												<div className="h-1.5 w-1.5 rounded-full bg-pink-500 flex-shrink-0" />
												<span className="text-[10px] font-semibold text-pink-700 leading-none">{count.breaks}</span>
											</div>
										)}
									</div>
								)}

								{/* 선택 체크 아이콘 */}
								{isSelected && (
									<div className="absolute top-1 right-1">
										<div className="h-4 w-4 rounded-full bg-pink-600 flex items-center justify-center">
											<svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
											</svg>
										</div>
									</div>
								)}
							</div>
						</button>
					);
				})}
			</div>

			{/* 범례 */}
			{(Object.keys(days).length > 0 || true) && (
				<div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-3 text-xs text-gray-600 flex-wrap">
					<div className="flex items-center gap-1.5">
						<div className="h-2 w-2 rounded-full bg-green-500" />
						<span>예약</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="h-2 w-2 rounded-full bg-orange-400" />
						<span>차단</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="h-2 w-2 rounded-full bg-pink-500" />
						<span>브레이크</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="h-2 w-2 rounded-full bg-blue-500" />
						<span>오늘</span>
					</div>
				</div>
			)}
		</div>
	);
}



