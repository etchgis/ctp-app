import config from '../../config';

const rides = {

  request(userId, organizationId, datetime, direction, pickup, dropoff, driverId, passengers, accessToken) {
    const body = {
      rider: userId,
      organization: organizationId,
      datetime,
      direction,
      pickup,
      dropoff,
      status: 'scheduled',
    };
    if (driverId) {
      body.driver = driverId;
    }
    body.passengers = passengers || 1;
    return fetch(`${config.SERVICES.rides.url}/request`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.rides.xApiKey,
      },
    }).then(async (response) => {
      // TODO: remove this once planning service auto-detects ride changes
      const json = await response.json();
      if (response.status === 200) {
        fetch(`${config.SERVICES.plans.url}/ride/${json.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Organization-Id': organizationId,
            'x-api-key': config.SERVICES.plans.xApiKey,
          },
        });
        return json;
      }
      throw json?.message || json?.error.reason;
    }).catch((err) => {
      throw err;
    });
  },

  cancel(rideId, organizationId, accessToken) {
    return fetch(`${config.SERVICES.rides.url}/updateStatus/${rideId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'canceled',
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.rides.xApiKey,
      },
    }).then(async (response) => {
      // TODO: remove this once planning service auto-detects ride changes
      const json = await response.json();
      if (response.status === 200) {
        fetch(`${config.SERVICES.plans.url}/ride/${rideId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Organization-Id': organizationId,
            'x-api-key': config.SERVICES.plans.xApiKey,
          },
        });
        return json;
      }
      throw json?.message || json?.error.reason;
    }).catch((err) => {
      throw err;
    });
  },

};

export default rides;
