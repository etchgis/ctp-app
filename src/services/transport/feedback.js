import config from '../../config';

const feedback = {

  add(comment, type, email, name, category, ratings, trip, accessToken) {
    let payload = {
      comment,
      type,
    };
    if (email && name) {
      payload.email = email;
      payload.name = name;
    }
    if (category) {
      payload.category = category;
    }
    if (ratings) {
      payload.ratings = ratings;
    }
    if (trip) {
      payload.trip = trip;
    }
    return fetch(`${config.SERVICES.feedback.url}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.feedback.xApiKey,
      },
    }).then(async (response) => {
      if (response.status === 200 || response.status === 201) {
        return true;
      }
      throw 'Error adding feedback';
    }).catch((err) => {
      console.log(err);
      throw err;
    });
  },


};

export default feedback;