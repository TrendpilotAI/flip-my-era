export interface EbookReadyData {
  userName: string;
  ebookTitle: string;
  eraName: string;
  previewUrl: string;
  downloadUrl: string;
}

export function ebookReadyEmail(data: EbookReadyData): { subject: string; html: string } {
  const { userName, ebookTitle, eraName, previewUrl, downloadUrl } = data;
  return {
    subject: `Your "${ebookTitle}" ebook is ready! 📖`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f4ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4ff;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.1);">
  <tr><td style="background:linear-gradient(135deg,#9333ea,#ec4899);padding:40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:28px;">📖 Your Ebook is Ready!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#1f2937;font-size:18px;margin:0 0 16px;">Hey ${userName}!</p>
    <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Your <strong>${eraName}</strong> era ebook "<strong>${ebookTitle}</strong>" has been generated and is ready to read!</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td align="center" style="padding:0 0 12px;">
        <a href="${previewUrl}" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#ec4899);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">Read Online →</a>
      </td>
    </tr><tr>
      <td align="center">
        <a href="${downloadUrl}" style="display:inline-block;border:2px solid #9333ea;color:#9333ea;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">Download PDF</a>
      </td>
    </tr></table>
    <p style="color:#9ca3af;font-size:14px;text-align:center;margin:32px 0 0;">Made with 💜 by FlipMyEra</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`,
  };
}
