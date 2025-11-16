'use client';
import DesignerSelect from "@/components/DesignerSelect";
import ServiceSelect from "@/components/ServiceSelect";
import SlotRecommendations from "@/components/SlotRecommendations";
import { services } from "@/lib/data";
import { sumDurationMinutes } from "@/lib/slots";
import { AvailabilityResponse, Booking } from "@/lib/types";
import { formatPriceKRW, formatTimeRange } from "@/lib/format";
import { useState } from "react";
import { BUFFER_MINUTES, MIN_LEAD_HOURS, MAX_LEAD_DAYS } from "@/lib/config";

export default function BookingPage() {
	const [designerId, setDesignerId] = useState<string>();
	const [serviceIds, setServiceIds] = useState<string[]>([]);
	const [dateISO, setDateISO] = useState<string>(new Date().toISOString());
	const [availability, setAvailability] = useState<AvailabilityResponse>();
	const [picked, setPicked] = useState<{ startISO: string; endISO: string }>();
	const [created, setCreated] = useState<Booking>();
	const [customerName, setCustomerName] = useState<string>("");
	const [customerPhone, setCustomerPhone] = useState<string>("");
	const totalDuration = sumDurationMinutes(serviceIds.map(id => services.find(s => s.id === id)?.durationMinutes || 0));

	const handleCheck = async () => {
		if (!designerId || totalDuration <= 0) {
			setAvailability(undefined);
			return;
		}
		setPicked(undefined);
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
		}
	};

	const handlePick = (startISO: string, endISO: string) => {
		setPicked({ startISO, endISO });
	};

	const handleConfirm = async () => {
		if (!designerId || !picked || serviceIds.length === 0) return;
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
			}),
		});
		if (res.ok) {
			const booking: Booking = await res.json();
			setCreated(booking);
			setServiceIds([]);
			setPicked(undefined);
			setCustomerName("");
			setCustomerPhone("");
			// 최신 가용성 갱신
			handleCheck();
		} else {
			alert("예약 생성 중 오류가 발생했습니다.");
		}
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
				<DesignerSelect selectedDesignerId={designerId} onChange={setDesignerId} />
				<ServiceSelect selectedServiceIds={serviceIds} onChange={setServiceIds} />
				<div className="space-y-2">
					<label className="block text-sm font-medium text-black">예약 날짜</label>
					<input
						type="date"
						className="w-full rounded border px-3 py-2 text-black"
						value={new Date(dateISO).toISOString().slice(0, 10)}
						onChange={e => {
							const d = new Date(e.target.value + "T00:00:00");
							setDateISO(d.toISOString());
						}}
					/>
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
				<SlotRecommendations data={availability} onPick={handlePick} selected={picked} />

				{/* 내 예약 조회/취소/변경 */}
				<UserBookingPanel />

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
						<button
							type="button"
							onClick={handleConfirm}
							className="w-full rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
							disabled={!customerName || !customerPhone}
						>
							예약 확정
						</button>
					</div>
				)}
				</div>
			</div>
		</div>
	);
}

// 내 예약 조회/취소/변경 패널
function UserBookingPanel() {
	const [bookingId, setBookingId] = useState<string>("");
	const [phone, setPhone] = useState<string>("");
	const [booking, setBooking] = useState<Booking>();
	const [message, setMessage] = useState<string>("");

	const lookup = async () => {
		setMessage("");
		const res = await fetch("/api/bookings", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ bookingId, customerPhone: phone }),
		});
		if (res.ok) {
			const data: Booking = await res.json();
			setBooking(data);
		} else {
			setBooking(undefined);
			setMessage("예약을 찾을 수 없습니다.");
		}
	};

	const cancel = async () => {
		if (!booking) return;
		const res = await fetch("/api/bookings", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ bookingId: booking.id, customerPhone: phone }),
		});
		if (res.ok) {
			setMessage("예약이 취소되었습니다.");
			setBooking(undefined);
		} else {
			setMessage("취소 중 오류가 발생했습니다.");
		}
	};

	return (
		<div className="space-y-3 rounded border p-3">
			<div className="font-medium text-black">내 예약 조회/취소</div>
			<div className="grid gap-3 sm:grid-cols-2">
				<input
					className="w-full rounded border px-3 py-2 text-black"
					placeholder="예약번호 (예: bk-...)"
					value={bookingId}
					onChange={e => setBookingId(e.target.value)}
				/>
				<input
					className="w-full rounded border px-3 py-2 text-black"
					placeholder="연락처 (예: 010-0000-0000)"
					value={phone}
					onChange={e => setPhone(e.target.value)}
				/>
			</div>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={lookup}
					className="rounded bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-black"
				>
					조회
				</button>
				{booking && (
					<button
						type="button"
						onClick={cancel}
						className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
					>
						예약 취소
					</button>
				)}
			</div>
			{booking && (
				<div className="text-sm text-black">
					예약 시간: <span className="font-medium">{formatTimeRange(booking.startISO, booking.endISO)}</span>
					<div className="text-xs text-black/70">디자이너: {booking.designerId}</div>
				</div>
			)}
			{message && <div className="text-sm text-black">{message}</div>}
		</div>
	);
}


