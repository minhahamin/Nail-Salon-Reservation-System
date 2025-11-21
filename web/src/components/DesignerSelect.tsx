import { designers } from "@/lib/data";
import { Designer } from "@/lib/types";

type Props = {
	selectedDesignerId?: string;
	onChange: (designerId: string) => void;
	dateISO?: string; // 선택된 날짜
};

function getBlockInfo(designer: Designer, dateISO?: string): string {
	if (!designer.defaultBlocks || designer.defaultBlocks.length === 0) {
		return "";
	}
	if (!dateISO) {
		return "";
	}
	const selectedDate = new Date(dateISO).toISOString().slice(0, 10);
	const dateBlocks = designer.defaultBlocks.filter(b => b.date === selectedDate);
	if (dateBlocks.length === 0) {
		return "";
	}
	const blockTexts = dateBlocks.map(b => `${b.start}~${b.end}`).join(", ");
	return `차단: ${blockTexts}`;
}

export default function DesignerSelect({ selectedDesignerId, onChange, dateISO }: Props) {
	return (
		<div className="space-y-2">
			<label className="block text-sm font-medium text-black">디자이너 선택</label>
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				{designers.map((d: Designer) => {
					const isSelected = selectedDesignerId === d.id;
					const blockInfo = getBlockInfo(d, dateISO);
					return (
						<button
							key={d.id}
							type="button"
							onClick={() => onChange(d.id)}
							className={`relative rounded-lg border-2 p-4 transition-all hover:scale-105 ${
								isSelected
									? "border-pink-600 bg-pink-100 shadow-md"
									: "border-gray-300 bg-white hover:border-pink-400 hover:bg-pink-50"
							}`}
						>
							<div className="flex flex-col items-center space-y-2">
								{/* 이미지 또는 아바타 */}
								<div
									className={`h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
										isSelected ? "bg-pink-600" : "bg-gradient-to-br from-pink-400 to-pink-600"
									}`}
								>
									{d.name.charAt(0)}
								</div>
								<div className="text-center">
									<div className="font-semibold text-black">{d.name}</div>
									<div className="text-xs text-black/70 mt-1">{d.specialties.join(", ")}</div>
									{blockInfo && (
										<div className="text-xs text-red-600 mt-1 font-medium">{blockInfo}</div>
									)}
								</div>
							</div>
							{isSelected && (
								<div className="absolute top-2 right-2">
									<div className="h-5 w-5 rounded-full bg-pink-600 flex items-center justify-center">
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


