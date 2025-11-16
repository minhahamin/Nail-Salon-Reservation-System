'use client';
import { useState } from "react";
import { formatTimeRange } from "@/lib/format";
import { Booking } from "@/lib/types";

export default function MyPage() {
	const [phone, setPhone] = useState("");
	const [bookingId, setBookingId] = useState("");
	const [list, setList] = useState<Booking[]>([]);
	const [detail, setDetail] = useState<Booking | undefined>();
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);

	const fetchByPhone = async () => {
		setMessage("");
		setDetail(undefined);
		setLoading(true);
		const res = await fetch(`/api/bookings?phone=${encodeURIComponent(phone)}`);
		if (res.ok) {
			const data: Booking[] = await res.json();
			setList(data);
			if (data.length === 0) setMessage("해당 연락처로 등록된 예약이 없습니다.");
		} else {
			setMessage("조회 중 오류가 발생했습니다.");
		}
		setLoading(false);
	};

	const fetchById = async () => {
		setMessage("");
		setLoading(true);
		const res = await fetch("/api/bookings", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ bookingId, customerPhone: phone }),
		});
		if (res.ok) {
			const data: Booking = await res.json();
			setDetail(data);
		} else {
			setDetail(undefined);
			setMessage("예약을 찾을 수 없습니다.");
		}
		setLoading(false);
	};

	const cancel = async (b: Booking) => {
		const res = await fetch("/api/bookings", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ bookingId: b.id, customerPhone: b.customerPhone }),
		});
		if (res.ok) {
			setMessage("예약이 취소되었습니다.");
			await fetchByPhone();
			if (detail?.id === b.id) setDetail(undefined);
		} else {
			setMessage("취소 중 오류가 발생했습니다.");
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 p-6 text-black">
			<div className="mx-auto max-w-3xl space-y-6">
				<h1 className="text-2xl font-semibold">마이페이지</h1>
				<div className="rounded border bg-white/70 p-4">
					<div className="mb-2 text-sm font-medium">내 예약 조회</div>
					<div className="grid gap-3 sm:grid-cols-2">
						<input
							className="w-full rounded border px-3 py-2 text-black"
							placeholder="연락처 (예: 01012345678)"
							value={phone}
							onChange={e => setPhone(e.target.value)}
						/>
						<input
							className="w-full rounded border px-3 py-2 text-black"
							placeholder="예약번호 (선택)"
							value={bookingId}
							onChange={e => setBookingId(e.target.value)}
						/>
					</div>
					<div className="mt-3 flex gap-2">
						<button className="rounded bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black" onClick={fetchByPhone} disabled={!phone || loading}>
							연락처로 전체 조회
						</button>
						<button className="rounded bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-800" onClick={fetchById} disabled={!phone || !bookingId || loading}>
							예약번호로 조회
						</button>
					</div>
					{message && <div className="mt-2 text-sm">{message}</div>}
				</div>

				{detail && (
					<div className="space-y-2 rounded border bg-white/70 p-4">
						<div className="text-sm font-medium">선택된 예약</div>
						<div className="text-sm">{formatTimeRange(detail.startISO, detail.endISO)}</div>
						<div className="text-xs text-black/70">ID: {detail.id} · {detail.designerId}</div>
						<div className="flex gap-2">
							<a className="rounded border px-2 py-1 text-xs hover:bg-gray-100" href={`/api/bookings/${detail.id}/ics`} target="_blank">.ics</a>
							<button className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700" onClick={() => cancel(detail)}>취소</button>
						</div>
					</div>
				)}

				{list.length > 0 && (
					<div className="space-y-2 rounded border bg-white/70 p-4">
						<div className="text-sm font-medium">내 예약 목록 ({list.length})</div>
						{list.map(b => (
							<div key={b.id} className="flex items-center justify-between rounded border p-2 text-sm">
								<div>
									<div className="font-medium">{formatTimeRange(b.startISO, b.endISO)}</div>
									<div className="text-xs text-black/70">ID: {b.id} · {b.designerId}</div>
								</div>
								<div className="flex gap-2">
									<a className="rounded border px-2 py-1 text-xs hover:bg-gray-100" href={`/api/bookings/${b.id}/ics`} target="_blank">.ics</a>
									<button className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700" onClick={() => cancel(b)}>취소</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}


