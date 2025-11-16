import { designers } from "@/lib/data";
import { Designer } from "@/lib/types";

type Props = {
	selectedDesignerId?: string;
	onChange: (designerId: string) => void;
};

export default function DesignerSelect({ selectedDesignerId, onChange }: Props) {
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
				{designers.map((d: Designer) => (
					<option key={d.id} value={d.id}>
						{d.name} ({d.specialties.join(", ")})
					</option>
				))}
			</select>
		</div>
	);
}


