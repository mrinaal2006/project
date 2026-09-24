import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserById, addUser } from '@/lib/users';

export async function POST(req: Request) {
  try {
    const { id, name, password } = await req.json();

    if (!id || !password || !name) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    if (getUserById(id)) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    addUser({ id, name, password: hashedPassword });

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error registering user' }, { status: 500 });
  }
}
