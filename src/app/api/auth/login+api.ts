import { list, get } from '@vercel/blob';

const token = process.env.BLOB_READ_WRITE_TOKEN || 
              process.env['BLOB_READ_WRITE_TOKEN'] || 
              process.env.EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN || 
              process.env['EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN'];

async function fetchPrivateBlobJson(url: string): Promise<any> {
  const blob = await get(url, { access: 'private', token });
  if (!blob) {
    throw new Error('Blob not found');
  }
  return new Response(blob.stream).json();
}

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

    const userPayload = await fetchPrivateBlobJson(blobs[0].url);

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
