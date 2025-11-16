import { z } from "zod";

export const BookingCreateSchema = z.object({
	designerId: z.string().min(1),
	startISO: z.string().datetime(),
	endISO: z.string().datetime(),
	serviceIds: z.array(z.string().min(1)).min(1),
	customerName: z.string().min(1),
	customerPhone: z.string().min(7),
	agreedTerms: z.boolean(),
	agreedPrivacy: z.boolean(),
	reminderOptIn: z.boolean().optional(),
});

export const BookingLookupSchema = z.object({
	bookingId: z.string().min(1),
	customerPhone: z.string().min(7),
});

export const BookingDeleteSchema = BookingLookupSchema;

export const BookingRescheduleSchema = BookingLookupSchema.extend({
	startISO: z.string().datetime(),
	endISO: z.string().datetime(),
});

export const AvailabilitySchema = z.object({
	designerId: z.string().min(1),
	dateISO: z.string().datetime(),
	totalDurationMinutes: z.number().int().positive(),
	intervalMinutes: z.number().int().positive().optional(),
	bufferMinutes: z.number().int().nonnegative().optional(),
	minLeadHours: z.number().int().nonnegative().optional(),
	maxLeadDays: z.number().int().positive().optional(),
});


