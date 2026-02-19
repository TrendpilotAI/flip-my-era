export interface WelcomeEmailData {
  userName: string;
  createEbookUrl?: string;
}

export function welcomeEmail(data: WelcomeEmailData): { subject: string; html: string } {
  const { userName, createEbookUrl = 'https://flipmyera.com' } = data;
  return {
    subject: `Welcome to FlipMyEra, ${userName}! ✨`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f4ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4ff;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.1);">
  <tr><td style="background:linear-gradient(135deg,#9333ea,#ec4899);padding:40px 40px 30px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">✨ Welcome to FlipMyEra</h1>
    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px;">Your personalized Taylor Swift story awaits</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#1f2937;font-size:18px;margin:0 0 16px;">Hey ${userName}! 💜</p>
    <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Welcome to the Swiftie universe! You're now part of a community that turns their love for Taylor Swift into personalized ebook adventures.</p>
    <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Pick your favorite era, customize your character, and we'll generate a one-of-a-kind story just for you.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${createEbookUrl}" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#ec4899);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">Create Your First Ebook →</a>
    </td></tr></table>
    <p style="color:#9ca3af;font-size:14px;text-align:center;margin:32px 0 0;">Made with 💜 by FlipMyEra</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`,
  };
}
