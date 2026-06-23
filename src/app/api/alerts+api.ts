import { list, put, del } from '@vercel/blob';

const token = process.env.BLOB_READ_WRITE_TOKEN;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const carIdsParam = url.searchParams.get('carIds');
  if (!carIdsParam) {
    return Response.json({ alerts: [] });
  }

  const carIds = carIdsParam.split(',').filter(Boolean);
  const allAlerts: any[] = [];

  try {
    for (const carId of carIds) {
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

    const { url } = await put(`alerts/${alert.carId}/${alert.id}.json`, JSON.stringify(alert), {
      access: 'public',
      token,
    });

    return Response.json({ success: true, url });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { alertId, carId } = await request.json();
    if (!alertId || !carId) {
      return Response.json({ error: 'Missing alertId or carId' }, { status: 400 });
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

    // Write the updated one
    await put(prefix, JSON.stringify(alert), {
      access: 'public',
      token,
    });

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
