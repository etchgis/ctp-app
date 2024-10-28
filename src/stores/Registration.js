import { makeAutoObservable, runInAction } from 'mobx';
import { authentication } from '../services/transport';

class Registration {
  name = '';
  email = '';
  password = '';
  phone = '';
  address = null;
  caretakers = [];
  terms = false;
  consent = false;
  preferences = {
    maxTransfers: 2,
    maxCost: 10,
  };
  organization = '';
  registeredUser = {};
  error = null;

  constructor(rootStore) {
    this.reset();
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  updateProperty(name, value) {
    runInAction(() => {
      this[name] = value;
    });
  }

  updatePreference(name, value) {
    runInAction(() => {
      this.preferences[name] = value;
    });
  }

  reset() {
    runInAction(() => {
      this.firstName = '';
      this.lastName = '';
      this.email = '';
      this.password = '';
      this.phone = '';
      this.address = null;
      this.caretakers = [];
      this.terms = false;
      this.consent = false;
      this.preferences = {
        maxTransfers: 2,
        maxCost: 10,
      };
      this.organization = '';
      this.registeredUser = {};
      this.error = null;
    });
  }

  register() {
    runInAction(() => {
      this.registering = true;
    });
    return new Promise((resolve, reject) => {
      authentication.register(
        this.email.toLowerCase(),
        this.phone,
        this.organization,
        this.password,
        {
          firstName: this.firstName,
          lastName: this.lastName,
          terms: this.terms,
          consent: this.consent,
          // address: this.address,
          // caretakers: this.caretakers,
        },
      )
        .then((result) => {
          runInAction(() => {
            this.error = null;
            this.registering = false;
            this.registeredUser = result;
            resolve(result);
          });
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
            this.registering = false;
            reject(e);
          });
        });
    });
  }

  verify(channel = 'sms') {
    runInAction(() => {
      this.registering = true;
    });
    const to = channel === 'email' ? this.email.toLowerCase() : this.phone;
    return new Promise((resolve, reject) => {
      authentication.verify(channel, to)
        .then((result) => {
          runInAction(() => {
            this.error = null;
            this.registering = false;
          });
          resolve(result);
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
            this.registering = false;
          });
          reject(e);
        });
    });
  }

  confirm(code, channel = 'sms') {
    runInAction(() => {
      this.registering = true;
    });
    const to = channel === 'email' ? this.email.toLowerCase() : this.phone;
    return new Promise((resolve, reject) => {
      authentication.confirm(to, code)
        .then((result) => {
          if (result?.valid) {
            runInAction(() => {
              this.error = null;
              this.registering = false;
            });
            resolve(result);
          }
          throw 'invalid';
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
            this.registering = false;
          });
          reject(e);
        });
    });
  }

  activate(token) {
    runInAction(() => {
      this.registering = true;
    });
    return new Promise((resolve, reject) => {
      authentication.activate(token)
        .then((result) => {
          resolve(result);
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e.message || e.reason;
            this.registering = false;
          });
          reject(e);
        });
    });
  }
}

export default Registration;
