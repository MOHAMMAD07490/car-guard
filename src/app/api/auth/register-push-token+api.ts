import { list, put, get } from '@vercel/blob';

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

export async function POST(request: Request) {
  try {
    const { userId, pushToken } = await request.json();
    if (!userId || !pushToken) {
      return Response.json({ error: 'Missing userId or pushToken' }, { status: 400 });
    }

    const { blobs } = await list({ prefix: 'users/', token });
    for (const blob of blobs) {
      try {
        const user = await fetchPrivateBlobJson(blob.url);
        if (user.id === userId) {
          user.pushToken = pushToken;
          const email = user.email.toLowerCase().trim();
          
          // Overwrite the user blob with updated pushToken
          await put(`users/${email}.json`, JSON.stringify(user), {
            access: 'private',
            token,
          });
          return Response.json({ success: true });
        }
      } catch (err) {
        console.error('Failed to parse user blob:', blob.url, err);
      }
    }
    return Response.json({ error: 'User not found' }, { status: 404 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
