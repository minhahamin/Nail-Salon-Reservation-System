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

/**
 * 전화번호를 하이픈이 포함된 형식으로 포맷팅합니다.
 * @param phone - 숫자만 포함된 전화번호 문자열
 * @returns 하이픈이 포함된 전화번호 (예: 010-1234-5678)
 */
export function formatPhoneNumber(phone: string): string {
	// 숫자만 추출
	const numbers = phone.replace(/\D/g, "");
	
	if (!numbers) return "";
	
	// 010으로 시작하는 경우 (휴대폰)
	if (numbers.startsWith("010")) {
		if (numbers.length <= 3) return numbers;
		if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
		return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
	}
	
	// 070으로 시작하는 경우 (인터넷전화)
	if (numbers.startsWith("070")) {
		if (numbers.length <= 3) return numbers;
		if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
		return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
	}
	
	// 02로 시작하는 경우 (서울)
	if (numbers.startsWith("02")) {
		if (numbers.length <= 2) return numbers;
		if (numbers.length <= 6) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
		if (numbers.length <= 9) return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
		return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
	}
	
	// 0XX로 시작하는 경우 (지역번호 3자리: 031, 032, 033, 041, 042, 043, 044, 051, 052, 053, 054, 055, 061, 062, 063, 064 등)
	if (numbers.startsWith("0") && numbers.length >= 3) {
		const areaCode = numbers.slice(0, 3);
		if (numbers.length <= 3) return numbers;
		if (numbers.length <= 6) return `${areaCode}-${numbers.slice(3)}`;
		if (numbers.length <= 9) return `${areaCode}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
		return `${areaCode}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
	}
	
	// 기본: 숫자만 반환 (형식에 맞지 않는 경우)
	return numbers;
}


