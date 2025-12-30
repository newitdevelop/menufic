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
    date: Date;
    time: string;
    partySize: number;
    customerEmail: string;
}): Promise<void> {
    const { to, restaurantName, menuName, date, time, partySize, customerEmail } = params;

    const formattedDate = date.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const subject = `New Reservation Request - ${restaurantName}`;

    const text = `
New Reservation Request

Restaurant: ${restaurantName}
Menu: ${menuName}

Date: ${formattedDate}
Time: ${time}
Party Size: ${partySize} ${partySize === 1 ? "person" : "people"}
Customer Email: ${customerEmail}

Please contact the customer to confirm this reservation.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4a5568; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f7fafc; padding: 30px; margin-top: 20px; border-radius: 8px; }
        .detail { margin: 15px 0; }
        .label { font-weight: bold; color: #2d3748; }
        .value { color: #4a5568; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Reservation Request</h1>
        </div>
        <div class="content">
            <div class="detail">
                <span class="label">Restaurant:</span>
                <span class="value">${restaurantName}</span>
            </div>
            <div class="detail">
                <span class="label">Menu:</span>
                <span class="value">${menuName}</span>
            </div>
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
            <div class="detail">
                <span class="label">Customer Email:</span>
                <span class="value"><a href="mailto:${customerEmail}">${customerEmail}</a></span>
            </div>
        </div>
        <div class="footer">
            <p>Please contact the customer to confirm this reservation.</p>
            <p>This is an automated email from Menufic.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    await sendEmail({ to, subject, text, html });
}
