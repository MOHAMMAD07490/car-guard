import { list } from '@vercel/blob';

const token = process.env.BLOB_READ_WRITE_TOKEN;

// Simple encoding for credentials
const encodePassword = (password: string): string => {
  if (typeof btoa !== 'undefined') {
    return btoa(password);
  }
  return Buffer.from(password).toString('base64');
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const prefix = `users/${normalizedEmail}.json`;

    // Fetch user blob
    const { blobs } = await list({ prefix, token });
    if (blobs.length === 0) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const response = await fetch(blobs[0].url);
    const userPayload = await response.json();

    if (userPayload.password !== encodePassword(password)) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const userProfile = {
      id: userPayload.id,
      email: userPayload.email,
      name: userPayload.name,
      createdAt: userPayload.createdAt,
    };

    return Response.json({
      user: userProfile,
      token: `session_${userPayload.id}_${Date.now()}`,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
