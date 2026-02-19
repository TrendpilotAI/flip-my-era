export interface PurchaseConfirmationData {
  userName: string;
  creditsPurchased: number;
  totalCredits: number;
  amountPaid: string;
  dashboardUrl?: string;
}

export function purchaseConfirmationEmail(data: PurchaseConfirmationData): { subject: string; html: string } {
  const { userName, creditsPurchased, totalCredits, amountPaid, dashboardUrl = 'https://flipmyera.com/dashboard' } = data;
  return {
    subject: `Receipt: ${creditsPurchased} credits added to your FlipMyEra account`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f4ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4ff;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.1);">
  <tr><td style="background:linear-gradient(135deg,#9333ea,#ec4899);padding:40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:28px;">🎉 Credits Added!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#1f2937;font-size:18px;margin:0 0 24px;">Hey ${userName}!</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ff;border-radius:12px;padding:24px;margin:0 0 24px;">
      <tr><td>
        <table width="100%" cellpadding="8" cellspacing="0">
          <tr><td style="color:#6b7280;font-size:14px;">Credits purchased</td><td align="right" style="color:#1f2937;font-weight:600;font-size:16px;">${creditsPurchased}</td></tr>
          <tr><td style="color:#6b7280;font-size:14px;">Amount paid</td><td align="right" style="color:#1f2937;font-weight:600;font-size:16px;">${amountPaid}</td></tr>
          <tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:12px;"></td></tr>
          <tr><td style="color:#6b7280;font-size:14px;">Total balance</td><td align="right" style="color:#9333ea;font-weight:700;font-size:20px;">${totalCredits} credits</td></tr>
        </table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#ec4899);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">Start Creating →</a>
    </td></tr></table>
    <p style="color:#9ca3af;font-size:14px;text-align:center;margin:32px 0 0;">Made with 💜 by FlipMyEra</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`,
  };
}
