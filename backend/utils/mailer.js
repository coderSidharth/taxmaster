const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const taxResult = require('../models/taxResult');
const remainderSchema = require('../models/remainder');

let cachedTransporter = null;

// Build an SMTP transporter.
// If EMAIL and PASSWORD are provided in .env, uses Gmail SMTP.
// Otherwise, automatically provisions a free disposable Ethereal test inbox
// and logs a preview URL so emails can be viewed instantly in the browser.
async function getTransporter() {
    if (cachedTransporter) {
        return cachedTransporter;
    }
    if (process.env.EMAIL && process.env.PASSWORD) {
        cachedTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL.trim(),
                pass: process.env.PASSWORD.replace(/\s+/g, ''),
            },
        });
        return cachedTransporter;
    }

    try {
        console.log('[mailer] Initializing Ethereal test email account...');
        const testAccount = await nodemailer.createTestAccount();
        cachedTransporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('[mailer] Ethereal test account ready:', testAccount.user);
        return cachedTransporter;
    } catch (err) {
        console.error('[mailer] Failed to create Ethereal test account:', err.message);
        return null;
    }
}

// Work out when the reminder email should actually be sent.
// Supports both 'YYYY-MM-DD' (defaults to 09:00 on that day)
// and full ISO/datetime-local strings (e.g. 'YYYY-MM-DDTHH:mm').
// If the target is in the past, fires shortly (+15 seconds).
function computeFireDate(date) {
    const soon = new Date(Date.now() + 15 * 1000);
    if (!date) return soon;
    let target;
    if (typeof date === 'string' && date.includes('T')) {
        target = new Date(date);
    } else {
        target = new Date(`${date}T09:00:00`);
    }
    if (isNaN(target.getTime())) return soon;
    if (target.getTime() <= Date.now()) return soon;
    return target;
}

// Send the reminder email and mark the related documents as notified.
async function sendReminderEmail(email, taxId, remainderId) {
    const transporter = await getTransporter();
    if (!transporter) {
        console.warn('[mailer] No mail transporter available; skipping email to', email);
        return false;
    }

    let taxInfo = null;
    if (taxId) {
        try {
            taxInfo = await taxResult.findById(taxId);
        } catch (e) {
            console.warn('[mailer] Could not load tax details for email:', e.message);
        }
    }

    const sender = process.env.EMAIL || transporter.options?.auth?.user || 'taxmaster@ethereal.email';
    const totalTaxFormatted = taxInfo?.TotalTax != null ? `₹${Number(taxInfo.TotalTax).toLocaleString('en-IN')}` : 'N/A';

    const info = await transporter.sendMail({
        from: `"Tax Master" <${sender}>`,
        to: email,
        subject: `Reminder: Tax Filing Due${taxInfo?.TotalTax ? ` (${totalTaxFormatted})` : ''}`,
        text: `Hello,\n\nThis is a reminder from Tax Master regarding your tax filing.\n\nTax ID: ${taxId || 'N/A'}\nTotal Tax Payable: ${totalTaxFormatted}\n${taxInfo?.bas ? `Basic Salary: ₹${Number(taxInfo.bas).toLocaleString('en-IN')}\n` : ''}\nPlease make sure to complete your tax filing on time.\n\nThank you,\nTax Master Team`,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 20px auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff;">
                <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px;">
                    <h2 style="color: #1e293b; margin: 0; font-size: 22px;">📋 Tax Filing Reminder</h2>
                    <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Automated reminder from Tax Master</p>
                </div>
                <p style="color: #334155; font-size: 15px; line-height: 1.5;">This is a scheduled reminder to review and file your taxes.</p>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 18px 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Tax Record ID:</td>
                            <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-weight: 600; text-align: right;">${taxId || 'N/A'}</td>
                        </tr>
                        ${taxInfo?.bas ? `
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Basic Salary:</td>
                            <td style="padding: 6px 0; color: #0f172a; text-align: right;">₹${Number(taxInfo.bas).toLocaleString('en-IN')}</td>
                        </tr>` : ''}
                        <tr style="border-top: 1px solid #cbd5e1;">
                            <td style="padding: 10px 0 4px; color: #0f172a; font-weight: bold; font-size: 15px;">Total Tax Payable:</td>
                            <td style="padding: 10px 0 4px; color: #059669; font-weight: bold; font-size: 18px; text-align: right;">${totalTaxFormatted}</td>
                        </tr>
                    </table>
                </div>

                <p style="color: #475569; font-size: 14px;">Please ensure your payment or filing is completed in a timely manner.</p>
                
                <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; text-align: center;">
                    Tax Management System &bull; This is an automated email notification.
                </div>
            </div>
        `,
    });
    console.log('[mailer] Email sent successfully to', email);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
        console.log('\n======================================================');
        console.log(`📬 [ETHEREAL EMAIL PREVIEW] View email sent to ${email}:`);
        console.log(previewUrl);
        console.log('======================================================\n');
    }

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
