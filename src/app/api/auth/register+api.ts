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

const REG_LIMIT = 3;
const REG_COOLDOWN = 10 * 60 * 1000; // 10 minutes
const ipRegAttempts = new Map<string, { count: number; lockUntil: number }>();

function checkRegistrationLimit(ip: string): { limited: boolean; timeLeft: number } {
  const record = ipRegAttempts.get(ip);
  if (!record) return { limited: false, timeLeft: 0 };
  
  const now = Date.now();
  if (record.lockUntil > now) {
    return { limited: true, timeLeft: Math.ceil((record.lockUntil - now) / 1000) };
  }
  
  if (record.lockUntil > 0 && record.lockUntil <= now) {
    ipRegAttempts.delete(ip);
  }
  
  return { limited: false, timeLeft: 0 };
}

function recordRegistrationAttempt(ip: string) {
  const record = ipRegAttempts.get(ip) || { count: 0, lockUntil: 0 };
  record.count += 1;
  if (record.count >= REG_LIMIT) {
    record.lockUntil = Date.now() + REG_COOLDOWN;
  }
  ipRegAttempts.set(ip, record);
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const regCheck = checkRegistrationLimit(ip);
    if (regCheck.limited) {
      return Response.json({ error: `Registration limit reached. Please try again in ${regCheck.timeLeft} seconds.` }, { status: 429 });
    }

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

    recordRegistrationAttempt(ip);

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
