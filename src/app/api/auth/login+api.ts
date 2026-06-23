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

const LIMIT_ATTEMPTS = 5;
const LOCK_TIME = 60 * 1000; // 1 minute lockout
const attemptsMap = new Map<string, { count: number; lockUntil: number }>();

function isRateLimited(key: string): { limited: boolean; timeLeft: number } {
  const record = attemptsMap.get(key);
  if (!record) return { limited: false, timeLeft: 0 };
  
  const now = Date.now();
  if (record.lockUntil > now) {
    return { limited: true, timeLeft: Math.ceil((record.lockUntil - now) / 1000) };
  }
  
  if (record.lockUntil > 0 && record.lockUntil <= now) {
    attemptsMap.delete(key);
  }
  
  return { limited: false, timeLeft: 0 };
}

function recordAttempt(key: string, success: boolean) {
  const record = attemptsMap.get(key) || { count: 0, lockUntil: 0 };
  if (success) {
    attemptsMap.delete(key);
    return;
  }
  
  record.count += 1;
  if (record.count >= LIMIT_ATTEMPTS) {
    record.lockUntil = Date.now() + LOCK_TIME;
  }
  attemptsMap.set(key, record);
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const emailKey = `email_${normalizedEmail}`;
    const ipKey = `ip_${ip}`;

    const emailLimit = isRateLimited(emailKey);
    const ipLimit = isRateLimited(ipKey);

    if (emailLimit.limited) {
      return Response.json({ error: `Too many login attempts. Please try again in ${emailLimit.timeLeft} seconds.` }, { status: 429 });
    }
    if (ipLimit.limited) {
      return Response.json({ error: `Too many login attempts from this connection. Please try again in ${ipLimit.timeLeft} seconds.` }, { status: 429 });
    }

    const prefix = `users/${normalizedEmail}.json`;

    // Fetch user blob
    const { blobs } = await list({ prefix, token });
    if (blobs.length === 0) {
      recordAttempt(emailKey, false);
      recordAttempt(ipKey, false);
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const userPayload = await fetchPrivateBlobJson(blobs[0].url);

    if (userPayload.password !== encodePassword(password)) {
      recordAttempt(emailKey, false);
      recordAttempt(ipKey, false);
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Success
    recordAttempt(emailKey, true);
    recordAttempt(ipKey, true);

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
