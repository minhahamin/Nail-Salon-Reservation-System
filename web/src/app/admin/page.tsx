'use client';
import { designers } from "@/lib/data";
import { setTime, formatLocalISO } from "@/lib/time";
import { useEffect, useMemo, useState } from "react";
import { formatTimeRange } from "@/lib/format";
import Calendar from "@/components/Calendar";

export default function AdminPage() {
	const [designerId, setDesignerId] = useState<string>(designers[0]?.id);
	const [dateISO, setDateISO] = useState<string>(new Date().toISOString());
	const [start, setStart] = useState<string>("12:00");
	const [end, setEnd] = useState<string>("13:00");
	const [reason, setReason] = useState<string>("");
	const [tab, setTab] = useState<"dashboard" | "bookings">("dashboard");
	const [searchPhone, setSearchPhone] = useState<string>("");
	const [bookingList, setBookingList] = useState<any[]>([]);
	const [adminMsg, setAdminMsg] = useState<string>("");
	const [rbWeekday, setRbWeekday] = useState<number>(1);
	const [rbStart, setRbStart] = useState<string>("12:00");
	const [rbEnd, setRbEnd] = useState<string>("12:30");
	const [breakStart, setBreakStart] = useState<string>("13:00");
	const [breakEnd, setBreakEnd] = useState<string>("14:00");
	const [designerBreaks, setDesignerBreaks] = useState<{
		breaks: { start: string; end: string }[];
		recurringBreaks: { weekday: number; start: string; end: string }[];
		defaultBlocks: { date: string; start: string; end: string; reason?: string }[];
	} | null>(null);

	const date = new Date(dateISO);
	const [list, setList] = useState<{ kind: "booking" | "block"; id?: string; startISO: string; endISO: string; label: string }[]>([]);

	const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];

	const loadDesignerBreaks = async () => {
		if (!designerId) return;
		const res = await fetch(`/api/admin/recurring-breaks?designerId=${encodeURIComponent(designerId)}`);
		if (res.ok) {
			const data = await res.json();
			setDesignerBreaks(data);
		}
	};

	const loadDayData = async () => {
			if (!designerId) return;
			const res = await fetch(`/api/admin/day?designerId=${encodeURIComponent(designerId)}&date=${dateISO.slice(0, 10)}`);
			if (res.ok) {
				const data = await res.json();
				const items = [
					...data.bookings.map((b: any) => ({
						kind: "booking" as const,
					id: b.id,
						startISO: b.startISO,
						endISO: b.endISO,
						label: `예약 ${new Date(b.startISO).toLocaleDateString()} ${formatTimeRange(b.startISO, b.endISO)}`,
					})),
					...data.blocks.map((b: any) => ({
						kind: "block" as const,
					id: b.id,
						startISO: b.startISO,
						endISO: b.endISO,
						label: `차단 ${new Date(b.startISO).toLocaleDateString()} ${formatTimeRange(b.startISO, b.endISO)}${b.reason ? " · " + b.reason : ""}`,
					})),
				].sort((a, b) => a.startISO.localeCompare(b.startISO));
				setList(items);
			} else {
				setList([]);
			}
		};

	useEffect(() => {
		loadDayData();
		loadDesignerBreaks();
	}, [designerId, dateISO]);

	const addBlock = async () => {
		if (!designerId) return;
		const s = setTime(new Date(dateISO), start).toISOString();
		const e = setTime(new Date(dateISO), end).toISOString();
		const res = await fetch("/api/admin/blocks", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ designerId, startISO: s, endISO: e, reason }),
		});
		if (res.ok) {
			location.reload();
		} else {
			alert("차단 등록 실패");
		}
	};

	const logout = async () => {
		await fetch("/api/admin/login", { method: "DELETE" });
		location.href = "/admin/login";
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
			<div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-8">
			<div className="flex items-center justify-between">
					<div>
						<h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
							관리자
						</h1>
						<p className="text-gray-600 text-sm mt-1">예약 및 스케줄 관리</p>
					</div>
					<button 
						className="rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105" 
						onClick={logout}
					>
					로그아웃
				</button>
			</div>
				
				<div className="flex gap-3">
					<button 
						onClick={() => setTab("dashboard")} 
						className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
							tab === "dashboard" 
								? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg" 
								: "bg-white/80 text-gray-700 hover:bg-white border border-gray-200"
						}`}
					>
					대시보드
				</button>
					<button 
						onClick={() => setTab("bookings")} 
						className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
							tab === "bookings" 
								? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg" 
								: "bg-white/80 text-gray-700 hover:bg-white border border-gray-200"
						}`}
					>
						예약 관리
				</button>
			</div>
				
				<div className="grid gap-6 sm:grid-cols-3">
					<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-4 shadow-lg border border-pink-100">
						<label className="block text-sm font-semibold text-gray-700 mb-2">디자이너 선택</label>
						<select 
							className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none" 
							value={designerId} 
							onChange={e => setDesignerId(e.target.value)}
						>
					{designers.map(d => (
						<option key={d.id} value={d.id}>
							{d.name}
						</option>
					))}
				</select>
					</div>
					<div className="sm:col-span-2 rounded-2xl bg-white/80 backdrop-blur-sm p-4 shadow-lg border border-pink-100">
						<label className="block text-sm font-semibold text-gray-700 mb-2">예약 날짜</label>
					<Calendar designerId={designerId || undefined} dateISO={dateISO} onChange={setDateISO} />
				</div>
			</div>

			{tab === "dashboard" && (
				<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
					<div className="flex items-center gap-3 mb-4">
						<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
							<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
						<div className="text-lg font-semibold text-gray-800">일정 관리</div>
					</div>
					<div className="space-y-3">
					{list.length === 0 ? (
							<div className="text-center py-8 text-gray-500">표시할 항목이 없습니다.</div>
					) : (
						list.map((item, idx) => (
							<div
								key={idx}
									className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 ${
										item.kind === "booking" 
											? "border-green-300 bg-gradient-to-r from-green-50 to-emerald-50" 
											: "border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50"
									} hover:shadow-md transition-all`}
								>
									<span className="font-medium text-gray-800">{item.label}</span>
									{item.kind === "block" && item.id && (
										<button
											className="ml-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md transition-all hover:scale-105"
											onClick={async () => {
												if (!confirm("차단시간을 삭제하시겠습니까?")) return;
												const res = await fetch("/api/admin/blocks", {
													method: "DELETE",
													headers: { "Content-Type": "application/json" },
													body: JSON.stringify({ blockId: item.id }),
												});
												if (res.ok) {
													loadDayData();
												} else {
													alert("삭제 중 오류가 발생했습니다.");
												}
											}}
										>
											삭제
										</button>
									)}
							</div>
						))
					)}
				</div>
				</div>
			)}

			{tab === "dashboard" && (
				<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
					<div className="flex items-center gap-3 mb-4">
						<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
							<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
							</svg>
						</div>
						<div className="text-lg font-semibold text-gray-800">차단 시간 추가</div>
					</div>
					<div className="grid gap-4 sm:grid-cols-[auto_minmax(140px,auto)_auto_minmax(140px,auto)_1fr_auto] items-end">
						<div className="text-sm font-semibold text-gray-700">시간</div>
						<input className="w-full min-w-[140px] rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none" type="time" value={start} onChange={e => setStart(e.target.value)} />
						<span className="px-2 text-sm font-medium text-gray-600">~</span>
						<input className="w-full min-w-[140px] rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none" type="time" value={end} onChange={e => setEnd(e.target.value)} />
						<input className="rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none" placeholder="사유(선택)" value={reason} onChange={e => setReason(e.target.value)} />
						<button className="rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105" onClick={addBlock}>
							추가
						</button>
					</div>
				</div>
			)}

			{tab === "dashboard" && (
				<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
					<div className="flex items-center gap-3 mb-4">
						<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
							<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div className="text-lg font-semibold text-gray-800">브레이크타임 추가</div>
					</div>
					<div className="grid gap-4 sm:grid-cols-[auto_minmax(140px,auto)_auto_minmax(140px,auto)_auto] items-end">
						<div className="text-sm font-semibold text-gray-700">시간</div>
						<input className="w-full min-w-[140px] rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none" type="time" value={breakStart} onChange={e => setBreakStart(e.target.value)} />
						<span className="px-2 text-sm font-medium text-gray-600">~</span>
						<input className="w-full min-w-[140px] rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none" type="time" value={breakEnd} onChange={e => setBreakEnd(e.target.value)} />
						<button
							className="rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
							onClick={async () => {
								const res = await fetch("/api/admin/breaks", {
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({ designerId, start: breakStart, end: breakEnd }),
								});
								if (res.ok) {
									loadDesignerBreaks();
									setBreakStart("13:00");
									setBreakEnd("14:00");
								} else {
									alert("등록 실패");
								}
							}}
						>
							추가
						</button>
					</div>
				</div>
			)}

			{tab === "dashboard" && (
				<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
					<div className="flex items-center gap-3 mb-6">
						<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
							<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div className="text-lg font-semibold text-gray-800">디자이너별 브레이크타임 및 차단시간</div>
					</div>
					{designerBreaks ? (
						<div className="space-y-6">
							<div>
								<div className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-blue-500"></div>
									브레이크타임 (점심/휴식)
								</div>
								{designerBreaks.breaks.length === 0 ? (
									<div className="text-sm text-gray-500 py-3 px-4 rounded-xl bg-gray-50 border border-gray-200">설정된 브레이크타임이 없습니다.</div>
								) : (
									<div className="space-y-2">
										{designerBreaks.breaks.map((b, idx) => (
											<div key={idx} className="flex items-center justify-between rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 hover:shadow-md transition-all">
												<span className="font-medium text-gray-800">{b.start} ~ {b.end}</span>
												<button
													className="ml-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md transition-all hover:scale-105"
													onClick={async () => {
														if (!confirm("브레이크타임을 삭제하시겠습니까?")) return;
														const res = await fetch("/api/admin/breaks", {
															method: "DELETE",
															headers: { "Content-Type": "application/json" },
															body: JSON.stringify({ designerId, start: b.start, end: b.end }),
														});
														if (res.ok) {
															loadDesignerBreaks();
														} else {
															alert("삭제 중 오류가 발생했습니다.");
														}
													}}
												>
													삭제
												</button>
											</div>
										))}
									</div>
								)}
							</div>
							<div>
								<div className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-purple-500"></div>
									반복 브레이크 (매주 특정 요일)
								</div>
								{designerBreaks.recurringBreaks.length === 0 ? (
									<div className="text-sm text-gray-500 py-3 px-4 rounded-xl bg-gray-50 border border-gray-200">설정된 반복 브레이크가 없습니다.</div>
								) : (
									<div className="space-y-2">
										{designerBreaks.recurringBreaks.map((rb, idx) => (
											<div key={idx} className="flex items-center justify-between rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 hover:shadow-md transition-all">
												<span className="font-medium text-gray-800">
													매주 {weekdayNames[rb.weekday]}요일 {rb.start} ~ {rb.end}
												</span>
												<button
													className="ml-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md transition-all hover:scale-105"
													onClick={async () => {
														if (!confirm("반복 브레이크를 삭제하시겠습니까?")) return;
														const res = await fetch("/api/admin/recurring-breaks", {
															method: "DELETE",
															headers: { "Content-Type": "application/json" },
															body: JSON.stringify({ designerId, weekday: rb.weekday, start: rb.start, end: rb.end }),
														});
														if (res.ok) {
															loadDesignerBreaks();
														} else {
															alert("삭제 중 오류가 발생했습니다.");
														}
													}}
												>
													삭제
												</button>
											</div>
										))}
									</div>
								)}
							</div>
							<div>
								<div className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-orange-500"></div>
									기본 차단시간 (특정 날짜)
								</div>
								{designerBreaks.defaultBlocks.length === 0 ? (
									<div className="text-sm text-gray-500 py-3 px-4 rounded-xl bg-gray-50 border border-gray-200">설정된 기본 차단시간이 없습니다.</div>
								) : (
									<div className="space-y-2">
										{designerBreaks.defaultBlocks.map((db, idx) => (
											<div key={idx} className="rounded-xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 text-sm font-medium text-gray-800">
												{db.date} {db.start} ~ {db.end} {db.reason ? `(${db.reason})` : ""}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					) : (
						<div className="text-center py-8 text-gray-500">로딩 중...</div>
					)}
				</div>
			)}

			{tab === "dashboard" && (
				<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
					<div className="flex items-center gap-3 mb-4">
						<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
							<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						</div>
						<div className="text-lg font-semibold text-gray-800">반복 브레이크 추가</div>
					</div>
					<div className="grid gap-4 sm:grid-cols-[auto_auto_auto_auto_auto] items-end">
						<select className="rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none" value={rbWeekday} onChange={e => setRbWeekday(Number(e.target.value))}>
							<option value={0}>일</option>
							<option value={1}>월</option>
							<option value={2}>화</option>
							<option value={3}>수</option>
							<option value={4}>목</option>
							<option value={5}>금</option>
							<option value={6}>토</option>
						</select>
						<input className="rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none" type="time" value={rbStart} onChange={e => setRbStart(e.target.value)} />
						<span className="px-2 text-sm font-medium text-gray-600">~</span>
						<input className="rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none" type="time" value={rbEnd} onChange={e => setRbEnd(e.target.value)} />
						<button
							className="rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
							onClick={async () => {
								const res = await fetch("/api/admin/recurring-breaks", {
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({ designerId, weekday: rbWeekday, start: rbStart, end: rbEnd }),
								});
								if (res.ok) {
									loadDesignerBreaks();
									setRbStart("12:00");
									setRbEnd("12:30");
								} else {
									alert("등록 실패");
								}
							}}
						>
							추가
						</button>
					</div>
				</div>
			)}

			{tab === "bookings" && (
				<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
					<div className="flex items-center gap-3 mb-4">
						<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
							<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<div className="text-lg font-semibold text-gray-800">예약 조회</div>
					</div>
					<div className="grid gap-3 sm:grid-cols-[1fr_auto]">
						<input
							className="rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
							placeholder="연락처 입력(예: 01012345678)"
							value={searchPhone}
							onChange={e => setSearchPhone(e.target.value)}
						/>
						<button
							className="rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
							onClick={async () => {
								setAdminMsg("");
								const query = new URLSearchParams({ phone: searchPhone, designerId: designerId || "" }).toString();
								const res = await fetch(`/api/bookings?${query}`);
								if (res.ok) {
									const data = await res.json();
									setBookingList(data);
									if (data.length === 0) setAdminMsg("검색 결과가 없습니다.");
								} else {
									setAdminMsg("조회 중 오류가 발생했습니다.");
								}
							}}
						>
							조회
						</button>
					</div>
					{adminMsg && (
						<div className={`mt-4 p-3 rounded-xl text-sm ${
							adminMsg.includes("오류") || adminMsg.includes("없습니다")
								? "bg-red-50 text-red-700 border border-red-200"
								: "bg-green-50 text-green-700 border border-green-200"
						}`}>
							{adminMsg}
						</div>
					)}
					<div className="mt-6 space-y-3">
						{bookingList.map(b => (
							<div key={b.id} className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-gradient-to-r from-white to-gray-50 p-4 hover:border-pink-300 hover:shadow-md transition-all">
								<div>
									<div className="font-semibold text-gray-800">{formatTimeRange(b.startISO, b.endISO)}</div>
									<div className="text-xs text-gray-500 mt-1">ID: {b.id} · 디자이너: {b.designerId} · {b.customerName}</div>
								</div>
								<div className="flex gap-2">
									<a
										className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
										href={`/api/bookings/${b.id}/ics`}
										target="_blank"
									>
										.ics
									</a>
									<button
										className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md transition-all hover:scale-105"
										onClick={async () => {
											const res = await fetch("/api/bookings", {
												method: "DELETE",
												headers: { "Content-Type": "application/json" },
												body: JSON.stringify({ bookingId: b.id, customerPhone: b.customerPhone }),
											});
											if (res.ok) {
												setBookingList(prev => prev.filter(x => x.id !== b.id));
											} else {
												alert("취소 중 오류가 발생했습니다.");
											}
										}}
									>
										취소
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
			</div>
		</div>
	);
}


