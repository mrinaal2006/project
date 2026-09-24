import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { source_code, language_id, stdin } = await req.json();

    if (!source_code || !language_id) {
      return NextResponse.json({ error: 'Missing source_code or language_id' }, { status: 400 });
    }

    const response = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_code,
        language_id,
        stdin: stdin || "",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({ error: 'Judge0 API Error', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
