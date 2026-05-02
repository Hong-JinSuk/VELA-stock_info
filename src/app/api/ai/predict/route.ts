import { ai, errorMessage } from '@/lib/ai/gemini';
import { getPredictPrompt } from '@/lib/ai/prompts';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { stockName, refinedData } = await request.json();

    if (!stockName) {
      return NextResponse.json(
        { message: '종목명이 필요합니다.' },
        { status: 400 },
      );
    }

    console.log('============ Start Predict ============');

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: getPredictPrompt(stockName, refinedData ?? ''),
      config: {
        temperature: 0.1,
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = '';
    for await (const chunk of stream) {
      fullText += chunk.text;
    }

    console.log('============ End Predict ============');

    // JSON 추출
    const startIndex = fullText.indexOf('{');
    const endIndex = fullText.lastIndexOf('}');

    let cleanText: string;
    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      cleanText = fullText.substring(startIndex, endIndex + 1);
    } else {
      cleanText = fullText
        .replace(/^```json\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
    }

    const result = JSON.parse(cleanText);

    if (result.isValidStock === false) {
      return NextResponse.json(
        { message: '유효하지 않은 종목이거나 분석할 수 없습니다.' },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Predict Route Error:', error);

    const status = error.response?.status || error.status || 500;
    const message = errorMessage[status] || '알 수 없는 오류가 발생했습니다.';

    return NextResponse.json(
      {
        message,
        debug:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status },
    );
  }
}

// export async function POST(request: Request) {
//   try {
//     const { stockName, refinedData } = await request.json();

//     if (!stockName) {
//       return new Response(JSON.stringify({ message: '종목명이 필요합니다.' }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     console.log(`============ Start Predict Stream: ${stockName} ============`);

//     const stream = await ai.models.generateContentStream({
//       model: 'gemini-2.5-flash',
//       contents: getPredictPrompt(stockName, refinedData ?? ''),
//       config: {
//         temperature: 0.1,
//         tools: [{ googleSearch: {} }],
//       },
//     });

//     // 💡 핵심: ReadableStream을 만들어 청크가 생길 때마다 전송
//     const readableStream = new ReadableStream({
//       async start(controller) {
//         try {
//           for await (const chunk of stream) {
//             if (chunk.text) {
//               controller.enqueue(new TextEncoder().encode(chunk.text));
//             }
//           }
//           console.log('============ End Predict Stream ============');
//           controller.close();
//         } catch (error) {
//           console.error('Stream Generation Error:', error);
//           controller.error(error);
//         }
//       },
//     });

//     // 💡 NextResponse.json() 대신 순수 Response 객체로 스트림 반환
//     return new Response(readableStream, {
//       headers: {
//         'Content-Type': 'text/plain; charset=utf-8',
//         'Transfer-Encoding': 'chunked',
//       },
//     });
//   } catch (error: any) {
//     console.error('Predict Route Error:', error);
//     const status = error.response?.status || error.status || 500;
//     const message = errorMessage[status] || '알 수 없는 오류가 발생했습니다.';

//     return new Response(
//       JSON.stringify({
//         message,
//         debug:
//           process.env.NODE_ENV === 'development' ? error.message : undefined,
//       }),
//       { status, headers: { 'Content-Type': 'application/json' } },
//     );
//   }
// }
