import { contactSchema } from '@/schemas/contact-schema';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// 메일 헤더(제목/발신자명)에 들어가는 값은 개행을 제거한다(헤더 인젝션 방지).
const singleLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

// 로그인 없이도 호출되는 공개 엔드포인트(welcome 문의 섹션).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: 400,
          message:
            parsed.error.issues[0]?.message ?? '입력값을 다시 확인해주세요.',
        },
        { status: 400 },
      );
    }

    const { title, content, authorEmail, author, website } = parsed.data;

    // honeypot에 값이 있으면 봇. 실패를 알려주면 우회하므로 조용히 성공 처리.
    if (website) {
      return NextResponse.json(
        { code: 200, message: '메일이 성공적으로 전송되었습니다.' },
        { status: 200 },
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
      from: `"${singleLine(author)}" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: authorEmail,
      subject: `[V E L A] ${singleLine(title)}`,
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
