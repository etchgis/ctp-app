import config from '../../config';

/**
 * Call when the trip API fails.
 * @param {Error} error
 */
function networkError(error) {
  console.error(error);
}

const otp = {

  /**
   *
   * @param {object} params
   */
  query: (params) => {
    var strParams = '';
    for (var key in params) {
      strParams += `${key}=${params[key]}&`;
    }
    var uri = `${config.SERVICES.otp}?${strParams}`;

    console.log(uri);

    return fetch(uri)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        }
        // IGNORE BAD RESPONSES?
      })
      .catch((err) => {
        networkError(err);
      });
  },

};

export default otp;
