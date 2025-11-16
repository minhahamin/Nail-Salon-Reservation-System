export function toMinutes(time: string): number {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
}

export function fromMinutes(totalMinutes: number): string {
	const h = Math.floor(totalMinutes / 60)
		.toString()
		.padStart(2, "0");
	const m = (totalMinutes % 60).toString().padStart(2, "0");
	return `${h}:${m}`;
}

export function addMinutes(date: Date, minutes: number): Date {
	return new Date(date.getTime() + minutes * 60000);
}

export function setTime(date: Date, hhmm: string): Date {
	const clone = new Date(date);
	const [h, m] = hhmm.split(":").map(Number);
	clone.setHours(h, m, 0, 0);
	return clone;
}

export function isSameDay(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatLocalISO(date: Date): string {
	// 로컬 타임존 기준 ISO 문자열
	const tzOffset = date.getTimezoneOffset() * 60000;
	return new Date(date.getTime() - tzOffset).toISOString().slice(0, -1);
}


