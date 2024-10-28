import config from '../../config';

const authentication = {

  refreshAccessToken(refreshToken) {
    return fetch(`${config.SERVICES.auth.url}/accessToken`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
      },
    }).then(async (response) => {
      console.log('got refresh token response');
      const json = await response.json();
      if (response.status === 200) {
        return json;
      }
      throw json?.message || json?.error.reason;
    }).catch((err) => {
      throw err;
    });
  },

  login(email, password, source) {
    return fetch(`${config.SERVICES.auth.url}/login?source=${source}`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
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

  get(accessToken) {
    return fetch(`${config.SERVICES.auth.url}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
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

  register(email, phone, organization, password, profile) {
    console.log({
      email,
      phone,
      password,
      profile,
      role: 'rider',
      organization,
    });
    console.log('PROFILE', profile);
    return fetch(`${config.SERVICES.auth.url}/register`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        phone,
        password,
        profile,
        role: 'rider',
        organization,
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
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

  verify(channel, to) {
    var data = {
      channel,
      to,
      sid: config.VERIFY.SID,
    };
    if (channel === 'email') {
      data.channelConfiguration = config.VERIFY.CHANNEL_CONFIGURATION;
    }
    return fetch(`${config.SERVICES.auth.url}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
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

  confirm(to, code) {
    return fetch(`${config.SERVICES.auth.url}/confirm`, {
      method: 'POST',
      body: JSON.stringify({
        sid: config.VERIFY.SID,
        to,
        code,
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
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

  update(profile, accessToken) {
    return fetch(`${config.SERVICES.auth.url}`, {
      method: 'PATCH',
      body: JSON.stringify(profile),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
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

  updatePassword(oldPassword, password, accessToken) {
    return fetch(`${config.SERVICES.auth.url}`, {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, password }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
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

  updatePhone(phone, accessToken) {
    return fetch(`${config.SERVICES.auth.url}`, {
      method: 'PATCH',
      body: JSON.stringify({ phone }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
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

  activate(token) {
    return fetch(`${config.SERVICES.verifications.url}/codes/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.verifications.xApiKey,
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

  registerDevice(identity, address, bindingType, accessToken) {
    console.log(`registering device with ID ${identity}`);
    return fetch(`${config.SERVICES.auth.url}/devices`, {
      method: 'POST',
      body: JSON.stringify({
        identity,
        address,
        bindingType,
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
      },
    }).then(async (response) => {
      const json = await response.json();
      if (response.status === 200) {
        return json;
      }
      throw json?.message || json?.error.reason;
    }).catch((err) => {
      console.log('registration failed');
      throw err;
    });
  },

  removeDeviceIfRegistered(identity, accessToken) {
    console.log(`deleting ${config.SERVICES.auth.url}/devices/${identity}`);
    return fetch(`${config.SERVICES.auth.url}/devices/${identity}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
      },
    }).then(async (response) => {
      if (response.status === 400) {
        // this will be returned if the sid wasn't found.
        console.log('this device was not registered.');
        return null;
      }
      const json = await response.json();
      if (response.status === 200) {
        return json;
      }
      console.warn('removeDeviceIfRegistered', json?.error);
      return null;
    }).catch((err) => {
      console.warn('removeDeviceIfRegistered', err);
      return null;
    });
  },

  delete(accessToken) {
    return fetch(`${config.SERVICES.auth.url}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
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

  recover(email, mfa) {
    var data = {
      username: email,
      mfa,
      sid: config.VERIFY.SID,
    };
    if (mfa === 'email') {
      data.channelConfiguration = config.VERIFY.CHANNEL_CONFIGURATION;
    }
    return fetch(`${config.SERVICES.auth.url}/recover`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
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

  reset(email, code, newPassword) {
    var data = {
      username: email,
      code,
      password: newPassword,
    };
    return fetch(`${config.SERVICES.auth.url}/reset`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.auth.xApiKey,
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

};

export default authentication;
