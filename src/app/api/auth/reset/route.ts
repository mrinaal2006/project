import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserById, updateUser } from '@/lib/users';

export async function POST(req: Request) {
  try {
    const { id, newPassword } = await req.json();

    if (!id || !newPassword) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUser(id, { password: hashedPassword });

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error resetting password' }, { status: 500 });
  }
}
