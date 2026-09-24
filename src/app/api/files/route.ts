import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserFileSystem, createItem, saveFileContent, getFileContent } from '@/lib/files';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Session expired. Please log out and log back in.' }, { status: 401 });
  }

  const url = new URL(req.url);
  const getPath = url.searchParams.get('path');

  try {
    if (getPath !== null) {
      // Get file content
      const content = await getFileContent((session.user as any).id, getPath);
      return NextResponse.json({ content });
    } else {
      // Get file tree
      const tree = await getUserFileSystem((session.user as any).id);
      return NextResponse.json({ tree });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Session expired. Please log out and log back in.' }, { status: 401 });
  }

  try {
    const { path, type } = await req.json();
    if (!path || !type) {
      return NextResponse.json({ error: 'Missing path or type' }, { status: 400 });
    }

    await createItem((session.user as any).id, path, type);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Session expired. Please log out and log back in.' }, { status: 401 });
  }

  try {
    const { path, content } = await req.json();
    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    await saveFileContent((session.user as any).id, path, content || '');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
