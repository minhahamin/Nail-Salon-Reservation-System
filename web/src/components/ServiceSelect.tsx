import { services } from "@/lib/data";
import { Service } from "@/lib/types";
import { formatPriceKRW } from "@/lib/format";

type Props = {
	selectedServiceIds: string[];
	onChange: (serviceIds: string[]) => void;
};

function getCategoryIcon(category: string) {
	switch (category) {
		case "basic":
			return (
				<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
				</svg>
			);
		case "art":
			return (
				<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
				</svg>
			);
		case "care":
			return (
				<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
				</svg>
			);
		case "removal":
			return (
				<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
				</svg>
			);
		default:
			return (
				<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
			);
	}
}

function getCategoryColor(category: string) {
	switch (category) {
		case "basic":
			return "from-blue-400 to-blue-600";
		case "art":
			return "from-purple-400 to-purple-600";
		case "care":
			return "from-pink-400 to-pink-600";
		case "removal":
			return "from-orange-400 to-orange-600";
		default:
			return "from-gray-400 to-gray-600";
	}
}

export default function ServiceSelect({ selectedServiceIds, onChange }: Props) {
	const toggle = (id: string) => {
		if (selectedServiceIds.includes(id)) {
			onChange(selectedServiceIds.filter(s => s !== id));
		} else {
			onChange([...selectedServiceIds, id]);
		}
	};

	return (
		<div className="space-y-3">
			<label className="block text-sm font-medium text-black">시술 메뉴 선택</label>
			<div className="grid grid-cols-2 gap-3">
				{services.map((s: Service) => {
					const selected = selectedServiceIds.includes(s.id);
					const categoryColor = getCategoryColor(s.category);
					return (
						<button
							key={s.id}
							type="button"
							onClick={() => toggle(s.id)}
							className={`relative rounded-lg border-2 p-4 transition-all hover:scale-105 ${
								selected
									? "border-pink-600 bg-pink-100 shadow-md"
									: "border-gray-300 bg-white hover:border-pink-400 hover:bg-pink-50"
							}`}
							aria-pressed={selected}
						>
							<div className="flex flex-col space-y-3">
								{/* 아이콘 */}
								<div
									className={`h-12 w-12 rounded-xl flex items-center justify-center text-white ${
										selected
											? `bg-gradient-to-br ${categoryColor}`
											: `bg-gradient-to-br ${categoryColor} opacity-70`
									}`}
								>
									{getCategoryIcon(s.category)}
								</div>
								
								{/* 시술 정보 */}
								<div className="text-left">
									<div className="font-semibold text-black mb-1">{s.name}</div>
									<div className="flex items-center gap-2 text-xs text-gray-600">
										<span className="flex items-center gap-1">
											<svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											{Math.round(s.durationMinutes)}분
										</span>
										<span>·</span>
										<span className="font-semibold text-pink-600">{formatPriceKRW(s.price)}</span>
									</div>
								</div>
							</div>
							
							{/* 선택 체크 아이콘 */}
							{selected && (
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
		</div>
	);
}


