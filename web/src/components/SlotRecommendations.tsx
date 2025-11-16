import { AvailabilityResponse } from "@/lib/types";

type Props = {
	data?: AvailabilityResponse;
	onPick: (startISO: string, endISO: string) => void;
	selected?: { startISO: string; endISO: string };
};

export default function SlotRecommendations({ data, onPick, selected }: Props) {
	if (!data) return null;
	const available = data.slots.filter(s => s.isAvailable).slice(0, 12);

	return (
		<div className="space-y-2">
			<label className="block text-sm font-medium text-black">예약 가능한 슬롯 추천</label>
			{available.length === 0 ? (
				<div className="text-sm text-black">선택하신 조건에 맞는 슬롯이 없습니다.</div>
			) : (
				<div className="grid grid-cols-3 gap-2">
					{available.map(slot => {
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
			)}
		</div>
	);
}


