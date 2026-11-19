import { tool } from "langchain";
import { z } from "zod";

import { toIsoDate } from "./dates.js";

// Appointment start times offered every open day (sample data for the POC).
const DAILY_SLOTS = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

const SUNDAY = 0;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const FIRST_REFERENCE_NUMBER = 1001;

interface Booking {
    id: string;
    name: string;
    date: string;
    time: string;
}

interface Complaint {
    id: string;
    summary: string;
    loggedAt: string;
}

// In-memory stores. Everything here is lost when the server restarts.
const bookings = new Map<string, Booking>();
const complaints: Complaint[] = [];
let nextBookingNumber = FIRST_REFERENCE_NUMBER;
let nextComplaintNumber = FIRST_REFERENCE_NUMBER;

/** Returns a reason the date can't be booked, or null when it is bookable. */
function findDateProblem(date: string): string | null {
    const isWellFormed = ISO_DATE_PATTERN.test(date);

    if (!isWellFormed) {
        return `"${date}" is not a valid date. Use the YYYY-MM-DD format.`;
    }

    const parsedDate = new Date(`${date}T00:00:00`);
    const isRealDate = toIsoDate(parsedDate) === date;

    if (!isRealDate) {
        return `"${date}" is not a real calendar date.`;
    }

    const today = toIsoDate(new Date());
    const isPast = date < today;

    if (isPast) {
        return `${date} is in the past.`;
    }

    const isSunday = parsedDate.getDay() === SUNDAY;

    if (isSunday) {
        return "The salon is closed on Sundays.";
    }

    return null;
}

/** Times on the date that are not booked yet (and not already over, for today). */
function findFreeSlots(date: string): string[] {
    const now = new Date();
    const isToday = date === toIsoDate(now);
    const currentTime = now.toTimeString().slice(0, 5);
    const freeSlots: string[] = [];

    for (const time of DAILY_SLOTS) {
        const isOver = isToday && time <= currentTime;
        const isTaken = isSlotTaken(date, time);

        if (!isOver && !isTaken) {
            freeSlots.push(time);
        }
    }

    return freeSlots;
}

function isSlotTaken(date: string, time: string): boolean {
    for (const booking of bookings.values()) {
        const isSameSlot = booking.date === date && booking.time === time;

        if (isSameSlot) {
            return true;
        }
    }

    return false;
}

export const checkSlots = tool(
    async ({ date }) => {
        const dateProblem = findDateProblem(date);

        if (dateProblem) {
            return dateProblem;
        }

        const freeSlots = findFreeSlots(date);

        if (freeSlots.length === 0) {
            return `There are no free slots on ${date}.`;
        }

        return `Free slots on ${date}: ${freeSlots.join(", ")}.`;
    },
    {
        name: "checkSlots",
        description: "List the free appointment times for one date.",
        schema: z.object({
            date: z.string().describe("The date in YYYY-MM-DD format."),
        }),
    },
);

export const bookSlot = tool(
    async ({ name, date, time }) => {
        const customerName = name.trim();

        if (customerName.length === 0) {
            return "A customer name is required to book.";
        }

        const dateProblem = findDateProblem(date);

        if (dateProblem) {
            return dateProblem;
        }

        const freeSlots = findFreeSlots(date);
        const isFree = freeSlots.includes(time);
        const isFullyBooked = freeSlots.length === 0;

        if (!isFree && isFullyBooked) {
            return `${date} is fully booked.`;
        }

        if (!isFree) {
            return `${time} on ${date} is not available. Free slots that day: ${freeSlots.join(", ")}.`;
        }

        const booking: Booking = {
            id: `B-${nextBookingNumber}`,
            name: customerName,
            date,
            time,
        };

        nextBookingNumber += 1;
        bookings.set(booking.id, booking);

        return `Booked. Booking ID ${booking.id} for ${booking.name} on ${booking.date} at ${booking.time}.`;
    },
    {
        name: "bookSlot",
        description: "Book an appointment once the customer's name, date and time are known.",
        schema: z.object({
            name: z.string().describe("The customer's name."),
            date: z.string().describe("The date in YYYY-MM-DD format."),
            time: z.string().describe("The start time in 24-hour HH:MM format, e.g. 17:00."),
        }),
    },
);

export const cancelBooking = tool(
    async ({ bookingId }) => {
        const normalizedId = bookingId.trim().toUpperCase();
        const booking = bookings.get(normalizedId);

        if (!booking) {
            return `No booking was found with ID ${normalizedId}.`;
        }

        bookings.delete(normalizedId);

        return `Booking ${booking.id} for ${booking.name} on ${booking.date} at ${booking.time} has been cancelled.`;
    },
    {
        name: "cancelBooking",
        description: "Cancel an existing appointment by its booking ID.",
        schema: z.object({
            bookingId: z.string().describe("The booking ID, e.g. B-1001."),
        }),
    },
);

export const logComplaint = tool(
    async ({ summary }) => {
        const complaint: Complaint = {
            id: `C-${nextComplaintNumber}`,
            summary,
            loggedAt: new Date().toISOString(),
        };

        nextComplaintNumber += 1;
        complaints.push(complaint);
        console.log("[complaint logged]", complaint);

        return `Complaint logged with reference ${complaint.id}. A team member will follow up.`;
    },
    {
        name: "logComplaint",
        description: "Record a customer complaint for a human team member to follow up on.",
        schema: z.object({
            summary: z.string().describe("A short summary: what happened, when, and what the customer wants."),
        }),
    },
);
