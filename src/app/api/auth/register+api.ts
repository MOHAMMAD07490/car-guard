import { list, put } from '@vercel/blob';

const token = process.env.BLOB_READ_WRITE_TOKEN || 
              process.env['BLOB_READ_WRITE_TOKEN'] || 
              process.env.EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN || 
              process.env['EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN'];

// Simple encoding for credentials
const encodePassword = (password: string): string => {
  if (typeof btoa !== 'undefined') {
    return btoa(password);
  }
  return Buffer.from(password).toString('base64');
};

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password || !name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const prefix = `users/${normalizedEmail}.json`;

    // Check if user already exists
    const { blobs } = await list({ prefix, token });
    if (blobs.length > 0) {
      return Response.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const userId = Math.random().toString(36).substring(2, 11);
    const userPayload = {
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      password: encodePassword(password),
      createdAt: Date.now(),
    };

    // Save to Vercel Blob as private
    await put(prefix, JSON.stringify(userPayload), {
      access: 'private',
      token,
    });

    const userProfile = {
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      createdAt: userPayload.createdAt,
    };

    return Response.json({
      user: userProfile,
      token: `session_${userId}_${Date.now()}`,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
