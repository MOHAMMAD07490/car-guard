import { list, put, del, get } from '@vercel/blob';

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
        return await fetchPrivateBlobJson(blob.url);
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
          const alert = await fetchPrivateBlobJson(blob.url);
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

    // Send push notification to owner
    try {
      const { blobs: carBlobs } = await list({ prefix: `cars/${alert.carId}.json`, token });
      if (carBlobs.length > 0) {
        const car = await fetchPrivateBlobJson(carBlobs[0].url);
        const ownerId = car.ownerId;

        if (ownerId) {
          const { blobs: userBlobs } = await list({ prefix: 'users/', token });
          for (const uBlob of userBlobs) {
            try {
              const user = await fetchPrivateBlobJson(uBlob.url);
              if (user.id === ownerId && user.pushToken) {
                // Sound name matches Android raw resource mixkit_vintage_warning_alarm_990
                await fetch('https://exp.host/--/api/v2/push/send', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'accept-encoding': 'gzip, deflate',
                  },
                  body: JSON.stringify({
                    to: user.pushToken,
                    title: 'QRNote Security Alert',
                    body: `${alert.message}${alert.senderNote ? `: ${alert.senderNote}` : ''}`,
                    sound: 'custom', // Specify custom sound play
                    channelId: 'default',
                    data: { carId: alert.carId, alertId: alert.id },
                  }),
                });
                break;
              }
            } catch (err) {
              console.warn('Failed to parse user push token:', err);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to dispatch push notification:', e);
    }

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
    const car = await fetchPrivateBlobJson(carBlobs[0].url);
    if (car.ownerId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const prefix = `alerts/${carId}/${alertId}.json`;
    const { blobs } = await list({ prefix, token });
    if (blobs.length === 0) {
      return Response.json({ error: 'Alert not found' }, { status: 404 });
    }

    const alert = await fetchPrivateBlobJson(blobs[0].url);
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
