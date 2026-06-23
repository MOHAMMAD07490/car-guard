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
  const id = url.searchParams.get('id');
  const ownerId = url.searchParams.get('ownerId');

  const userId = getAuthorizedUserId(request);
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (id) {
      const { blobs } = await list({ prefix: `cars/${id}.json`, token });
      if (blobs.length === 0) {
        return Response.json({ error: 'Car not found' }, { status: 404 });
      }
      const car = await fetchPrivateBlobJson(blobs[0].url);

      // Check ownership
      if (car.ownerId !== userId) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      return Response.json(car);
    } else if (ownerId) {
      // Check ownership of the query list
      if (ownerId !== userId) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Fetch all cars for ownerId
      const { blobs } = await list({ prefix: 'cars/', token });
      const carPromises = blobs.map(async (blob) => {
        try {
          return await fetchPrivateBlobJson(blob.url);
        } catch (e) {
          console.error('Error fetching car blob', blob.url, e);
        }
        return null;
      });

      const cars = (await Promise.all(carPromises)).filter(
        (c) => c && c.ownerId === ownerId
      );

      return Response.json(cars);
    } else {
      return Response.json({ error: 'Missing car ID or owner ID' }, { status: 400 });
    }
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = getAuthorizedUserId(request);
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const car = await request.json();
    if (!car.id || !car.carNumber || !car.phoneNumber) {
      return Response.json({ error: 'Invalid car data' }, { status: 400 });
    }

    // Ensure ownerId matches authorized user ID
    if (car.ownerId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete any existing blobs with that prefix to avoid duplicating versions
    const { blobs } = await list({ prefix: `cars/${car.id}.json`, token });
    for (const blob of blobs) {
      await del(blob.url, { token });
    }

    // Put the new blob as private
    const { url } = await put(`cars/${car.id}.json`, JSON.stringify(car), {
      access: 'private',
      token,
    });

    return Response.json({ success: true, url });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return Response.json({ error: 'Missing car ID' }, { status: 400 });
  }

  const userId = getAuthorizedUserId(request);
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { blobs } = await list({ prefix: `cars/${id}.json`, token });
    if (blobs.length > 0) {
      const car = await fetchPrivateBlobJson(blobs[0].url);
      
      // Ensure ownerId matches authorized user ID
      if (car.ownerId !== userId) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      await del(blobs[0].url, { token });
    }
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
