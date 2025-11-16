import { Designer, Service, Booking } from "./types";

export const designers: Designer[] = [
	{
		id: "dsg-anna",
		name: "Anna",
		specialties: ["basic", "art", "care"],
		workHours: { weekday: [1, 2, 3, 4, 5], start: "10:00", end: "19:00" },
		holidays: [], // 필요시 날짜 문자열 추가
		breaks: [{ start: "13:00", end: "14:00" }], // 점심시간
	},
	{
		id: "dsg-min",
		name: "Min",
		specialties: ["basic", "removal", "care"],
		workHours: { weekday: [2, 3, 4, 5, 6], start: "11:00", end: "20:00" },
		holidays: [], 
		breaks: [{ start: "15:00", end: "15:30" }],
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


