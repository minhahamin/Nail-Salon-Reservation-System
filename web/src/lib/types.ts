export type Designer = {
	id: string;
	name: string;
	specialties: string[];
	workHours: {
		weekday: number[]; // 0-6 (Sun-Sat)
		start: string; // "09:00"
		end: string; // "18:00"
	};
	holidays?: string[]; // ["2025-11-17"] 날짜 전체 휴무
	breaks?: { start: string; end: string }[]; // 근무 중 휴식/점심 "13:00"~"14:00"
	// 특정 날짜에 대한 영업시간 오버라이드(특별영업일/연장영업)
	// 예: { "2025-11-20": { start: "09:00", end: "21:00" } }
	specialHours?: Record<string, { start: string; end: string }>;
	// 반복 브레이크(매주 특정 요일/시간)
	recurringBreaks?: { weekday: number; start: string; end: string }[];
	// 1일 최대 처리 건수/총 시간(분) 한도
	dailyMaxAppointments?: number;
	dailyMaxMinutes?: number;
};

export type Service = {
	id: string;
	name: string;
	category: "basic" | "art" | "care" | "removal";
	durationMinutes: number;
	price: number;
};

export type Booking = {
	id: string;
	designerId: string;
	startISO: string; // ISO string
	endISO: string; // ISO string
	serviceIds: string[];
	customerName: string;
	customerPhone: string;
	// 정책/동의
	agreedTerms?: boolean;
	agreedPrivacy?: boolean;
	reminderOptIn?: boolean; // 방문 전 알림 수신 동의
	depositRequired?: boolean;
	depositPaid?: boolean;
};

export type Slot = {
	startISO: string;
	endISO: string;
	isAvailable: boolean;
	reason?: "outside_working_hours" | "conflict" | "past";
};

export type Block = {
	id: string;
	designerId: string;
	startISO: string;
	endISO: string;
	reason?: string;
};

export type AvailabilityRequest = {
	designerId: string;
	dateISO: string; // day to search on
	totalDurationMinutes: number;
	intervalMinutes?: number; // slot granularity
	bufferMinutes?: number; // after service
	minLeadHours?: number;
	maxLeadDays?: number;
};

export type AvailabilityResponse = {
	dateISO: string;
	designerId: string;
	totalDurationMinutes: number;
	slots: Slot[];
};


