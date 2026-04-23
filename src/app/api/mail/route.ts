import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { title, content, authorEmail, author } = await req.json();

    // 1. 유효성 검사 (최소한의 방어 로직)
    if (!title || !content || !authorEmail) {
      return NextResponse.json(
        { code: 400, message: '필수 입력 항목이 누락되었습니다.' },
        { status: 400 },
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // 반드시 '앱 비밀번호' 사용
      },
    });

    const mailOptions = {
      from: `"${author}" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: authorEmail,
      subject: `[V E L A] ${title}`,
      text: `
[새로운 건의사항 접수]

■ 작성자: ${author} (${authorEmail})
■ 제목: ${title}

■ 내용:
${content}

--------------------------------------------------
이 메일은 시스템에서 자동 발송되었습니다.
회신하시려면 이 메일에 바로 '답장'을 눌러주세요.
      `,
    };

    await transporter.sendMail(mailOptions);

    // 인터셉터 규격에 맞춰 code: 200 포함
    return NextResponse.json(
      {
        code: 200,
        message: '메일이 성공적으로 전송되었습니다.',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('SMTP 전송 에러:', error);

    // 두 번째 인자에는 status만 전달
    return NextResponse.json(
      {
        code: 500,
        message: '메일 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 },
    );
  }
}
