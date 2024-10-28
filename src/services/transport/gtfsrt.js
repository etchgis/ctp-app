const gtfsrt = {

  trips() {
    return fetch('https://gtfsr.nfta.com/api/tripupdates?format=json', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async (response) => {
      const json = await response.json();
      if (response.status === 200) {
        return json;
      }
      throw 'GTFS Error';
    }).catch((err) => {
      throw err;
    });
  },

};

export default gtfsrt;
