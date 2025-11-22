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
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{services.map((s: Service) => {
					const selected = selectedServiceIds.includes(s.id);
					const categoryColor = getCategoryColor(s.category);
					return (
						<button
							key={s.id}
							type="button"
							onClick={() => toggle(s.id)}
							className={`relative rounded-lg border-2 p-4 transition-all hover:scale-[1.02] ${
								selected
									? "border-pink-600 bg-pink-50 shadow-md ring-2 ring-pink-200"
									: "border-gray-300 bg-white hover:border-pink-400 hover:bg-pink-50"
							}`}
							aria-pressed={selected}
						>
							<div className="flex items-center gap-4">
								{/* 아이콘 */}
								<div
									className={`h-14 w-14 flex-shrink-0 rounded-xl flex items-center justify-center text-white shadow-sm ${
										selected
											? `bg-gradient-to-br ${categoryColor}`
											: `bg-gradient-to-br ${categoryColor} opacity-70`
									}`}
								>
									{getCategoryIcon(s.category)}
								</div>
								
								{/* 시술 정보 - 아이콘 옆에 배치 */}
								<div className="flex-1 text-left min-w-0">
									<div className="font-semibold text-black mb-1.5 text-base">{s.name}</div>
									<div className="flex flex-col gap-1.5 text-sm">
										<div className="flex items-center gap-2 text-gray-600">
											<svg className="h-4 w-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span>소요시간: {Math.round(s.durationMinutes)}분</span>
										</div>
										<div className="flex items-center gap-2">
											<svg className="h-4 w-4 text-pink-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span className="font-bold text-pink-600 text-base">{formatPriceKRW(s.price)}</span>
										</div>
									</div>
								</div>
							</div>
							
							{/* 선택 체크 아이콘 */}
							{selected && (
								<div className="absolute top-3 right-3">
									<div className="h-6 w-6 rounded-full bg-pink-600 flex items-center justify-center shadow-sm">
										<svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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


