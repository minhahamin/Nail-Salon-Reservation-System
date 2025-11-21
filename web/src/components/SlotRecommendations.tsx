import { AvailabilityResponse } from "@/lib/types";
import { useMemo, useState } from "react";

type Props = {
	data?: AvailabilityResponse;
	onPick: (startISO: string, endISO: string) => void;
	selected?: { startISO: string; endISO: string };
	isLoading?: boolean;
	error?: string;
	initialPerGroup?: number;
};

function periodOf(date: Date): "오전" | "오후" | "저녁" {
	const h = date.getHours();
	if (h < 12) return "오전";
	if (h < 18) return "오후";
	return "저녁";
}

export default function SlotRecommendations({ data, onPick, selected, isLoading, error, initialPerGroup = 6 }: Props) {
	const [shown, setShown] = useState<Record<string, number>>({});
	// Hooks는 조건부로 호출하지 않도록, 데이터 유무와 무관하게 미리 계산 가능한 값으로 두고 렌더 단계에서 분기한다.
	const available = (data?.slots ?? []).filter(s => s.isAvailable);
	const grouped = useMemo(() => {
		const g: Record<string, typeof available> = { 오전: [], 오후: [], 저녁: [] };
		available.forEach(s => {
			const start = new Date(s.startISO);
			g[periodOf(start)].push(s);
		});
		return g;
	}, [available]);

	return (
		<div className="space-y-2">
			<label className="block text-sm font-medium text-black">예약 가능한 슬롯 추천</label>
			<p className="text-xs text-black/70">
				기존 예약 및 차단 시간과 겹치지 않는 시간만 시간 순서대로 표시됩니다.
			</p>
			{error ? (
				<div className="rounded border border-red-600 bg-red-100 p-3 text-sm text-black">{error}</div>
			) : isLoading ? (
				<div className="grid grid-cols-3 gap-2">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="h-10 animate-pulse rounded border bg-white/50" />
					))}
				</div>
			) : !data ? null : available.length === 0 ? (
				<div className="text-sm text-black">선택하신 조건에 맞는 슬롯이 없습니다.</div>
			) : (
				<div className="space-y-4">
					{(["오전", "오후", "저녁"] as const).map(section => {
						const list = grouped[section] || [];
						const showCount = shown[section] ?? initialPerGroup;
						return (
							<div key={section} className="space-y-2">
								<div className="text-sm font-medium text-black">{section}</div>
								<div className="grid grid-cols-3 gap-2">
									{list.slice(0, showCount).map(slot => {
										const start = new Date(slot.startISO);
										const end = new Date(slot.endISO);
										const label = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ~ ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
										const isSelected = selected && selected.startISO === slot.startISO && selected.endISO === slot.endISO;
										return (
											<button
												key={`${slot.startISO}-${slot.endISO}`}
												type="button"
												onClick={() => onPick(slot.startISO, slot.endISO)}
												className={`rounded border px-3 py-2 text-sm text-black transition-colors ${
													isSelected ? "border-pink-600 bg-pink-200" : "hover:bg-gray-50"
												}`}
												aria-pressed={Boolean(isSelected)}
											>
												{label}
											</button>
										);
									})}
								</div>
								{list.length > showCount && (
									<button
										type="button"
										className="text-sm text-black underline"
										onClick={() => setShown(prev => ({ ...prev, [section]: showCount + initialPerGroup }))}
									>
										더보기
									</button>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}


