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
};

export type Slot = {
	startISO: string;
	endISO: string;
	isAvailable: boolean;
	reason?: "outside_working_hours" | "conflict" | "past";
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


