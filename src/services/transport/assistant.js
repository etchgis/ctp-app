import config from '../../config';

const assistant = {

  v1: {

    chat(message, origin, reset, accessToken) {
      let payload = {
        message,
        origin,
        center: {
          lat: config.MAP.CENTER[0],
          lng: config.MAP.CENTER[1]
        },
        shouldReset: reset
      };
      return fetch(`${config.SERVICES.assistant.url}/chat`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-api-key': config.SERVICES.assistant.xApiKey,
        },
      }).then(async (response) => {
        const json = await response.json();
        if (response.status === 200) {
          return json;
        }
        throw json;
      }).catch((err) => {
        console.log(err);
        throw err;
      });
    },

  },

  v2: {

    chat(message, origin, state, accessToken) {
      let payload = {
        message,
        origin,
        center: {
          lat: config.MAP.CENTER[0],
          lng: config.MAP.CENTER[1]
        },
        state
      };
      return fetch(`${config.SERVICES.assistant.url}/v2/chat`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-api-key': config.SERVICES.assistant.xApiKey,
        },
      }).then(async (response) => {
        const json = await response.json();
        if (response.status === 200) {
          return json;
        }
        throw json;
      }).catch((err) => {
        console.log(err);
        throw err;
      });
    },

  }


};

export default assistant;