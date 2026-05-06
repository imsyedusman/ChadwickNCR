import nodemailer from 'nodemailer';
import { db } from '../db';
import { notificationSettings } from '../db/schema';
import { eq } from 'drizzle-orm';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false, // Adjust as needed for self-hosted
      }
    });
  }

  private async getSettings() {
    const settings = await db.query.notificationSettings.findFirst({
      where: eq(notificationSettings.id, 1),
    });
    return settings;
  }

  private renderTemplate(content: string, ctaText: string, ctaLink: string) {
    const brandColor = '#2b95ff';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .header {
            padding: 0 0 32px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: ${brandColor};
            letter-spacing: -0.025em;
          }
          .content {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e7eb;
          }
          .footer {
            padding: 32px 0 0;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          .cta-button {
            display: inline-block;
            background-color: ${brandColor};
            color: #ffffff !important;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            margin-top: 24px;
          }
          .muted {
            color: #6b7280;
            font-size: 14px;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
          }
          .details-table td {
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .details-label {
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            color: #9ca3af;
            width: 140px;
          }
          .details-value {
            font-weight: 600;
            font-size: 14px;
            color: #111827;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Chadwick Switchboards</h1>
          </div>
          <div class="content">
            ${content}
            <a href="${ctaLink}" class="cta-button">${ctaText}</a>
          </div>
          <div class="footer">
            <p>Chadwick Switchboards NCR Management System</p>
            <p>This is an automated notification — please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendEmail(to: string | string[], subject: string, html: string) {
    try {
      const settings = await this.getSettings();
      if (!settings?.globalEnabled) {
        console.log(`[EmailService] Global notifications disabled. Skipping email to ${to}`);
        return;
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Email sent successfully to ${to}: ${subject}`);
    } catch (error) {
      console.error(`[EmailService] Failed to send email to ${to}:`, error);
    }
  }

  // Helper to format details table
  private formatDetails(details: Record<string, string>) {
    let rows = '<table class="details-table">';
    for (const [label, value] of Object.entries(details)) {
      rows += `
        <tr>
          <td class="details-label">${label}</td>
          <td class="details-value">${value}</td>
        </tr>
      `;
    }
    rows += '</table>';
    return rows;
  }

  async notifyNcrIssued(ncr: any, recipientEmails: string[]) {
    const settings = await this.getSettings();
    if (!settings?.ncrCreatedEnabled) return;

    const subject = `[${ncr.autoId}] New NCR Issued — ${ncr.title}`;
    const content = `
      <p>A new Non-Conformance Report has been issued to your department.</p>
      ${this.formatDetails({
        'NCR Number': ncr.autoId,
        'Title': ncr.title,
        'Category': ncr.category,
        'Location': ncr.location,
        'Issued By': ncr.issuedBy?.name || 'System',
        'Issued Date': new Date(ncr.createdAt).toLocaleDateString('en-AU'),
      })}
    `;
    const link = `${process.env.FRONTEND_URL}/ncrs/${ncr.id}`;
    await this.sendEmail(recipientEmails, subject, this.renderTemplate(content, 'View NCR Details', link));
  }

  async notifyNcrAssigned(ncr: any, ownerEmail: string, assignedBy: string) {
    const settings = await this.getSettings();
    if (!settings?.ncrAssignedEnabled) return;

    const subject = `[${ncr.autoId}] You have been assigned an NCR`;
    const content = `
      <p>You have been assigned as the owner for the following Non-Conformance Report.</p>
      ${this.formatDetails({
        'NCR Number': ncr.autoId,
        'Title': ncr.title,
        'Assigned By': assignedBy,
        'Current Status': ncr.status,
      })}
    `;
    const link = `${process.env.FRONTEND_URL}/ncrs/${ncr.id}`;
    await this.sendEmail(ownerEmail, subject, this.renderTemplate(content, 'View Assigned NCR', link));
  }

  async notifyStatusChange(ncr: any, recipientEmails: string[], oldStatus: string, newStatus: string, changedBy: string) {
    const settings = await this.getSettings();
    if (!settings?.statusChangeEnabled) return;

    const subject = `[${ncr.autoId}] Status Updated — ${oldStatus} → ${newStatus}`;
    const content = `
      <p>The status of NCR <strong>${ncr.autoId}</strong> has been updated.</p>
      ${this.formatDetails({
        'NCR Number': ncr.autoId,
        'Title': ncr.title,
        'Old Status': oldStatus,
        'New Status': newStatus,
        'Changed By': changedBy,
        'Timestamp': new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }),
      })}
    `;
    const link = `${process.env.FRONTEND_URL}/ncrs/${ncr.id}`;
    await this.sendEmail(recipientEmails, subject, this.renderTemplate(content, 'View Status Update', link));
  }

  async notifyOverdueAction(ncr: any, action: any, recipientEmails: string[], daysOverdue: number) {
    const settings = await this.getSettings();
    if (!settings?.overdueEnabled) return;

    const subject = `[${ncr.autoId}] Corrective Action Overdue — ${daysOverdue} days overdue`;
    const content = `
      <p>A corrective action assigned to you or your department is currently overdue.</p>
      ${this.formatDetails({
        'NCR Number': ncr.autoId,
        'Action': action.description,
        'Due Date': new Date(action.dueDate).toLocaleDateString('en-AU'),
        'Overdue': `${daysOverdue} days`,
      })}
    `;
    const link = `${process.env.FRONTEND_URL}/ncrs/${ncr.id}`;
    await this.sendEmail(recipientEmails, subject, this.renderTemplate(content, 'View Overdue Action', link));
  }

  async notifyVerificationRequired(ncr: any, recipientEmails: string[], submittedBy: string) {
    const settings = await this.getSettings();
    if (!settings?.verificationRequiredEnabled) return;

    const subject = `[${ncr.autoId}] Verification Required`;
    const content = `
      <p>A Non-Conformance Report is awaiting verification sign-off.</p>
      ${this.formatDetails({
        'NCR Number': ncr.autoId,
        'Title': ncr.title,
        'Submitted By': submittedBy,
      })}
    `;
    const link = `${process.env.FRONTEND_URL}/ncrs/${ncr.id}`;
    await this.sendEmail(recipientEmails, subject, this.renderTemplate(content, 'Perform Verification', link));
  }

  async notifyVerificationRejected(ncr: any, recipientEmails: string[], rejectedBy: string, reason: string) {
    const settings = await this.getSettings();
    if (!settings?.verificationRejectedEnabled) return;

    const subject = `[${ncr.autoId}] Verification Rejected — Action Required`;
    const content = `
      <p>The verification for NCR <strong>${ncr.autoId}</strong> has been rejected. Further corrective action may be required.</p>
      ${this.formatDetails({
        'NCR Number': ncr.autoId,
        'Rejected By': rejectedBy,
        'Reason': reason,
      })}
    `;
    const link = `${process.env.FRONTEND_URL}/ncrs/${ncr.id}`;
    await this.sendEmail(recipientEmails, subject, this.renderTemplate(content, 'View Rejection Details', link));
  }

  async notifyNcrClosed(ncr: any, recipientEmails: string[], closedBy: string) {
    const settings = await this.getSettings();
    if (!settings?.ncrClosedEnabled) return;

    const subject = `[${ncr.autoId}] NCR Closed`;
    const content = `
      <p>Non-Conformance Report <strong>${ncr.autoId}</strong> has been formally closed.</p>
      ${this.formatDetails({
        'NCR Number': ncr.autoId,
        'Title': ncr.title,
        'Closed By': closedBy,
        'Date Closed': new Date().toLocaleDateString('en-AU'),
      })}
    `;
    const link = `${process.env.FRONTEND_URL}/ncrs/${ncr.id}`;
    await this.sendEmail(recipientEmails, subject, this.renderTemplate(content, 'View Closed NCR', link));
  }

  async notifyNcrCancelled(ncr: any, recipientEmails: string[], cancelledBy: string, reason: string) {
    const settings = await this.getSettings();
    if (!settings?.ncrCancelledEnabled) return;

    const subject = `[${ncr.autoId}] NCR Cancelled`;
    const content = `
      <p>Non-Conformance Report <strong>${ncr.autoId}</strong> has been cancelled.</p>
      ${this.formatDetails({
        'NCR Number': ncr.autoId,
        'Title': ncr.title,
        'Cancelled By': cancelledBy,
        'Reason': reason,
      })}
    `;
    const link = `${process.env.FRONTEND_URL}/ncrs/${ncr.id}`;
    await this.sendEmail(recipientEmails, subject, this.renderTemplate(content, 'View Cancellation', link));
  }
}

export const emailService = new EmailService();
