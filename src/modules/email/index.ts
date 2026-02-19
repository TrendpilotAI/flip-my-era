/**
 * Email Module
 * 
 * Currently a stub that logs emails. To connect to a real provider:
 * 
 * ## Resend
 * ```ts
 * import { Resend } from 'resend';
 * const resend = new Resend(process.env.RESEND_API_KEY);
 * await resend.emails.send({ from: 'FlipMyEra <hello@flipmyera.com>', to, subject, html });
 * ```
 * 
 * ## SendGrid
 * ```ts
 * import sgMail from '@sendgrid/mail';
 * sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 * await sgMail.send({ from: 'hello@flipmyera.com', to, subject, html });
 * ```
 */

export { welcomeEmail, type WelcomeEmailData } from './templates/welcome';
export { purchaseConfirmationEmail, type PurchaseConfirmationData } from './templates/purchaseConfirmation';
export { ebookReadyEmail, type EbookReadyData } from './templates/ebookReady';
export { abandonedCartEmail, type AbandonedCartData } from './templates/abandonedCart';

type EmailTemplate = { subject: string; html: string };

export async function sendEmail(
  to: string,
  template: EmailTemplate,
  _options?: { from?: string }
): Promise<{ success: boolean; messageId?: string }> {
  // Stub: log to console. Replace with Resend/SendGrid call in production.
  console.log(`[EMAIL STUB] To: ${to} | Subject: ${template.subject}`);
  console.log(`[EMAIL STUB] HTML length: ${template.html.length} chars`);
  return { success: true, messageId: `stub-${Date.now()}` };
}
