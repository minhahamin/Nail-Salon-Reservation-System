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

	// 휴무일(특정 날짜) 차단
	const ymd = formatLocalISO(new Date(dateISO)).slice(0, 10);
	if (designer.holidays && designer.holidays.includes(ymd)) {
		return { dateISO, designerId, totalDurationMinutes, slots: [] };
	}

	// 근무 시간 구간 (특별영업일이 있으면 오버라이드)
	const weekday = date.getDay();
	let workStart = setTime(date, designer.workHours.start);
	let workEnd = setTime(date, designer.workHours.end);
	const special = designer.specialHours?.[ymd];
	if (special) {
		workStart = setTime(date, special.start);
		workEnd = setTime(date, special.end);
	} else {
		// 특별영업일이 아닌데 기본 근무요일이 아니면 휴무 처리
		if (!designer.workHours.weekday.includes(weekday)) {
			return { dateISO, designerId, totalDurationMinutes, slots: [] };
		}
	}

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

		// 반복 브레이크(요일 기반) 충돌 체크
		const hasRecurringBreakConflict =
			designer.recurringBreaks?.some(br => {
				if (br.weekday !== weekday) return false;
				const brStart = setTime(date, br.start);
				const brEnd = setTime(date, br.end);
				return overlaps(slotStart, slotEndWithBuffer, brStart, brEnd);
			}) ?? false;

		slots.push({
			startISO: formatLocalISO(slotStart),
			endISO: formatLocalISO(slotEnd),
			isAvailable: !hasConflict && !hasBreakConflict && !hasRecurringBreakConflict,
			reason: hasConflict || hasBreakConflict || hasRecurringBreakConflict ? "conflict" : undefined,
		});
	}

	// 1일 최대 처리 건수/시간 한도 적용
	const dayBookings = existingBookings
		.filter(b => b.designerId === designerId)
		.filter(b => isSameDay(new Date(b.startISO), date));
	if (designer.dailyMaxAppointments && dayBookings.length >= designer.dailyMaxAppointments) {
		return { dateISO, designerId, totalDurationMinutes, slots: [] };
	}
	if (designer.dailyMaxMinutes) {
		const usedMinutes = dayBookings.reduce((acc, b) => acc + Math.max(0, (new Date(b.endISO).getTime() - new Date(b.startISO).getTime()) / 60000) + BUFFER_MINUTES, 0);
		// 후보 슬롯 중에서도 일 한도를 초과하는 경우는 제외
		const remaining = Math.max(0, designer.dailyMaxMinutes - usedMinutes);
		if (totalDurationMinutes + BUFFER_MINUTES > remaining) {
			// 오늘은 더 이상 처리 불가
			return { dateISO, designerId, totalDurationMinutes, slots: [] };
		}
		// 기본 필터만 유지
		const filtered = slots.filter(s => s.isAvailable);
		return { dateISO, designerId, totalDurationMinutes, slots: filtered };
	}

	// 가독성: 정렬(이미 시간 순)
	return { dateISO, designerId, totalDurationMinutes, slots };
}

export function sumDurationMinutes(serviceDurationList: number[]): number {
	return serviceDurationList.reduce((acc, v) => acc + v, 0);
}


