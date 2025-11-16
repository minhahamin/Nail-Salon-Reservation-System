'use client';
import { designers, existingBookings, manualBlocks } from "@/lib/data";
import { isSameDay, setTime } from "@/lib/time";
import { useMemo, useState } from "react";
import { formatTimeRange } from "@/lib/format";

export default function AdminPage() {
	const [designerId, setDesignerId] = useState<string>(designers[0]?.id);
	const [dateISO, setDateISO] = useState<string>(new Date().toISOString());
	const [start, setStart] = useState<string>("12:00");
	const [end, setEnd] = useState<string>("13:00");
	const [reason, setReason] = useState<string>("");

	const date = new Date(dateISO);
	const list = useMemo(() => {
		const ds = designerId!;
		const items = [
			...existingBookings
				.filter(b => b.designerId === ds && isSameDay(new Date(b.startISO), date))
				.map(b => ({ kind: "booking" as const, startISO: b.startISO, endISO: b.endISO, label: `예약 ${formatTimeRange(b.startISO, b.endISO)}` })),
			...manualBlocks
				.filter(b => b.designerId === ds && isSameDay(new Date(b.startISO), date))
				.map(b => ({ kind: "block" as const, startISO: b.startISO, endISO: b.endISO, label: `차단 ${formatTimeRange(b.startISO, b.endISO)}${b.reason ? " · " + b.reason : ""}` })),
		].sort((a, b) => a.startISO.localeCompare(b.startISO));
		return items;
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

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 text-black p-6">
			<h1 className="text-2xl font-semibold">관리자 대시보드</h1>
			<div className="mt-4 grid gap-4 sm:grid-cols-3">
				<select className="rounded border px-3 py-2 text-black" value={designerId} onChange={e => setDesignerId(e.target.value)}>
					{designers.map(d => (
						<option key={d.id} value={d.id}>
							{d.name}
						</option>
					))}
				</select>
				<input
					type="date"
					className="rounded border px-3 py-2 text-black"
					value={new Date(dateISO).toISOString().slice(0, 10)}
					onChange={e => setDateISO(new Date(e.target.value + "T00:00:00").toISOString())}
				/>
				<div />
			</div>

			<div className="mt-6 rounded border bg-white/60 p-4">
				<div className="mb-2 text-sm font-medium">읽기용 캘린더(일)</div>
				<div className="space-y-2">
					{list.length === 0 ? (
						<div className="text-sm">표시할 항목이 없습니다.</div>
					) : (
						list.map((item, idx) => (
							<div
								key={idx}
								className={`rounded border px-3 py-2 text-sm ${item.kind === "booking" ? "border-green-600 bg-green-100" : "border-gray-600 bg-gray-100"}`}
							>
								{item.label}
							</div>
						))
					)}
				</div>
			</div>

			<div className="mt-6 rounded border bg-white/60 p-4">
				<div className="mb-2 text-sm font-medium">차단 시간 블럭 추가</div>
				<div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_1fr_auto] items-center">
					<div className="text-sm">시간</div>
					<input className="rounded border px-3 py-2 text-black" type="time" value={start} onChange={e => setStart(e.target.value)} />
					<span className="px-2 text-sm">~</span>
					<input className="rounded border px-3 py-2 text-black" type="time" value={end} onChange={e => setEnd(e.target.value)} />
					<input className="rounded border px-3 py-2 text-black sm:col-span-2" placeholder="사유(선택)" value={reason} onChange={e => setReason(e.target.value)} />
					<button className="rounded bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-black" onClick={addBlock}>
						추가
					</button>
				</div>
			</div>
		</div>
	);
}


