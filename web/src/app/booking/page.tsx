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
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200">
			<div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 text-black">
				<h1 className="text-2xl font-semibold text-black">네일샵 예약</h1>
				<div className="rounded border p-3 text-xs text-black/70">
					버퍼 {BUFFER_MINUTES}분 · 최소 리드타임 {MIN_LEAD_HOURS}시간 · 최대 {MAX_LEAD_DAYS}일 이내 예약 가능
				</div>
				{created && (
					<div className="rounded border border-green-600 bg-green-100 p-4 text-black">
						<div className="mb-1 text-lg font-semibold">예약이 완료되었습니다</div>
						<div className="text-sm">
							시간: <span className="font-medium">{formatTimeRange(created.startISO, created.endISO)}</span>
						</div>
						<div className="text-sm">
							디자이너: <span className="font-medium">{created.designerId}</span>
						</div>
						<div className="mt-2 text-xs text-black/70">
							예약 정보를 변경하거나 취소가 필요하시면 매장으로 문의해주세요.
						</div>
						<button
							type="button"
							className="mt-3 rounded bg-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
							onClick={() => setCreated(undefined)}
						>
							확인
						</button>
					</div>
				)}
				<div className="grid gap-6">
				<DesignerSelect selectedDesignerId={designerId} onChange={setDesignerId} dateISO={dateISO} />
				<ServiceSelect selectedServiceIds={serviceIds} onChange={setServiceIds} />
				<div className="space-y-2">
					<label className="block text-sm font-medium text-black">예약 날짜</label>
					<Calendar designerId={designerId} dateISO={dateISO} onChange={setDateISO} />
				</div>
				<div className="rounded border p-3 text-sm sm:flex sm:items-center sm:justify-between text-black">
					<div className="text-black">
						예상 소요 시간: <span className="font-medium">{totalDuration}분</span>
					</div>
					<div className="mt-2 sm:mt-0 text-black">
						총 예상 금액:{" "}
						<span className="font-medium">
							{formatPriceKRW(
								serviceIds.reduce((sum, id) => sum + (services.find(s => s.id === id)?.price || 0), 0)
							)}
						</span>
					</div>
				</div>
				<button
					type="button"
					onClick={handleCheck}
					className="w-full rounded bg-pink-600 px-4 py-2 font-medium text-white hover:bg-pink-700"
					disabled={!designerId || serviceIds.length === 0}
				>
					예약 가능한 슬롯 확인
				</button>
				<SlotRecommendations data={availability} onPick={handlePick} selected={picked} isLoading={loading} error={error} />



				{picked && (
					<div className="space-y-3 rounded border p-3 text-black">
						<div className="font-medium text-black">선택된 시간</div>
						<div className="text-sm text-black">{formatTimeRange(picked.startISO, picked.endISO)}</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<label className="mb-1 block text-sm text-black">이름</label>
								<input
									className="w-full rounded border px-3 py-2 text-black"
									value={customerName}
									onChange={e => setCustomerName(e.target.value)}
									placeholder="홍길동"
								/>
							</div>
							<div>
								<label className="mb-1 block text-sm text-black">연락처</label>
								<input
									className="w-full rounded border px-3 py-2 text-black"
									value={customerPhone}
									onChange={e => setCustomerPhone(e.target.value)}
									placeholder="010-0000-0000"
								/>
							</div>
						</div>
						<div className="space-y-2 rounded border p-3 bg-white/60">
							<div className="text-sm font-medium">취소/변경 정책</div>
							<ul className="list-disc pl-5 text-xs text-black/80">
								<li>예약 시간 2시간 전까지 무료 변경/취소 가능합니다.</li>
								<li>무단 노쇼 또는 지각 15분 초과 시 예약 자동 취소될 수 있습니다.</li>
								<li>고객 보호를 위해 연락처는 예약 확인/리마인드에만 사용됩니다.</li>
							</ul>
							<label className="mt-2 flex items-center gap-2 text-sm">
								<input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
								이용약관에 동의합니다.
							</label>
							<label className="flex items-center gap-2 text-sm">
								<input type="checkbox" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)} />
								개인정보 처리방침에 동의합니다.
							</label>
							<label className="flex items-center gap-2 text-sm">
								<input type="checkbox" checked={reminderOptIn} onChange={e => setReminderOptIn(e.target.checked)} />
								방문 전 리마인드 알림 수신에 동의합니다.(알림톡/문자, 추후 연동)
							</label>
						</div>
						<button
							type="button"
							onClick={handleConfirm}
							className="w-full rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
							disabled={!customerName || !customerPhone || !agreeTerms || !agreePrivacy || submitting}
						>
							{ submitting ? "처리 중..." : "예약 확정" }
						</button>
					</div>
				)}
				</div>
			</div>
		</div>
	);
}




