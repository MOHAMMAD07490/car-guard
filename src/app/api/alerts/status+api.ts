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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const carId = url.searchParams.get('carId');
    if (!carId) {
      return Response.json({ error: 'Missing carId' }, { status: 400 });
    }

    const { blobs } = await list({ prefix: `alerts/${carId}/`, token });
    let hasUnread = false;
    let lastTimestamp = 0;

    for (const blob of blobs) {
      try {
        const alert = await fetchPrivateBlobJson(blob.url);
        if (alert.timestamp > lastTimestamp) {
          lastTimestamp = alert.timestamp;
        }
        if (!alert.read) {
          hasUnread = true;
        }
      } catch (err) {
        console.error('Failed to parse alert blob:', blob.url, err);
      }
    }

    return Response.json({ hasUnread, lastTimestamp });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
