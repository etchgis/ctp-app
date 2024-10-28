import config from '../../config';

const crosswalk = {

  request(intersectionId, direction, accessToken) {
    console.log(`Requesting crossing for intersection ${intersectionId} in direction ${direction}`);
    return fetch(`${config.SERVICES.crosswalk.url}/request/${intersectionId}/${direction}`, {
      method: 'POST',
      // body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${accessToken}`
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

};

export default crosswalk;
