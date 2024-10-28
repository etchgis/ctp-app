const module = {

  /**
   * Validates emails in the form of user@domain.com.
   * Will allow for '+' character such as user+1@domain.com
   * @param email
   */
  isEmail: (email) => {
    // const pattern = /^(("[\w-\s]+")|([+\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i;
    // const pattern = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*(\+[a-z0-9-]+)?@[a-z0-9-]+(\.[a-z0-9-]+)*$/i;
    const pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return pattern.test(email);
  },

  hasLengthEqualTo: (text, length) => {
    return !!text && text.length === length;
  },

  hasLengthGreaterThan: (text, length) => {
    return !!text && text.length > length;
  },

  hasLowerCase: (text) => {
    const lowerCasePattern = /[a-z]/;
    return !!text && lowerCasePattern.test(text);
  },

  hasUpperCase: (text) => {
    const upperCasePattern = /[A-Z]/;
    return !!text && upperCasePattern.test(text);
  },

  hasNumber: (text) => {
    const numberPattern = /\d/;
    return !!text && numberPattern.test(text);
  },

};

export default module;
