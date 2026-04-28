// lib/mailer.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(to: string, code: string) {
  await transporter.sendMail({
    from: `"VELA" <${process.env.SMTP_USER}>`,
    to,
    subject: '[VELA] 이메일 인증 코드',
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2>이메일 인증</h2>
        <p>아래 인증 코드를 입력해주세요. <strong>5분</strong> 내에 사용해야 합니다.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                    padding: 16px; background: #f4f4f4; text-align: center;">
          ${code}
        </div>
        <p style="color: #999; font-size: 12px;">본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
      </div>
    `,
  });
}
