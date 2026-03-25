import { env } from "src/env/server.mjs";

/**
 * Check if the Direct7 SMS service is configured
 */
export function isSmsServiceAvailable(): boolean {
    return !!env.DIRECT7_API_KEY;
}

/**
 * Send an SMS via Direct7 API
 * https://d7networks.com/docs/Messages/Send_Message/
 */
export async function sendSms(to: string, message: string): Promise<void> {
    if (!isSmsServiceAvailable()) {
        console.warn("[SMS Service] DIRECT7_API_KEY not configured — SMS not sent.");
        return;
    }

    // Normalize phone number: Direct7 requires E.164 format (e.g. +351912345678)
    const normalized = to.startsWith("+") ? to : `+${to.replace(/\D/g, "")}`;

    const body = {
        messages: [
            {
                channel: "sms",
                recipients: [normalized],
                content: message,
                msg_type: "text",
                data_coding: "unicode",
            },
        ],
        message_globals: {
            originator: env.DIRECT7_SMS_ORIGINATOR ?? "Menufic",
            report_url: "",
        },
    };

    const response = await fetch("https://api.d7networks.com/messages/v1/send", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.DIRECT7_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Direct7 SMS failed (${response.status}): ${text}`);
    }

    console.log(`[SMS Service] SMS sent to ${normalized}`);
}

/**
 * Build and send a reservation confirmation SMS to the customer (bilingual PT/EN)
 */
export async function sendReservationSms(params: {
    phone: string;
    restaurantName: string;
    menuName: string;
    date: Date;
    time: string;
    partySize: number;
    serviceNames?: string[];
}): Promise<void> {
    const { phone, restaurantName, menuName, date, time, partySize, serviceNames } = params;
    const isServiceBooking = serviceNames && serviceNames.length > 0;

    const formattedDate = date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const message = isServiceBooking
        ? `Marcação em ${restaurantName}: ${formattedDate} ${time} – ${serviceNames!.join(", ")}. Confirmamos em breve. / Booking at ${restaurantName}: ${formattedDate} ${time} – ${serviceNames!.join(", ")}. We'll confirm shortly.`
        : `Reserva em ${restaurantName}: ${formattedDate} ${time}, ${partySize} pessoa(s). Confirmamos em breve. / Reservation at ${restaurantName}: ${formattedDate} ${time}, ${partySize} pax. We'll confirm shortly.`;

    await sendSms(phone, message);
}
