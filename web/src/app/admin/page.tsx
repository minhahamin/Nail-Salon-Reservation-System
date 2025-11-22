'use client';
import { designers } from "@/lib/data";
import { setTime, formatLocalISO } from "@/lib/time";
import { useEffect, useMemo, useState } from "react";
import { formatTimeRange } from "@/lib/format";
import Calendar from "@/components/Calendar";
import { Designer, Booking, Block } from "@/lib/types";

export default function AdminPage() {
	const [designerId, setDesignerId] = useState<string>("");
	const [dateISO, setDateISO] = useState<string>(new Date().toISOString());
	const [start, setStart] = useState<string>("12:00");
	const [end, setEnd] = useState<string>("13:00");
	const [reason, setReason] = useState<string>("");
	const [tab, setTab] = useState<"dashboard" | "bookings" | "designers">("dashboard");
	const [designersList, setDesignersList] = useState<Designer[]>([]);
	const [editingDesigner, setEditingDesigner] = useState<Designer | null>(null);
	const [showDesignerForm, setShowDesignerForm] = useState<boolean>(false);
	const [designerForm, setDesignerForm] = useState({
		name: "",
		imageUrl: "",
		specialties: [] as string[],
		workHours: { weekday: [1, 2, 3, 4, 5], start: "10:00", end: "19:00" },
		dailyMaxAppointments: 8,
		dailyMaxMinutes: 480,
	});
	const [uploadingImage, setUploadingImage] = useState(false);
	const [searchPhone, setSearchPhone] = useState<string>("");
	const [bookingList, setBookingList] = useState<Booking[]>([]);
	const [adminMsg, setAdminMsg] = useState<string>("");
	const [breakStart, setBreakStart] = useState<string>("13:00");
	const [breakEnd, setBreakEnd] = useState<string>("14:00");
	const [isAllDayBlock, setIsAllDayBlock] = useState<boolean>(false);
	const [isAllDayBreak, setIsAllDayBreak] = useState<boolean>(false);
	const [isRecurringBreak, setIsRecurringBreak] = useState<boolean>(false);
	const [breakWeekday, setBreakWeekday] = useState<number>(1);
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
				const data = await res.json() as { 
					bookings: Array<Pick<Booking, 'id' | 'startISO' | 'endISO'>>; 
					blocks: Array<Pick<Block, 'id' | 'startISO' | 'endISO' | 'reason'>>;
				};
				const items = [
					...data.bookings.map((b) => ({
						kind: "booking" as const,
						id: b.id,
						startISO: b.startISO,
						endISO: b.endISO,
						label: `예약 ${new Date(b.startISO).toLocaleDateString()} ${formatTimeRange(b.startISO, b.endISO)}`,
					})),
					...data.blocks.map((b) => ({
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
		const actualStart = isAllDayBlock ? "00:00" : start;
		const actualEnd = isAllDayBlock ? "23:59" : end;
		const s = setTime(new Date(dateISO), actualStart).toISOString();
		const e = setTime(new Date(dateISO), actualEnd).toISOString();
		const res = await fetch("/api/admin/blocks", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ designerId, startISO: s, endISO: e, reason: isAllDayBlock ? (reason || "하루종일") : reason }),
		});
		if (res.ok) {
			setIsAllDayBlock(false);
			setStart("12:00");
			setEnd("13:00");
			setReason("");
			location.reload();
		} else {
			alert("차단 등록 실패");
		}
	};

	const logout = async () => {
		await fetch("/api/admin/login", { method: "DELETE" });
		location.href = "/admin/login";
	};

	const loadDesigners = async () => {
		const res = await fetch("/api/admin/designers");
		if (res.ok) {
			const data = await res.json();
			setDesignersList(data);
			// 디자이너 목록이 업데이트되면 첫 번째 디자이너 선택 (항상 업데이트)
			if (data.length > 0) {
				// 현재 선택된 디자이너가 목록에 없으면 첫 번째 디자이너 선택
				const currentDesignerExists = data.some((d: Designer) => d.id === designerId);
				if (!currentDesignerExists || !designerId) {
					setDesignerId(data[0].id);
				}
			}
		}
	};

	const handleCreateDesigner = async () => {
		const res = await fetch("/api/admin/designers", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(designerForm),
		});
		if (res.ok) {
			await loadDesigners();
			setShowDesignerForm(false);
			setDesignerForm({
				name: "",
				imageUrl: "",
				specialties: [],
				workHours: { weekday: [1, 2, 3, 4, 5], start: "10:00", end: "19:00" },
				dailyMaxAppointments: 8,
				dailyMaxMinutes: 480,
			});
		} else {
			alert("디자이너 추가 실패");
		}
	};

	const handleUpdateDesigner = async () => {
		if (!editingDesigner) return;
		const res = await fetch("/api/admin/designers", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...designerForm, id: editingDesigner.id }),
		});
		if (res.ok) {
			await loadDesigners();
			setEditingDesigner(null);
			setShowDesignerForm(false);
			setDesignerForm({
				name: "",
				imageUrl: "",
				specialties: [],
				workHours: { weekday: [1, 2, 3, 4, 5], start: "10:00", end: "19:00" },
				dailyMaxAppointments: 8,
				dailyMaxMinutes: 480,
			});
		} else {
			alert("디자이너 수정 실패");
		}
	};

	const handleDeleteDesigner = async (id: string) => {
		if (!confirm("정말로 이 디자이너를 삭제하시겠습니까?")) return;
		const res = await fetch("/api/admin/designers", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
		});
		if (res.ok) {
			await loadDesigners();
			if (designerId === id) {
				setDesignerId(designersList.find(d => d.id !== id)?.id || "");
			}
		} else {
			const data = await res.json();
			alert(data.message || "디자이너 삭제 실패");
		}
	};

	useEffect(() => {
		loadDesigners();
	}, []);

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
					<button 
						onClick={() => setTab("designers")} 
						className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
							tab === "designers" 
								? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg" 
								: "bg-white/80 text-gray-700 hover:bg-white border border-gray-200"
						}`}
					>
						디자이너 관리
				</button>
			</div>
				
				<div className="grid gap-6 sm:grid-cols-3">
					<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-4 shadow-lg border border-pink-100">
						<label className="block text-sm font-semibold text-gray-700 mb-2">디자이너 선택</label>
						<select 
							className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none" 
							value={designerId} 
							onChange={e => {
								console.log("디자이너 변경:", e.target.value);
								setDesignerId(e.target.value);
							}}
						>
							{designersList.length === 0 ? (
								<option value="">디자이너를 불러오는 중...</option>
							) : (
								designersList.map(d => (
									<option key={d.id} value={d.id}>
										{d.name}
									</option>
								))
							)}
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
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="allDayBlock"
								checked={isAllDayBlock}
								onChange={e => {
									setIsAllDayBlock(e.target.checked);
									if (e.target.checked) {
										setStart("00:00");
										setEnd("23:59");
									}
								}}
								className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
							/>
							<label htmlFor="allDayBlock" className="text-sm font-medium text-gray-700 cursor-pointer">
								하루종일
							</label>
						</div>
						<div className="grid gap-4 sm:grid-cols-[auto_minmax(140px,auto)_auto_minmax(140px,auto)_1fr_auto] items-end">
							<div className="text-sm font-semibold text-gray-700">시간</div>
							<input 
								className="w-full min-w-[140px] rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
								type="time" 
								value={start} 
								onChange={e => setStart(e.target.value)}
								disabled={isAllDayBlock}
							/>
							<span className="px-2 text-sm font-medium text-gray-600">~</span>
							<input 
								className="w-full min-w-[140px] rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
								type="time" 
								value={end} 
								onChange={e => setEnd(e.target.value)}
								disabled={isAllDayBlock}
							/>
							<input className="rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none" placeholder="사유(선택)" value={reason} onChange={e => setReason(e.target.value)} />
							<button className="rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105" onClick={addBlock}>
								추가
							</button>
						</div>
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
					<div className="space-y-4">
						{/* 적용 방식 선택 */}
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<input
									type="radio"
									id="breakDaily"
									name="breakType"
									checked={!isRecurringBreak}
									onChange={() => setIsRecurringBreak(false)}
									className="h-4 w-4 border-gray-300 text-pink-600 focus:ring-pink-500"
								/>
								<label htmlFor="breakDaily" className="text-sm font-medium text-gray-700 cursor-pointer">
									매일 적용
								</label>
							</div>
							<div className="flex items-center gap-2">
								<input
									type="radio"
									id="breakRecurring"
									name="breakType"
									checked={isRecurringBreak}
									onChange={() => setIsRecurringBreak(true)}
									className="h-4 w-4 border-gray-300 text-pink-600 focus:ring-pink-500"
								/>
								<label htmlFor="breakRecurring" className="text-sm font-medium text-gray-700 cursor-pointer">
									특정 요일만
								</label>
							</div>
						</div>

						{/* 요일 선택 (특정 요일만 선택 시) */}
						{isRecurringBreak && (
							<div className="flex items-center gap-2">
								<label className="text-sm font-semibold text-gray-700">요일</label>
								<select 
									className="rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
									value={breakWeekday} 
									onChange={e => setBreakWeekday(Number(e.target.value))}
								>
									<option value={0}>일요일</option>
									<option value={1}>월요일</option>
									<option value={2}>화요일</option>
									<option value={3}>수요일</option>
									<option value={4}>목요일</option>
									<option value={5}>금요일</option>
									<option value={6}>토요일</option>
								</select>
							</div>
						)}

						{/* 하루종일 체크박스 */}
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="allDayBreak"
								checked={isAllDayBreak}
								onChange={e => {
									setIsAllDayBreak(e.target.checked);
									if (e.target.checked) {
										setBreakStart("00:00");
										setBreakEnd("23:59");
									} else {
										// 체크 해제 시 기본값으로 리셋
										setBreakStart("13:00");
										setBreakEnd("14:00");
									}
								}}
								className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
							/>
							<label htmlFor="allDayBreak" className="text-sm font-medium text-gray-700 cursor-pointer">
								하루종일
							</label>
						</div>

						{/* 시간 입력 */}
						<div className="grid gap-4 sm:grid-cols-[auto_minmax(140px,auto)_auto_minmax(140px,auto)_auto] items-end">
							<div className="text-sm font-semibold text-gray-700">시간</div>
							<input 
								className="w-full min-w-[140px] rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
								type="time" 
								value={breakStart} 
								onChange={e => setBreakStart(e.target.value)}
								disabled={isAllDayBreak}
							/>
							<span className="px-2 text-sm font-medium text-gray-600">~</span>
							<input 
								className="w-full min-w-[140px] rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
								type="time" 
								value={breakEnd} 
								onChange={e => setBreakEnd(e.target.value)}
								disabled={isAllDayBreak}
							/>
							<button
								className="rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={!designerId}
								onClick={async () => {
									if (!designerId) {
										alert("디자이너를 선택해주세요.");
										return;
									}
									
									const actualStart = isAllDayBreak ? "00:00" : breakStart;
									const actualEnd = isAllDayBreak ? "23:59" : breakEnd;
									
									console.log("브레이크 추가:", { designerId, weekday: breakWeekday, start: actualStart, end: actualEnd, isRecurringBreak });
									
									let res;
									if (isRecurringBreak) {
										// 반복 브레이크 추가
										res = await fetch("/api/admin/recurring-breaks", {
											method: "POST",
											headers: { "Content-Type": "application/json" },
											body: JSON.stringify({ designerId, weekday: breakWeekday, start: actualStart, end: actualEnd }),
										});
									} else {
										// 매일 브레이크 추가
										res = await fetch("/api/admin/breaks", {
											method: "POST",
											headers: { "Content-Type": "application/json" },
											body: JSON.stringify({ designerId, start: actualStart, end: actualEnd }),
										});
									}
									
									if (res.ok) {
										loadDesignerBreaks();
										// 폼 리셋
										setBreakStart("13:00");
										setBreakEnd("14:00");
										setIsAllDayBreak(false);
										setIsRecurringBreak(false);
										setBreakWeekday(0); // 일요일로 초기화
									} else {
										const errorData = await res.json().catch(() => ({ message: "등록 실패" }));
										alert(errorData.message || "등록 실패");
									}
								}}
							>
								추가
							</button>
						</div>
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
										{designerBreaks.defaultBlocks.map((db, idx) => {
											// 해당 날짜와 시간에 맞는 Block ID 찾기
											const blockDate = new Date(`${db.date}T${db.start}:00`);
											const blockEndDate = new Date(`${db.date}T${db.end}:00`);
											const matchingBlock = list.find(
												item => item.kind === "block" && 
												new Date(item.startISO).getTime() === blockDate.getTime() &&
												new Date(item.endISO).getTime() === blockEndDate.getTime()
											);
											
											return (
												<div key={idx} className="flex items-center justify-between rounded-xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 hover:shadow-md transition-all">
													<span className="text-sm font-medium text-gray-800">
														{db.date} {db.start} ~ {db.end} {db.reason ? `(${db.reason})` : ""}
													</span>
													{matchingBlock?.id && (
														<button
															className="ml-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md transition-all hover:scale-105"
															onClick={async () => {
																if (!confirm("기본 차단시간을 삭제하시겠습니까?")) return;
																const res = await fetch("/api/admin/blocks", {
																	method: "DELETE",
																	headers: { "Content-Type": "application/json" },
																	body: JSON.stringify({ blockId: matchingBlock.id }),
																});
																if (res.ok) {
																	loadDesignerBreaks();
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
											);
										})}
									</div>
								)}
							</div>
						</div>
					) : (
						<div className="text-center py-8 text-gray-500">로딩 중...</div>
					)}
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

			{tab === "designers" && (
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
								<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
							<div className="text-lg font-semibold text-gray-800">디자이너 관리</div>
						</div>
						<div className="flex gap-2">
							{designersList.length === 0 && (
								<button
									onClick={async () => {
										const res = await fetch("/api/admin/designers/init", { method: "POST" });
										if (res.ok) {
											await loadDesigners();
											alert("초기 디자이너 데이터가 로드되었습니다.");
										} else {
											const data = await res.json();
											alert(data.message || "초기 데이터 로드 실패");
										}
									}}
									className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
								>
									초기 데이터 로드
								</button>
							)}
							<button
								onClick={() => {
									setEditingDesigner(null);
									setShowDesignerForm(true);
									setDesignerForm({
										name: "",
										imageUrl: "",
										specialties: [],
										workHours: { weekday: [1, 2, 3, 4, 5], start: "10:00", end: "19:00" },
										dailyMaxAppointments: 8,
										dailyMaxMinutes: 480,
									});
								}}
								className="rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
							>
								+ 디자이너 추가
							</button>
						</div>
					</div>

					{/* 디자이너 목록 */}
					<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
						{designersList.length === 0 ? (
							<div className="text-center py-8 text-gray-500">등록된 디자이너가 없습니다.</div>
						) : (
							<div className="space-y-3">
								{designersList.map(designer => (
									<div key={designer.id} className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-gradient-to-r from-white to-gray-50 p-4 hover:border-pink-300 hover:shadow-md transition-all">
										<div className="flex items-center gap-4 flex-1">
											{designer.imageUrl ? (
												<img
													src={designer.imageUrl}
													alt={designer.name}
													className="h-16 w-16 rounded-full object-cover border-2 border-gray-300"
													onError={(e) => {
														const target = e.target as HTMLImageElement;
														target.style.display = 'none';
													}}
												/>
											) : (
												<div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-xl font-bold text-white">
													{designer.name.charAt(0)}
												</div>
											)}
											<div>
												<div className="font-semibold text-gray-800">{designer.name}</div>
												<div className="text-xs text-gray-500 mt-1">
													전문분야: {designer.specialties.join(", ")} · 
													근무시간: {designer.workHours.start} ~ {designer.workHours.end} · 
													근무요일: {designer.workHours.weekday.map((w: number) => weekdayNames[w]).join(", ")}
												</div>
											</div>
										</div>
										<div className="flex gap-2">
											<button
												onClick={() => {
													setEditingDesigner(designer);
													setDesignerForm({
														name: designer.name,
														imageUrl: designer.imageUrl || "",
														specialties: designer.specialties,
														workHours: designer.workHours,
														dailyMaxAppointments: designer.dailyMaxAppointments || 8,
														dailyMaxMinutes: designer.dailyMaxMinutes || 480,
													});
													setShowDesignerForm(true);
												}}
												className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md transition-all hover:scale-105"
											>
												수정
											</button>
											<button
												onClick={() => handleDeleteDesigner(designer.id)}
												className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md transition-all hover:scale-105"
											>
												삭제
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* 디자이너 추가/수정 폼 */}
					{showDesignerForm && (
						<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
							<div className="flex items-center justify-between mb-4">
								<div className="text-lg font-semibold text-gray-800">
									{editingDesigner ? "디자이너 수정" : "디자이너 추가"}
								</div>
								<button
									onClick={() => {
										setShowDesignerForm(false);
										setEditingDesigner(null);
									}}
									className="text-gray-500 hover:text-gray-700"
								>
									✕
								</button>
							</div>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
									<input
										className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
										value={designerForm.name}
										onChange={e => setDesignerForm({ ...designerForm, name: e.target.value })}
										placeholder="디자이너 이름"
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">프로필 이미지</label>
									<div className="space-y-3">
										<input
											type="file"
											accept="image/*"
											className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
											onChange={async (e) => {
												const file = e.target.files?.[0];
												if (!file) return;

												setUploadingImage(true);
												try {
													const formData = new FormData();
													formData.append("file", file);

													const res = await fetch("/api/admin/upload", {
														method: "POST",
														body: formData,
													});

													if (res.ok) {
														const data = await res.json();
														setDesignerForm({ ...designerForm, imageUrl: data.imageUrl });
													} else {
														const error = await res.json();
														alert(error.message || "이미지 업로드 실패");
													}
												} catch (error) {
													console.error("Upload error:", error);
													alert("이미지 업로드 중 오류가 발생했습니다.");
												} finally {
													setUploadingImage(false);
												}
											}}
											disabled={uploadingImage}
										/>
										{uploadingImage && (
											<div className="text-sm text-gray-500">이미지 업로드 중...</div>
										)}
										{designerForm.imageUrl && (
											<div className="mt-2 flex items-center gap-4">
												<img
													src={designerForm.imageUrl}
													alt="프로필 미리보기"
													className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
													onError={(e) => {
														(e.target as HTMLImageElement).style.display = 'none';
													}}
												/>
												<button
													type="button"
													onClick={() => setDesignerForm({ ...designerForm, imageUrl: "" })}
													className="text-sm text-red-600 hover:text-red-700 font-medium"
												>
													이미지 제거
												</button>
											</div>
										)}
									</div>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">전문분야</label>
									<div className="flex flex-wrap gap-2">
										{["basic", "art", "care", "removal"].map(spec => (
											<label key={spec} className="flex items-center gap-2 cursor-pointer">
												<input
													type="checkbox"
													checked={designerForm.specialties.includes(spec)}
													onChange={e => {
														if (e.target.checked) {
															setDesignerForm({ ...designerForm, specialties: [...designerForm.specialties, spec] });
														} else {
															setDesignerForm({ ...designerForm, specialties: designerForm.specialties.filter(s => s !== spec) });
														}
													}}
													className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
												/>
												<span className="text-sm text-gray-700">
													{spec === "basic" ? "베이직" : spec === "art" ? "아트" : spec === "care" ? "케어" : "제거"}
												</span>
											</label>
										))}
									</div>
								</div>
								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">근무 시작 시간</label>
										<input
											type="time"
											className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
											value={designerForm.workHours.start}
											onChange={e => setDesignerForm({ ...designerForm, workHours: { ...designerForm.workHours, start: e.target.value } })}
										/>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">근무 종료 시간</label>
										<input
											type="time"
											className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
											value={designerForm.workHours.end}
											onChange={e => setDesignerForm({ ...designerForm, workHours: { ...designerForm.workHours, end: e.target.value } })}
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">근무 요일</label>
									<div className="flex flex-wrap gap-2">
										{weekdayNames.map((day, idx) => (
											<label key={idx} className="flex items-center gap-2 cursor-pointer">
												<input
													type="checkbox"
													checked={designerForm.workHours.weekday.includes(idx)}
													onChange={e => {
														const currentWeekdays = designerForm.workHours.weekday;
														if (e.target.checked) {
															setDesignerForm({
																...designerForm,
																workHours: {
																	...designerForm.workHours,
																	weekday: [...currentWeekdays, idx]
																}
															});
														} else {
															setDesignerForm({
																...designerForm,
																workHours: {
																	...designerForm.workHours,
																	weekday: currentWeekdays.filter(w => w !== idx)
																}
															});
														}
													}}
													className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
												/>
												<span className="text-sm text-gray-700">{day}</span>
											</label>
										))}
									</div>
								</div>
								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">일일 최대 예약 건수</label>
										<input
											type="number"
											className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
											value={designerForm.dailyMaxAppointments}
											onChange={e => setDesignerForm({ ...designerForm, dailyMaxAppointments: Number(e.target.value) })}
										/>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">일일 최대 근무 시간 (분)</label>
										<input
											type="number"
											className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
											value={designerForm.dailyMaxMinutes}
											onChange={e => setDesignerForm({ ...designerForm, dailyMaxMinutes: Number(e.target.value) })}
										/>
									</div>
								</div>
								<div className="flex gap-3">
									<button
										onClick={editingDesigner ? handleUpdateDesigner : handleCreateDesigner}
										className="flex-1 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
									>
										{editingDesigner ? "수정" : "추가"}
									</button>
									<button
										onClick={() => {
											setShowDesignerForm(false);
											setEditingDesigner(null);
										}}
										className="rounded-xl border-2 border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
									>
										취소
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
			</div>
		</div>
	);
}


