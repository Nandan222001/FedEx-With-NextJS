export async function getFedExAccessToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.FEDEX_API_KEY);
  params.append('client_secret', process.env.FEDEX_API_SECRET);

  const response = await fetch(`${process.env.FEDEX_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
//   console.log("Nandan Singh :- ",response);
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const err = await response.json();
      throw new Error('FedEx Auth Failed: ' + JSON.stringify(err));
    } else {
      const errText = await response.text();
      throw new Error('FedEx Auth Failed (Non-JSON): ' + errText);
    }
  }

  const data = await response.json();
  return data.access_token;
}