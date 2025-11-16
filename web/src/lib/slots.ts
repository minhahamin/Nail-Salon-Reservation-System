import { AvailabilityRequest, AvailabilityResponse, Slot } from "./types";
import { designers, existingBookings } from "./data";
import { addMinutes, formatLocalISO, isSameDay, setTime } from "./time";
import { BUFFER_MINUTES, MIN_LEAD_HOURS, MAX_LEAD_DAYS } from "./config";

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
	return aStart < bEnd && bStart < aEnd;
}

export function recommendSlots(req: AvailabilityRequest): AvailabilityResponse {
	const {
		dateISO,
		designerId,
		totalDurationMinutes,
		intervalMinutes = 15,
		bufferMinutes = BUFFER_MINUTES,
		minLeadHours = MIN_LEAD_HOURS,
		maxLeadDays = MAX_LEAD_DAYS,
	} = req;
	const date = new Date(dateISO);
	const now = new Date();
	const designer = designers.find(d => d.id === designerId);
	if (!designer) {
		return { dateISO, designerId, totalDurationMinutes, slots: [] };
	}

	// 근무 요일 체크
	const weekday = date.getDay();
	if (!designer.workHours.weekday.includes(weekday)) {
		return { dateISO, designerId, totalDurationMinutes, slots: [] };
	}

	// 휴무일(특정 날짜) 차단
	const ymd = formatLocalISO(new Date(dateISO)).slice(0, 10);
	if (designer.holidays && designer.holidays.includes(ymd)) {
		return { dateISO, designerId, totalDurationMinutes, slots: [] };
	}

	// 근무 시간 구간
	const workStart = setTime(date, designer.workHours.start);
	const workEnd = setTime(date, designer.workHours.end);

	// 디자이너의 해당 날짜 예약
	const bookings = existingBookings
		.filter(b => b.designerId === designerId)
		.filter(b => isSameDay(new Date(b.startISO), date))
		// 예약 끝에 버퍼를 더해 충돌 검사
		.map(b => ({ start: new Date(b.startISO), end: addMinutes(new Date(b.endISO), bufferMinutes) }))
		.sort((a, b) => a.start.getTime() - b.start.getTime());

	// interval 간격으로 후보 생성
	const slots: Slot[] = [];
	for (
		let cursor = new Date(workStart);
		cursor <= addMinutes(workEnd, -(totalDurationMinutes + bufferMinutes));
		cursor = addMinutes(cursor, intervalMinutes)
	) {
		const slotStart = new Date(cursor);
		const slotEnd = addMinutes(slotStart, totalDurationMinutes);
		const slotEndWithBuffer = addMinutes(slotEnd, bufferMinutes);

		// 과거 시간 제외
		if (slotEnd <= now) {
			slots.push({
				startISO: formatLocalISO(slotStart),
				endISO: formatLocalISO(slotEnd),
				isAvailable: false,
				reason: "past",
			});
			continue;
		}

		// 리드타임 제한
		const minAllowed = addMinutes(now, minLeadHours * 60);
		const maxAllowed = addMinutes(now, maxLeadDays * 24 * 60);
		if (slotStart < minAllowed || slotStart > maxAllowed) {
			continue;
		}

		// 근무 시간 벗어남 체크는 루프 조건에서 보장
		if (slotEndWithBuffer > workEnd) {
			continue;
		}

		// 예약 충돌 체크
		const hasConflict = bookings.some(b => overlaps(slotStart, slotEndWithBuffer, b.start, b.end));
		// 점심/휴식시간 충돌 체크
		const hasBreakConflict =
			designer.breaks?.some(br => {
				const brStart = setTime(date, br.start);
				const brEnd = setTime(date, br.end);
				return overlaps(slotStart, slotEndWithBuffer, brStart, brEnd);
			}) ?? false;

		slots.push({
			startISO: formatLocalISO(slotStart),
			endISO: formatLocalISO(slotEnd),
			isAvailable: !hasConflict && !hasBreakConflict,
			reason: hasConflict || hasBreakConflict ? "conflict" : undefined,
		});
	}

	// 가독성: 정렬(이미 시간 순)
	return { dateISO, designerId, totalDurationMinutes, slots };
}

export function sumDurationMinutes(serviceDurationList: number[]): number {
	return serviceDurationList.reduce((acc, v) => acc + v, 0);
}


