import { getFedExAccessToken } from '@/lib/fedex';

export async function POST(req) {
  try {
    const rawBody = await req.text();

    if (!rawBody) {
      return new Response(JSON.stringify({ error: 'Empty request body' }), {
        status: 400,
      });
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Invalid JSON format' }), {
        status: 400,
      });
    }

    const { destinationPostalCode, weight } = body;

    if (!destinationPostalCode || !weight) {
      return new Response(
        JSON.stringify({ error: 'Missing destinationPostalCode or weight' }),
        { status: 400 }
      );
    }

    // Get FedEx OAuth token
    const token = await getFedExAccessToken();

    // Prepare FedEx Rate Request according to latest API docs
    const rateRequest = {
      accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER },
      requestedShipment: {
  dropOffType: 'REGULAR_PICKUP',
  packagingType: 'YOUR_PACKAGING',
  shipper: {
    address: {
      postalCode: '10001',
      countryCode: 'US',
    },
  },
  recipient: {
    address: {
      postalCode: destinationPostalCode,
      countryCode: 'US',
    },
  },
  pickupType: 'USE_SCHEDULED_PICKUP',
  rateRequestType: ['LIST', 'ACCOUNT'], // ✅ REQUIRED FIELD
  requestedPackageLineItems: [
    {
      weight: {
        units: 'LB',
        value: weight,
      },
    },
  ],
},

    };

    const response = await fetch(
      `${process.env.FEDEX_BASE_URL}/rate/v1/rates/quotes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rateRequest),
      }
    );
    console.log("Nandan Singh Test Response :- ",response);
    let data;
    try {
      data = await response.json();
    } catch (err) {
      const fallback = await response.text();
      return new Response(
        JSON.stringify({ error: 'FedEx response was not JSON', fallback }),
        { status: 502 }
      );
    }

    if (!response.ok) {
      // FedEx will return error details in JSON
      return new Response(JSON.stringify({ error: data }), {
        status: response.status,
      });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
