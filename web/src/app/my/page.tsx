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
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
			<div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-8">
				<div className="text-center space-y-2 mb-8">
					<h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
						마이페이지
					</h1>
					<p className="text-gray-600 text-sm">내 예약을 조회하고 관리하세요</p>
				</div>
				
				<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
					<div className="flex items-center gap-3 mb-4">
						<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
							<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<div className="text-lg font-semibold text-gray-800">내 예약 조회</div>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label className="mb-2 block text-sm font-semibold text-gray-700">연락처</label>
							<input
								className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
								placeholder="01012345678"
								value={phone}
								onChange={e => setPhone(e.target.value)}
							/>
						</div>
						<div>
							<label className="mb-2 block text-sm font-semibold text-gray-700">예약번호 (선택)</label>
							<input
								className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
								placeholder="예약번호 입력"
								value={bookingId}
								onChange={e => setBookingId(e.target.value)}
							/>
						</div>
					</div>
					<div className="mt-4 flex gap-3">
						<button 
							className="flex-1 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
							onClick={fetchByPhone} 
							disabled={!phone || loading}
						>
							{loading ? "조회 중..." : "연락처로 전체 조회"}
						</button>
						<button 
							className="flex-1 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
							onClick={fetchById} 
							disabled={!phone || !bookingId || loading}
						>
							예약번호로 조회
						</button>
					</div>
					{message && (
						<div className={`mt-4 p-3 rounded-xl text-sm ${
							message.includes("오류") || message.includes("없습니다") 
								? "bg-red-50 text-red-700 border border-red-200" 
								: "bg-green-50 text-green-700 border border-green-200"
						}`}>
							{message}
						</div>
					)}
				</div>

				{detail && (
					<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100 animate-in fade-in slide-in-from-bottom-4">
						<div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
							<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
								<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div>
								<div className="text-xs text-gray-500 font-medium">선택된 예약</div>
								<div className="text-lg font-bold text-gray-800">{formatTimeRange(detail.startISO, detail.endISO)}</div>
							</div>
						</div>
						<div className="text-xs text-gray-600 mb-4">ID: {detail.id} · 디자이너: {detail.designerId}</div>
						<div className="flex gap-3">
							<a 
								className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all text-center" 
								href={`/api/bookings/${detail.id}/ics`} 
								target="_blank"
							>
								📅 캘린더 추가 (.ics)
							</a>
							<button 
								className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105" 
								onClick={() => cancel(detail)}
							>
								예약 취소
							</button>
						</div>
					</div>
				)}

				{list.length > 0 && (
					<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-pink-100">
						<div className="flex items-center gap-3 mb-4">
							<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
								<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
								</svg>
							</div>
							<div className="text-lg font-semibold text-gray-800">내 예약 목록 ({list.length})</div>
						</div>
						<div className="space-y-3">
							{list.map(b => (
								<div key={b.id} className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-gradient-to-r from-white to-gray-50 p-4 hover:border-pink-300 hover:shadow-md transition-all">
									<div>
										<div className="font-semibold text-gray-800">{formatTimeRange(b.startISO, b.endISO)}</div>
										<div className="text-xs text-gray-500 mt-1">ID: {b.id} · 디자이너: {b.designerId}</div>
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
											onClick={() => cancel(b)}
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


