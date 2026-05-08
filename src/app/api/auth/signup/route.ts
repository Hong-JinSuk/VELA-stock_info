import { prisma } from '@/lib/prisma';
import { getNextCycleEnd, ROLE_LIMITS } from '@/types/user';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json();

    // 중복 방지 로직
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: '이미 가입된 이메일입니다.' },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const now = new Date();

    // 💡 유저와 사용량(UserUsage)을 동시에 생성 (Nested Write)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'FREE',
        usage: {
          create: {
            maxLimit: ROLE_LIMITS['FREE'],
            usedCount: 0,
            cycleStart: now,
            cycleEnd: getNextCycleEnd('FREE', now),
          },
        },
      },
      // 💡 가입 직후 프론트엔드에서 바로 남은 횟수를 보여줄 수 있도록 usage 데이터 포함 반환
      include: {
        usage: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Signup Error:', error); // 디버깅을 위한 에러 로그
    return NextResponse.json(
      { message: '회원가입에 실패했습니다.', status: 500, result: null },
      { status: 500 },
    );
  }
}

// // src/app/api/auth/signup/route.ts
// import { prisma } from '@/lib/prisma';
// import bcrypt from 'bcryptjs';
// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(req: NextRequest) {
//   try {
//     const { email, name, password } = await req.json();

//     // 중복 방지 로직
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return NextResponse.json(
//         { message: '이미 가입된 이메일입니다.' },
//         { status: 400 },
//       );
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = await prisma.user.create({
//       data: { email, name, password: hashedPassword },
//     });

//     return NextResponse.json({ user }, { status: 201 });
//   } catch (error) {
//     return NextResponse.json(
//       { message: '회원가입에 실패했습니다.', status: 500, result: null },
//       { status: 500 },
//     );
//   }
// }
