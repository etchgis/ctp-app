import config from '../../config';

const trips = {

  add(userId, organizationId, datetime, origin, destination, plan, accessToken) {
    return fetch(`${config.SERVICES.trips.url}`, {
      method: 'POST',
      body: JSON.stringify({
        rider: userId,
        organization: organizationId,
        datetime,
        origin,
        destination,
        plan,
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.trips.xApiKey,
      },
    }).then(async (response) => {
      const json = await response.json();
      if (response.status === 200) {
        return json;
      }
      throw json?.message || json?.error.reason;
    }).catch((err) => {
      throw err;
    });
  },

  delete(tripId, accessToken) {
    return fetch(`${config.SERVICES.trips.url}/${tripId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.trips.xApiKey,
      },
    }).then(async (response) => {
      if (response.status === 204) {
        return true;
      }
      throw { message: 'Unknown error' };
    }).catch((err) => {
      throw err;
    });
  },

  get(datetime, accessToken) {
    return fetch(`${config.SERVICES.trips.url}?datetime=${datetime}&timezone=America/New_York`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.trips.xApiKey,
      },
    }).then(async (response) => {
      const json = await response.json();
      if (response.status === 200) {
        return json;
      }
      throw json?.message || json?.error.reason;
    }).catch((err) => {
      throw err;
    });
  },

  getRange(from, to, accessToken) {
    return fetch(`${config.SERVICES.trips.url}?from=${from}&to=${to}&timezone=America/New_York`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.trips.xApiKey,
      },
    }).then(async (response) => {
      const json = await response.json();
      if (response.status === 200) {
        return json;
      }
      throw json?.message || json?.error.reason;
    }).catch((err) => {
      throw err;
    });
  },

  getDependentsRange(id, from, to, accessToken) {
    return fetch(`${config.SERVICES.trips.url}/dependents/${id}?from=${from}&to=${to}&timezone=America/New_York`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.trips.xApiKey,
      },
    }).then(async (response) => {
      const json = await response.json();
      if (response.status === 200) {
        return json;
      }
      throw json?.message || json?.error.reason;
    }).catch((err) => {
      throw err;
    });
  },

  update: {

    plan(id, plan, accessToken) {
      return fetch(`${config.SERVICES.trips.url}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ plan }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-api-key': config.SERVICES.trips.xApiKey,
        },
      }).then(async (response) => {
        const json = await response.json();
        if (response.status === 200) {
          return json;
        }
        throw json?.message || json?.error.reason;
      }).catch((err) => {
        throw err;
      });
    },

  },

};

export default trips;
