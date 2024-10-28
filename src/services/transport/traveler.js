import config from '../../config';

const traveler = {

  caregivers: {

    invite(email, firstName, lastName, accessToken) {
      return fetch(`${config.SERVICES.caregivers.url}`, {
        method: 'POST',
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          sendgridEnvironment: config.ENV === 'dev' ? '-dev' : config.ENV === 'stage' ? '-stage' : '',
        }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-api-key': config.SERVICES.caregivers.xApiKey,
        },
      }).then(async (response) => {
        const json = await response.json();
        if (response.status === 201) {
          return json;
        }
        throw json?.message || json?.error?.reason;
      }).catch((err) => {
        throw err;
      });
    },

    reinvite(id, accessToken) {
      return fetch(`${config.SERVICES.caregivers.url}/${id}/reinvite`, {
        method: 'POST',
        body: JSON.stringify({
          sendgridEnvironment: config.ENV === 'dev' ? '-dev' : config.ENV === 'stage' ? '-stage' : '',
        }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-api-key': config.SERVICES.caregivers.xApiKey,
        },
      }).then(async (response) => {
        console.log(response.status);
        const json = await response.json();
        if (response.status === 200) {
          return json;
        }
        throw json?.message || json?.error?.reason;
      }).catch((err) => {
        throw err;
      });
    },

    get: {

      all(accessToken) {
        return fetch(`${config.SERVICES.caregivers.url}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config.SERVICES.caregivers.xApiKey,
          },
        }).then(async (response) => {
          const json = await response.json();
          if (response.status === 200) {
            return json;
          }
          throw json?.message || json?.error?.reason;
        }).catch((err) => {
          throw err;
        });
      },

      approved(accessToken) {
        return fetch(`${config.SERVICES.caregivers.url}?status=approved`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config.SERVICES.caregivers.xApiKey,
          },
        }).then(async (response) => {
          const json = await response.json();
          if (response.status === 200) {
            return json;
          }
          throw json?.message || json?.error?.reason;
        }).catch((err) => {
          throw err;
        });
      },

      received(accessToken) {
        return fetch(`${config.SERVICES.caregivers.url}?status=received`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config.SERVICES.caregivers.xApiKey,
          },
        }).then(async (response) => {
          const json = await response.json();
          if (response.status === 200) {
            return json;
          }
          throw json?.message || json?.error?.reason;
        }).catch((err) => {
          throw err;
        });
      },

      pending(accessToken) {
        return fetch(`${config.SERVICES.caregivers.url}?status=pending`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config.SERVICES.caregivers.xApiKey,
          },
        }).then(async (response) => {
          const json = await response.json();
          if (response.status === 200) {
            return json;
          }
          throw json?.message || json?.error?.reason;
        }).catch((err) => {
          throw err;
        });
      },

      byId(id, accessToken) {
        return fetch(`${config.SERVICES.caregivers.url}/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config.SERVICES.caregivers.xApiKey,
          },
        }).then(async (response) => {
          const json = await response.json();
          if (response.status === 200) {
            return json;
          }
          throw json?.message || json?.error?.reason;
        }).catch((err) => {
          throw err;
        });
      },

    },

    delete(id, accessToken) {
      return fetch(`${config.SERVICES.caregivers.url}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-api-key': config.SERVICES.caregivers.xApiKey,
        },
      }).then(async (response) => {
        if (response.status === 200) {
          return true;
        }
        throw { message: 'Unknown error' };
      }).catch((err) => {
        throw err;
      });
    },

  },

  dependents: {

    get: {

      all(accessToken) {
        return fetch(`${config.SERVICES.caregivers.url}/dependents`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config.SERVICES.caregivers.xApiKey,
          },
        }).then(async (response) => {
          const json = await response.json();
          if (response.status === 200) {
            return json;
          }
          throw json?.message || json?.error?.reason;
        }).catch((err) => {
          throw err;
        });
      },

      byId(id, accessToken) {
        return fetch(`${config.SERVICES.caregivers.url}/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config.SERVICES.caregivers.xApiKey,
          },
        }).then(async (response) => {
          const json = await response.json();
          if (response.status === 200) {
            return json;
          }
          throw json?.message || json?.error?.reason;
        }).catch((err) => {
          throw err;
        });
      },

    },

    update: {

      status(caregiverId, userId, status, accessToken) {
        return fetch(`${config.SERVICES.caregivers.url}/${caregiverId}`, {
          method: 'PUT',
          body: JSON.stringify({
            user: userId,
            status,
          }),
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config.SERVICES.caregivers.xApiKey,
          },
        }).then(async (response) => {
          const json = await response.json();
          if (response.status === 200) {
            return json;
          }
          throw json?.message || json?.error?.reason;
        }).catch((err) => {
          throw err;
        });
      },

    },

    delete(id, accessToken) {
      return fetch(`${config.SERVICES.caregivers.url}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-api-key': config.SERVICES.caregivers.xApiKey,
        },
      }).then(async (response) => {
        if (response.status === 200) {
          return true;
        }
        throw { message: 'Unknown error' };
      }).catch((err) => {
        throw err;
      });
    },

  },

};

export default traveler;
