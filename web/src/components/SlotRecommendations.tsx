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

function getPeriodIcon(period: "오전" | "오후" | "저녁") {
	switch (period) {
		case "오전":
			return (
				<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
			);
		case "오후":
			return (
				<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
			);
		case "저녁":
			return (
				<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
				</svg>
			);
	}
}

function getPeriodColor(period: "오전" | "오후" | "저녁") {
	switch (period) {
		case "오전":
			return "from-yellow-400 to-orange-500";
		case "오후":
			return "from-blue-400 to-blue-600";
		case "저녁":
			return "from-purple-400 to-indigo-600";
	}
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

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	const getDuration = (start: Date, end: Date) => {
		const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
		return minutes;
	};

	return (
		<div className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-black mb-2">예약 가능한 시간</label>
				<p className="text-xs text-gray-500">
					기존 예약 및 차단 시간과 겹치지 않는 시간만 시간 순서대로 표시됩니다.
				</p>
			</div>
			
			{error ? (
				<div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3">
					<div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
						<svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
					<div className="text-sm text-red-800 font-medium">{error}</div>
				</div>
			) : isLoading ? (
				<div className="space-y-4">
					{(["오전", "오후", "저녁"] as const).map(period => (
						<div key={period} className="space-y-3">
							<div className="h-6 w-20 animate-pulse rounded-lg bg-gray-200" />
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={i} className="h-20 animate-pulse rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200" />
								))}
							</div>
						</div>
					))}
				</div>
			) : !data ? null : available.length === 0 ? (
				<div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 text-center">
					<div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3">
						<svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div className="text-sm font-medium text-gray-700">선택하신 조건에 맞는 예약 가능한 시간이 없습니다.</div>
					<div className="text-xs text-gray-500 mt-1">다른 날짜나 시간대를 선택해주세요.</div>
				</div>
			) : (
				<div className="space-y-5">
					{(["오전", "오후", "저녁"] as const).map(section => {
						const list = grouped[section] || [];
						const showCount = shown[section] ?? initialPerGroup;
						if (list.length === 0) return null;
						
						return (
							<div key={section} className="space-y-3">
								{/* 시간대 헤더 */}
								<div className="flex items-center gap-2">
									<div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${getPeriodColor(section)} flex items-center justify-center text-white shadow-sm`}>
										{getPeriodIcon(section)}
									</div>
									<div>
										<div className="font-semibold text-black">{section}</div>
										<div className="text-xs text-gray-500">{list.length}개의 시간대</div>
									</div>
								</div>
								
								{/* 슬롯 그리드 */}
								<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
									{list.slice(0, showCount).map(slot => {
										const start = new Date(slot.startISO);
										const end = new Date(slot.endISO);
										const duration = getDuration(start, end);
										const isSelected = selected && selected.startISO === slot.startISO && selected.endISO === slot.endISO;
										
										return (
											<button
												key={`${slot.startISO}-${slot.endISO}`}
												type="button"
												onClick={() => onPick(slot.startISO, slot.endISO)}
												className={`relative rounded-lg border-2 p-3 text-left transition-all hover:scale-105 ${
													isSelected
														? "border-pink-600 bg-pink-100 shadow-md ring-2 ring-pink-200"
														: "border-gray-200 bg-white hover:border-pink-400 hover:bg-pink-50 hover:shadow-sm"
												}`}
												aria-pressed={Boolean(isSelected)}
											>
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
														<span className="text-xs font-medium text-gray-500">{duration}분</span>
													</div>
													<div className="font-semibold text-black text-sm">
														{formatTime(start)}
													</div>
													<div className="text-xs text-gray-500">
														~ {formatTime(end)}
													</div>
												</div>
												
												{/* 선택 체크 아이콘 */}
												{isSelected && (
													<div className="absolute top-2 right-2">
														<div className="h-5 w-5 rounded-full bg-pink-600 flex items-center justify-center shadow-sm">
															<svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
															</svg>
														</div>
													</div>
												)}
											</button>
										);
									})}
								</div>
								
								{/* 더보기 버튼 */}
								{list.length > showCount && (
									<button
										type="button"
										className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-pink-400 hover:bg-pink-50 hover:text-pink-600 transition-colors flex items-center justify-center gap-2"
										onClick={() => setShown(prev => ({ ...prev, [section]: showCount + initialPerGroup }))}
									>
										<span>더보기 ({list.length - showCount}개 더)</span>
										<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
										</svg>
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


