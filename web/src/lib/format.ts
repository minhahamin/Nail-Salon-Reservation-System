export const krw = new Intl.NumberFormat("ko-KR", {
	style: "currency",
	currency: "KRW",
	maximumFractionDigits: 0,
});

export function formatPriceKRW(value: number): string {
	return krw.format(value);
}

export function formatTimeRange(startISO: string, endISO: string): string {
	const start = new Date(startISO);
	const end = new Date(endISO);
	return `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ~ ${end.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	})}`;
}


