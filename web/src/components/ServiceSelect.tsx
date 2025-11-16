import { services } from "@/lib/data";
import { Service } from "@/lib/types";
import { formatPriceKRW } from "@/lib/format";

type Props = {
	selectedServiceIds: string[];
	onChange: (serviceIds: string[]) => void;
};

export default function ServiceSelect({ selectedServiceIds, onChange }: Props) {
	const toggle = (id: string) => {
		if (selectedServiceIds.includes(id)) {
			onChange(selectedServiceIds.filter(s => s !== id));
		} else {
			onChange([...selectedServiceIds, id]);
		}
	};

	return (
		<div className="space-y-2">
			<label className="block text-sm font-medium text-black">시술 메뉴 선택</label>
			<div className="grid grid-cols-2 gap-2">
				{services.map((s: Service) => {
					const selected = selectedServiceIds.includes(s.id);
					return (
						<button
							key={s.id}
							type="button"
							onClick={() => toggle(s.id)}
							className={`rounded border px-3 py-2 text-left text-black ${selected ? "border-pink-500 bg-pink-50" : ""}`}
							aria-pressed={selected}
						>
							<div className="font-medium text-black">{s.name}</div>
							<div className="text-xs text-gray-700">{Math.round(s.durationMinutes)}분 · {formatPriceKRW(s.price)}</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}


