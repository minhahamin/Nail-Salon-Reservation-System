'use client';
import DesignerSelect from "@/components/DesignerSelect";
import ServiceSelect from "@/components/ServiceSelect";
import SlotRecommendations from "@/components/SlotRecommendations";
import { services } from "@/lib/data";
import { sumDurationMinutes } from "@/lib/slots";
import { AvailabilityResponse, Booking } from "@/lib/types";
import { formatPriceKRW, formatTimeRange } from "@/lib/format";
import { useState } from "react";
import Calendar from "@/components/Calendar";
import { BUFFER_MINUTES, MIN_LEAD_HOURS, MAX_LEAD_DAYS } from "@/lib/config";


export default function BookingPage() {
	const [designerId, setDesignerId] = useState<string>();
	const [serviceIds, setServiceIds] = useState<string[]>([]);
	const [dateISO, setDateISO] = useState<string>(new Date().toISOString());
	const [availability, setAvailability] = useState<AvailabilityResponse>();
	const [picked, setPicked] = useState<{ startISO: string; endISO: string }>();
	const [created, setCreated] = useState<Booking>();
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [customerName, setCustomerName] = useState<string>("");
	const [customerPhone, setCustomerPhone] = useState<string>("");
	const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
	const [agreePrivacy, setAgreePrivacy] = useState<boolean>(false);
	const [reminderOptIn, setReminderOptIn] = useState<boolean>(true);
	const totalDuration = sumDurationMinutes(serviceIds.map(id => services.find(s => s.id === id)?.durationMinutes || 0));

	const handleCheck = async () => {
		if (!designerId || totalDuration <= 0) {
			setAvailability(undefined);
			return;
		}
		setPicked(undefined);
		setError("");
		setLoading(true);
		const res = await fetch("/api/availability", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				designerId,
				dateISO,
				totalDurationMinutes: totalDuration,
				bufferMinutes: BUFFER_MINUTES,
				minLeadHours: MIN_LEAD_HOURS,
				maxLeadDays: MAX_LEAD_DAYS,
			}),
		});
		if (res.ok) {
			const data: AvailabilityResponse = await res.json();
			setAvailability(data);
		} else {
			setAvailability(undefined);
			try {
				const msg = (await res.json())?.message ?? "가용성 조회 중 오류가 발생했습니다.";
				setError(msg);
			} catch {
				setError("가용성 조회 중 오류가 발생했습니다.");
			}
		}
		setLoading(false);
	};

	const handlePick = (startISO: string, endISO: string) => {
		setPicked({ startISO, endISO });
	};

	const handleConfirm = async () => {
		if (!designerId || !picked || serviceIds.length === 0) return;
		setSubmitting(true);
		const res = await fetch("/api/bookings", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				designerId,
				startISO: picked.startISO,
				endISO: picked.endISO,
				serviceIds,
				customerName,
				customerPhone,
				agreedTerms: agreeTerms,
				agreedPrivacy: agreePrivacy,
				reminderOptIn,
			}),
		});
		if (res.ok) {
			const booking: Booking = await res.json();
			setCreated(booking);
			setServiceIds([]);
			setPicked(undefined);
			setCustomerName("");
			setCustomerPhone("");
			setAgreeTerms(false);
			setAgreePrivacy(false);
			setReminderOptIn(true);
			// 최신 가용성 갱신
			handleCheck();
		} else {
			try {
				const data = await res.json();
				const msg = data?.message || "예약 생성 중 오류가 발생했습니다.";
				alert(msg);
			} catch {
				alert("예약 생성 중 오류가 발생했습니다.");
			}
		}
		setSubmitting(false);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
			<div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-8">
				<div className="text-center space-y-2 mb-8">
					<h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
						네일샵 예약
					</h1>
					<p className="text-gray-600 text-sm">원하시는 디자이너와 시간을 선택해주세요</p>
				</div>
				
				{created && (
					<div className="relative overflow-hidden rounded-2xl border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-lg animate-in fade-in slide-in-from-top-4">
						<div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
						<div className="relative">
							<div className="flex items-center gap-2 mb-3">
								<div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
									<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
								</div>
								<div className="text-xl font-bold text-gray-800">예약이 완료되었습니다</div>
							</div>
							<div className="space-y-2 text-sm text-gray-700">
								<div className="flex items-center gap-2">
									<span className="text-gray-500">시간:</span>
									<span className="font-semibold text-gray-900">{formatTimeRange(created.startISO, created.endISO)}</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-gray-500">디자이너:</span>
									<span className="font-semibold text-gray-900">{created.designerId}</span>
								</div>
							</div>
							<div className="mt-4 p-3 rounded-lg bg-white/60 text-xs text-gray-600">
								예약 정보를 변경하거나 취소가 필요하시면 매장으로 문의해주세요.
							</div>
							<button
								type="button"
								className="mt-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
								onClick={() => setCreated(undefined)}
							>
								확인
							</button>
						</div>
					</div>
				)}
				
				<div className="grid gap-8">
					<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
						<DesignerSelect selectedDesignerId={designerId} onChange={setDesignerId} dateISO={dateISO} />
					</div>
					
					<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
						<ServiceSelect selectedServiceIds={serviceIds} onChange={setServiceIds} />
					</div>
					
					<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
						<label className="block text-sm font-semibold text-gray-700 mb-3">예약 날짜</label>
						<Calendar designerId={designerId} dateISO={dateISO} onChange={setDateISO} />
					</div>
					
					<div className="rounded-2xl bg-gradient-to-r from-pink-100 to-purple-100 p-6 shadow-md border border-pink-200">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div className="flex items-center gap-3">
								<div className="h-12 w-12 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
									<svg className="h-6 w-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div>
									<div className="text-xs text-gray-600">예상 소요 시간</div>
									<div className="text-lg font-bold text-gray-800">{totalDuration}분</div>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="h-12 w-12 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
									<svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div>
									<div className="text-xs text-gray-600">총 예상 금액</div>
									<div className="text-lg font-bold text-gray-800">
										{formatPriceKRW(
											serviceIds.reduce((sum, id) => sum + (services.find(s => s.id === id)?.price || 0), 0)
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
					
					<button
						type="button"
						onClick={handleCheck}
						className="w-full rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
						disabled={!designerId || serviceIds.length === 0}
					>
						예약 가능한 시간 확인하기
					</button>
					
					<SlotRecommendations data={availability} onPick={handlePick} selected={picked} isLoading={loading} error={error} />



				{picked && (
					<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
						<div className="flex items-center gap-3 pb-4 border-b border-gray-200">
							<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
								<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</div>
							<div>
								<div className="text-xs text-gray-500 font-medium">선택된 시간</div>
								<div className="text-lg font-bold text-gray-800">{formatTimeRange(picked.startISO, picked.endISO)}</div>
							</div>
						</div>
						
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="mb-2 block text-sm font-semibold text-gray-700">이름</label>
								<input
									className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
									value={customerName}
									onChange={e => setCustomerName(e.target.value)}
									placeholder="홍길동"
								/>
							</div>
							<div>
								<label className="mb-2 block text-sm font-semibold text-gray-700">연락처</label>
								<input
									className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
									value={customerPhone}
									onChange={e => setCustomerPhone(e.target.value)}
									placeholder="010-0000-0000"
								/>
							</div>
						</div>
						
						<div className="rounded-xl bg-gradient-to-br from-gray-50 to-pink-50 p-5 border border-gray-200">
							<div className="flex items-center gap-2 mb-4">
								<svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
								<div className="text-sm font-semibold text-gray-800">취소/변경 정책</div>
							</div>
							<ul className="space-y-2 text-xs text-gray-600 mb-5">
								<li className="flex items-start gap-2">
									<span className="text-pink-500 mt-1">•</span>
									<span>예약 시간 2시간 전까지 무료 변경/취소 가능합니다.</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-pink-500 mt-1">•</span>
									<span>무단 노쇼 또는 지각 15분 초과 시 예약 자동 취소될 수 있습니다.</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-pink-500 mt-1">•</span>
									<span>고객 보호를 위해 연락처는 예약 확인/리마인드에만 사용됩니다.</span>
								</li>
							</ul>
							<div className="space-y-3">
								<label className="flex items-center gap-3 p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors cursor-pointer">
									<input 
										type="checkbox" 
										checked={agreeTerms} 
										onChange={e => setAgreeTerms(e.target.checked)}
										className="h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
									/>
									<span className="text-sm text-gray-700">이용약관에 동의합니다.</span>
								</label>
								<label className="flex items-center gap-3 p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors cursor-pointer">
									<input 
										type="checkbox" 
										checked={agreePrivacy} 
										onChange={e => setAgreePrivacy(e.target.checked)}
										className="h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
									/>
									<span className="text-sm text-gray-700">개인정보 처리방침에 동의합니다.</span>
								</label>
								<label className="flex items-center gap-3 p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors cursor-pointer">
									<input 
										type="checkbox" 
										checked={reminderOptIn} 
										onChange={e => setReminderOptIn(e.target.checked)}
										className="h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
									/>
									<span className="text-sm text-gray-700">방문 전 리마인드 알림 수신에 동의합니다. (알림톡/문자, 추후 연동)</span>
								</label>
							</div>
						</div>
						
						<button
							type="button"
							onClick={handleConfirm}
							className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
							disabled={!customerName || !customerPhone || !agreeTerms || !agreePrivacy || submitting}
						>
							{submitting ? (
								<span className="flex items-center justify-center gap-2">
									<svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									처리 중...
								</span>
							) : (
								"예약 확정하기"
							)}
						</button>
					</div>
				)}
				</div>
			</div>
		</div>
	);
}




