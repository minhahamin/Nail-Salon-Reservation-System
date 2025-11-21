import { Designer, Service, Booking, Block } from "./types";

export const designers: Designer[] = [
	{
		id: "dsg-anna",
		name: "Anna",
		specialties: ["basic", "art", "care"],
		workHours: { weekday: [1, 2, 3, 4, 5], start: "10:00", end: "19:00" },
		holidays: [], // 필요시 날짜 문자열 추가
		breaks: [{ start: "13:00", end: "14:00" }], // 점심시간
		recurringBreaks: [{ weekday: 1, start: "16:30", end: "17:00" }], // 매주 월 16:30~17:00
		defaultBlocks: [
			// 예시: 특정 날짜 차단시간
			// { date: "2025-11-20", start: "12:00", end: "13:00", reason: "미팅" },
		],
		specialHours: {
			// 예: 특정 날짜 연장 영업
			// "2025-11-20": { start: "09:00", end: "21:00" },
		},
		dailyMaxAppointments: 8,
		dailyMaxMinutes: 8 * 60 + 30,
	},
	{
		id: "dsg-min",
		name: "Min",
		specialties: ["basic", "removal", "care"],
		workHours: { weekday: [2, 3, 4, 5, 6], start: "11:00", end: "20:00" },
		holidays: [], 
		breaks: [{ start: "15:00", end: "15:30" }],
		recurringBreaks: [{ weekday: 4, start: "12:00", end: "12:30" }], // 매주 목 12:00~12:30
		defaultBlocks: [
			// 예시: 특정 날짜 차단시간
			// { date: "2025-11-25", start: "14:00", end: "15:00", reason: "교육" },
		],
		specialHours: {},
		dailyMaxAppointments: 7,
		dailyMaxMinutes: 7 * 60 + 0,
	},
];

export const services: Service[] = [
	{ id: "svc-basic", name: "베이직 젤", category: "basic", durationMinutes: 60, price: 50000 },
	{ id: "svc-art", name: "아트 (간단)", category: "art", durationMinutes: 30, price: 30000 },
	{ id: "svc-art-adv", name: "아트 (고급)", category: "art", durationMinutes: 60, price: 60000 },
	{ id: "svc-care", name: "케어", category: "care", durationMinutes: 30, price: 20000 },
	{ id: "svc-removal", name: "제거", category: "removal", durationMinutes: 20, price: 15000 },
];

// 예시 기존 예약 (충돌 테스트용)
export const existingBookings: Booking[] = [
	{
		id: "bk-1",
		designerId: "dsg-anna",
		startISO: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
		endISO: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
		serviceIds: ["svc-basic"],
		customerName: "홍길동",
		customerPhone: "010-0000-0000",
	},
	{
		id: "bk-2",
		designerId: "dsg-anna",
		startISO: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
		endISO: new Date(new Date().setHours(16, 50, 0, 0)).toISOString(),
		serviceIds: ["svc-care", "svc-art"],
		customerName: "이영희",
		customerPhone: "010-1111-1111",
	},
];

export const manualBlocks: Block[] = [
	// 예시: 수기 차단 시간
	// { id: "blk-1", designerId: "dsg-anna", startISO: "2025-11-20T12:00:00.000", endISO: "2025-11-20T13:00:00.000", reason: "미팅" }
];


