import { list, put, del } from '@vercel/blob';

const token = process.env.BLOB_READ_WRITE_TOKEN || 
              process.env['BLOB_READ_WRITE_TOKEN'] || 
              process.env.EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN || 
              process.env['EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN'];

function getAuthorizedUserId(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer session_')) {
    return null;
  }
  return authHeader.replace('Bearer session_', '').split('_')[0] || null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const carIdsParam = url.searchParams.get('carIds');
  if (!carIdsParam) {
    return Response.json({ alerts: [] });
  }

  const userId = getAuthorizedUserId(request);
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const carIds = carIdsParam.split(',').filter(Boolean);
  const allAlerts: any[] = [];

  try {
    // Restrict fetching alerts to ONLY cars owned by the authenticated userId
    const { blobs: carBlobs } = await list({ prefix: 'cars/', token });
    const carPromises = carBlobs.map(async (blob) => {
      try {
        const res = await fetch(blob.url);
        if (res.ok) {
          return await res.json();
        }
      } catch {}
      return null;
    });

    const ownedCarIds = (await Promise.all(carPromises))
      .filter((c) => c && c.ownerId === userId)
      .map((c) => c.id);

    // Only process requested carIds that are actually owned by this user
    const allowedCarIds = carIds.filter((id) => ownedCarIds.includes(id));

    for (const carId of allowedCarIds) {
      const { blobs } = await list({ prefix: `alerts/${carId}/`, token });
      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url);
          const alert = await response.json();
          allAlerts.push(alert);
        } catch (e) {
          console.error(`Failed to fetch alert blob ${blob.url}:`, e);
        }
      }
    }
    // Sort alerts by timestamp descending
    allAlerts.sort((a, b) => b.timestamp - a.timestamp);
    return Response.json({ alerts: allAlerts });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const alert = await request.json();
    if (!alert.id || !alert.carId || !alert.alertType || !alert.message) {
      return Response.json({ error: 'Invalid alert data' }, { status: 400 });
    }

    // Visitors scan the QR code and alert the owner anonymously, so this endpoint remains public.
    // However, the blob itself is stored securely as private.
    const { url } = await put(`alerts/${alert.carId}/${alert.id}.json`, JSON.stringify(alert), {
      access: 'private',
      token,
    });

    return Response.json({ success: true, url });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const userId = getAuthorizedUserId(request);
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { alertId, carId } = await request.json();
    if (!alertId || !carId) {
      return Response.json({ error: 'Missing alertId or carId' }, { status: 400 });
    }

    // Verify ownership of the car before updating alerts
    const { blobs: carBlobs } = await list({ prefix: `cars/${carId}.json`, token });
    if (carBlobs.length === 0) {
      return Response.json({ error: 'Car not found' }, { status: 404 });
    }
    const carResponse = await fetch(carBlobs[0].url);
    const car = await carResponse.json();
    if (car.ownerId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const prefix = `alerts/${carId}/${alertId}.json`;
    const { blobs } = await list({ prefix, token });
    if (blobs.length === 0) {
      return Response.json({ error: 'Alert not found' }, { status: 404 });
    }

    const response = await fetch(blobs[0].url);
    const alert = await response.json();
    alert.read = true;

    // Delete the old one
    await del(blobs[0].url, { token });

    // Write the updated one as private
    await put(prefix, JSON.stringify(alert), {
      access: 'private',
      token,
    });

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
