const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const taxResult = require('../models/taxResult');
const remainderSchema = require('../models/remainder');

// Build a Gmail SMTP transporter from environment variables.
// Returns null (instead of throwing) when credentials are not configured,
// so a missing .env never crashes the request that schedules a reminder.
function getTransporter() {
    if (!process.env.EMAIL || !process.env.PASSWORD) {
        return null;
    }
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });
}

// Work out when the reminder email should actually be sent.
// `date` is a 'YYYY-MM-DD' string chosen by the user; we fire at 09:00 on that
// day. If the chosen day is today or already past, we send shortly (so demos
// and same-day reminders still deliver instead of silently never firing).
function computeFireDate(date) {
    const soon = new Date(Date.now() + 15 * 1000);
    if (!date) return soon;
    const target = new Date(`${date}T09:00:00`);
    if (isNaN(target.getTime()) || target <= new Date()) return soon;
    return target;
}

// Send the reminder email and mark the related documents as notified.
async function sendReminderEmail(email, taxId, remainderId) {
    const transporter = getTransporter();
    if (!transporter) {
        console.warn('[mailer] EMAIL/PASSWORD not configured; skipping email to', email);
        return false;
    }
    await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: 'Reminder: Tax Filing',
        text: 'This is a reminder to file your taxes. Please do so as soon as possible.',
    });
    if (taxId) {
        await taxResult.findByIdAndUpdate(taxId, { $set: { isRemainder: true } });
    }
    if (remainderId) {
        await remainderSchema.findByIdAndUpdate(remainderId, { $set: { status: true } });
    }
    return true;
}

// Schedule a reminder job. Returns the Date it will fire.
function scheduleReminder({ remainderId, taxId, email, date }) {
    const fireDate = computeFireDate(date);
    schedule.scheduleJob(fireDate, async () => {
        try {
            await sendReminderEmail(email, taxId, remainderId);
        } catch (e) {
            console.error('[mailer] Failed to send reminder email:', e.message);
        }
    });
    return fireDate;
}

// On server start-up, re-create jobs for reminders that were saved but not yet
// sent. node-schedule keeps jobs in memory, so without this every pending
// reminder would be lost whenever the server restarts.
async function reschedulePendingReminders() {
    try {
        const pending = await remainderSchema.find({ status: { $ne: true } });
        pending.forEach((r) =>
            scheduleReminder({ remainderId: r._id, taxId: r.taxId, email: r.email, date: r.date })
        );
        if (pending.length) {
            console.log(`[mailer] Rescheduled ${pending.length} pending reminder(s).`);
        }
    } catch (e) {
        console.error('[mailer] Could not reschedule reminders:', e.message);
    }
}

module.exports = { sendReminderEmail, scheduleReminder, reschedulePendingReminders, computeFireDate };
