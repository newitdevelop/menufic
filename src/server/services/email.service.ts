import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import { env } from "src/env/server.mjs";

// Email transporter singleton
let transporter: Transporter | null = null;

/**
 * Get or create the nodemailer transporter
 */
function getTransporter(): Transporter {
    if (!transporter) {
        // Check if SMTP is configured
        if (!env.SMTP_HOST || !env.SMTP_PORT) {
            throw new Error("SMTP not configured. Please set SMTP_HOST and SMTP_PORT in environment variables.");
        }

        transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: Number(env.SMTP_PORT),
            secure: env.SMTP_PORT === "465", // true for 465, false for other ports
            auth: env.SMTP_USER && env.SMTP_PASS ? {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            } : undefined,
            // Additional options for better compatibility with Docker/Linux
            tls: {
                rejectUnauthorized: false, // Allow self-signed certificates (adjust for production)
            },
        });

        console.log(`[Email Service] SMTP transporter configured: ${env.SMTP_HOST}:${env.SMTP_PORT}`);
    }

    return transporter;
}

/**
 * Check if email service is available
 */
export function isEmailServiceAvailable(): boolean {
    return !!(env.SMTP_HOST && env.SMTP_PORT);
}

export interface SendEmailParams {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

/**
 * Send an email using SMTP
 * @throws Error with clear message if SMTP is not configured or email fails to send
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
    const { to, subject, text, html } = params;

    if (!isEmailServiceAvailable()) {
        const message = "Email service is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables to enable email functionality.";
        console.warn(`[Email Service] ${message}`);
        console.log(`[Email Service] Would have sent email to ${to}: ${subject}`);
        console.log(text);
        throw new Error(message);
    }

    try {
        const transporter = getTransporter();

        const info = await transporter.sendMail({
            from: env.SMTP_FROM || env.SMTP_USER || "noreply@menufic.com",
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, "<br>"),
        });

        console.log(`[Email Service] Email sent successfully: ${info.messageId}`);
        console.log(`[Email Service] To: ${to}, Subject: ${subject}`);
    } catch (error) {
        console.error("[Email Service] Failed to send email:", error);
        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Send reservation notification email to restaurant
 */
export async function sendReservationEmail(params: {
    to: string;
    restaurantName: string;
    menuName: string;
    serviceNames?: string[]; // For service bookings (array of selected services)
    date: Date;
    time: string;
    partySize: number;
    customerEmail: string;
    customerPhone: string;
    contactPreference: "PHONE" | "WHATSAPP" | "EMAIL";
}): Promise<void> {
    const { to, restaurantName, menuName, serviceNames, date, time, partySize, customerEmail, customerPhone, contactPreference } = params;
    const isServiceBooking = serviceNames && serviceNames.length > 0;
    const hasMultipleServices = serviceNames && serviceNames.length > 1;

    const formattedDate = date.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const subject = isServiceBooking
        ? `🇵🇹 Pedido de Marcação / 🇬🇧 Booking Request - ${restaurantName}`
        : `🇵🇹 Pedido de Reserva / 🇬🇧 Reservation Request - ${restaurantName}`;

    const contactPreferenceLabels = {
        pt: {
            PHONE: "Telefone",
            WHATSAPP: "WhatsApp",
            EMAIL: "Email"
        },
        en: {
            PHONE: "Phone Call",
            WHATSAPP: "WhatsApp",
            EMAIL: "Email"
        }
    };

    // Format services for display
    const servicesListPt = isServiceBooking ? serviceNames!.map(s => `  • ${s}`).join("\n") : "";
    const servicesListEn = isServiceBooking ? serviceNames!.map(s => `  • ${s}`).join("\n") : "";

    const text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇵🇹 ${isServiceBooking ? "PEDIDO DE MARCAÇÃO" : "PEDIDO DE RESERVA"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Restaurante: ${restaurantName}
Menu: ${menuName}${isServiceBooking ? `
${hasMultipleServices ? "Serviços" : "Serviço"}:
${servicesListPt}` : ""}

Data: ${formattedDate}
Hora: ${time}
Número de Pessoas: ${partySize} ${partySize === 1 ? "pessoa" : "pessoas"}

Informações de Contacto do Cliente:
Email: ${customerEmail}
Telefone: ${customerPhone}
Método de Contacto Preferido: ${contactPreferenceLabels.pt[contactPreference]}

Por favor, contacte o cliente para confirmar esta ${isServiceBooking ? "marcação" : "reserva"}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇬🇧 ${isServiceBooking ? "BOOKING REQUEST" : "RESERVATION REQUEST"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Restaurant: ${restaurantName}
Menu: ${menuName}${isServiceBooking ? `
${hasMultipleServices ? "Services" : "Service"}:
${servicesListEn}` : ""}

Date: ${formattedDate}
Time: ${time}
Party Size: ${partySize} ${partySize === 1 ? "person" : "people"}

Customer Contact Information:
Email: ${customerEmail}
Phone: ${customerPhone}
Preferred Contact Method: ${contactPreferenceLabels.en[contactPreference]}

Please contact the customer to confirm this ${isServiceBooking ? "booking" : "reservation"}.
    `.trim();

    // Format services for HTML display
    const servicesHtmlPt = isServiceBooking
        ? serviceNames!.map(s => `<span class="service-highlight" style="display: inline-block; margin: 2px 4px 2px 0;">${s}</span>`).join("")
        : "";
    const servicesHtmlEn = isServiceBooking
        ? serviceNames!.map(s => `<span class="service-highlight" style="display: inline-block; margin: 2px 4px 2px 0;">${s}</span>`).join("")
        : "";

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4a5568; color: white; padding: 20px; text-align: center; }
        .lang-section { background-color: #f7fafc; padding: 30px; margin-top: 20px; border-radius: 8px; }
        .lang-header { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #2d3748; }
        .detail { margin: 15px 0; }
        .label { font-weight: bold; color: #2d3748; }
        .value { color: #4a5568; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px; }
        .divider { border: none; border-top: 2px solid #cbd5e0; margin: 30px 0; }
        .service-highlight { background-color: #edf2f7; padding: 4px 8px; border-radius: 4px; font-weight: 600; color: #2d3748; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Portuguese Section -->
        <div class="lang-section">
            <div class="lang-header">
                🇵🇹 ${isServiceBooking ? "PEDIDO DE MARCAÇÃO" : "PEDIDO DE RESERVA"}
            </div>
            <div class="detail">
                <span class="label">Restaurante:</span>
                <span class="value">${restaurantName}</span>
            </div>
            <div class="detail">
                <span class="label">Menu:</span>
                <span class="value">${menuName}</span>
            </div>${isServiceBooking ? `
            <div class="detail">
                <span class="label">${hasMultipleServices ? "Serviços" : "Serviço"}:</span>
                <div class="value">${servicesHtmlPt}</div>
            </div>` : ""}
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <div class="detail">
                <span class="label">Data:</span>
                <span class="value">${formattedDate}</span>
            </div>
            <div class="detail">
                <span class="label">Hora:</span>
                <span class="value">${time}</span>
            </div>
            <div class="detail">
                <span class="label">Número de Pessoas:</span>
                <span class="value">${partySize} ${partySize === 1 ? "pessoa" : "pessoas"}</span>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <h3 style="color: #2d3748; margin-top: 20px;">Informações de Contacto do Cliente</h3>
            <div class="detail">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${customerEmail}">${customerEmail}</a></span>
            </div>
            <div class="detail">
                <span class="label">Telefone:</span>
                <span class="value"><a href="tel:${customerPhone}">${customerPhone}</a></span>
            </div>
            <div class="detail">
                <span class="label">Método de Contacto Preferido:</span>
                <span class="value" style="background-color: #edf2f7; padding: 4px 8px; border-radius: 4px; font-weight: 600;">${contactPreferenceLabels.pt[contactPreference]}</span>
            </div>
            <div class="footer">
                <p>Por favor, contacte o cliente para confirmar esta ${isServiceBooking ? "marcação" : "reserva"}.</p>
            </div>
        </div>

        <hr class="divider">

        <!-- English Section -->
        <div class="lang-section">
            <div class="lang-header">
                🇬🇧 ${isServiceBooking ? "BOOKING REQUEST" : "RESERVATION REQUEST"}
            </div>
            <div class="detail">
                <span class="label">Restaurant:</span>
                <span class="value">${restaurantName}</span>
            </div>
            <div class="detail">
                <span class="label">Menu:</span>
                <span class="value">${menuName}</span>
            </div>${isServiceBooking ? `
            <div class="detail">
                <span class="label">${hasMultipleServices ? "Services" : "Service"}:</span>
                <div class="value">${servicesHtmlEn}</div>
            </div>` : ""}
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <div class="detail">
                <span class="label">Date:</span>
                <span class="value">${formattedDate}</span>
            </div>
            <div class="detail">
                <span class="label">Time:</span>
                <span class="value">${time}</span>
            </div>
            <div class="detail">
                <span class="label">Party Size:</span>
                <span class="value">${partySize} ${partySize === 1 ? "person" : "people"}</span>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <h3 style="color: #2d3748; margin-top: 20px;">Customer Contact Information</h3>
            <div class="detail">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${customerEmail}">${customerEmail}</a></span>
            </div>
            <div class="detail">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${customerPhone}">${customerPhone}</a></span>
            </div>
            <div class="detail">
                <span class="label">Preferred Contact Method:</span>
                <span class="value" style="background-color: #edf2f7; padding: 4px 8px; border-radius: 4px; font-weight: 600;">${contactPreferenceLabels.en[contactPreference]}</span>
            </div>
            <div class="footer">
                <p>Please contact the customer to confirm this ${isServiceBooking ? "booking" : "reservation"}.</p>
            </div>
        </div>

        <div class="footer" style="text-align: center; border-top: none;">
            <p style="color: #a0aec0; font-size: 12px;">This is an automated email from Menufic.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    await sendEmail({ to, subject, text, html });
}
