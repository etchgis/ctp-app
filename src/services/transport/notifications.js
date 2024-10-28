import { Platform } from 'react-native';
import config from '../../config';

const notifications = {

  devices: {

    register(deviceToken, accessToken) {
      return fetch(`${config.SERVICES.notifications.url}/devices/register`, {
        method: 'POST',
        body: JSON.stringify({
          token: deviceToken,
          application: 'completeTrip',
          platform: Platform.OS,
        }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-api-key': config.SERVICES.notifications.xApiKey,
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

  queue(type, tripId, fromMode, toMode, accessToken) {
    let payload = {
      type,
      tripId,
    };
    if (type === 'dependentModeChange') {
      payload.fromMode = fromMode;
      payload.toMode = toMode;
    }
    return fetch(`${config.SERVICES.notifications.url}/queue`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.notifications.xApiKey,
      },
    }).then(async (response) => {
      console.log(response.status);
      if (response.status === 200) {
        return true;
      }
      throw { message: 'Unknown error' };
    }).catch((err) => {
      throw err;
    });
  },

};

export default notifications;
