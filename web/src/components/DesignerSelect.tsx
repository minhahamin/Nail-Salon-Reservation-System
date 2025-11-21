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
	return ` [차단: ${blockTexts}]`;
}

export default function DesignerSelect({ selectedDesignerId, onChange, dateISO }: Props) {
	return (
		<div className="space-y-2">
			<label className="block text-sm font-medium text-black">디자이너 선택</label>
			<select
				className="w-full rounded border px-3 py-2 text-black"
				value={selectedDesignerId ?? ""}
				onChange={e => onChange(e.target.value)}
			>
				<option value="" disabled>
					디자이너를 선택하세요
				</option>
				{designers.map((d: Designer) => {
					const blockInfo = getBlockInfo(d, dateISO);
					return (
						<option key={d.id} value={d.id}>
							{d.name} ({d.specialties.join(", ")}){blockInfo}
						</option>
					);
				})}
			</select>
		</div>
	);
}


