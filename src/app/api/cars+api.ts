import { list, put, del } from '@vercel/blob';

const token = process.env.BLOB_READ_WRITE_TOKEN;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return Response.json({ error: 'Missing car ID' }, { status: 400 });
  }

  try {
    const { blobs } = await list({ prefix: `cars/${id}.json`, token });
    if (blobs.length === 0) {
      return Response.json({ error: 'Car not found' }, { status: 404 });
    }
    const response = await fetch(blobs[0].url);
    const car = await response.json();
    return Response.json(car);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const car = await request.json();
    if (!car.id || !car.carNumber || !car.phoneNumber) {
      return Response.json({ error: 'Invalid car data' }, { status: 400 });
    }

    // Delete any existing blobs with that prefix to avoid duplicating versions
    const { blobs } = await list({ prefix: `cars/${car.id}.json`, token });
    for (const blob of blobs) {
      await del(blob.url, { token });
    }

    // Put the new blob
    const { url } = await put(`cars/${car.id}.json`, JSON.stringify(car), {
      access: 'public',
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

  try {
    const { blobs } = await list({ prefix: `cars/${id}.json`, token });
    for (const blob of blobs) {
      await del(blob.url, { token });
    }
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
