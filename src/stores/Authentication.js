import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable, runInAction } from 'mobx';
import { clearPersistedStore, makePersistable, PersistStoreMap } from 'mobx-persist-store';
import jwtDecode from 'jwt-decode';
import { authentication } from '../services/transport';

const validateJWT = (token) => {
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp > Date.now() / 1000) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};
class Authentication {

  ready = false;
  user = {};
  loggedIn = false;
  loggingIn = false;
  registering = false;
  error = null;
  accessToken = null;
  refreshToken = null;
  email = null;
  phone = null;
  mfa = null;
  recoveryCode = null;
  recoveryDestination = null;

  accessTokenPromise = null;

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;

    if (!Array.from(PersistStoreMap.values())
      .map((item) => item.storageName)
      .includes('Authentication')
    ) {
      makePersistable(this, {
        name: 'Authentication',
        properties: ['user'],
        storage: AsyncStorage,
      })
        .then(() => {
          runInAction(() => {
            this.ready = true;
          });
        })
        .catch((e) => {
          console.warn(e);
        });
    }
  }

  clearError() {
    runInAction(() => {
      this.error = null;
    });
  }

  /**
   * Get the user's access token, renewing if necessary.
   * Several modules might call this in parallel, but it won't do a separate query for
   * each one.
   * @returns {Promise} - the user access token.
   */
  fetchAccessToken() {
    if (this.accessTokenPromise) {
      return this.accessTokenPromise;
    }
    if (!this.user?.refreshToken) {
      return Promise.reject(new Error('not logged in'));
    }
    if (validateJWT(this.user.accessToken)) {
      return Promise.resolve(this.user.accessToken);
    }
    this.accessTokenPromise = authentication.refreshAccessToken(this.user.refreshToken)
      .then((result) => {
        this.accessTokenPromise = null;
        if (result.accessToken) {
          const refreshedUser = this.user;
          refreshedUser.accessToken = result.accessToken;
          runInAction(() => {
            this.user = refreshedUser;
            this.loggedIn = true;
          });
          return result.accessToken;
        }
        throw new Error('user access failed');
      });
    return this.accessTokenPromise;
  }

  login(email, password, source, forgot) {
    runInAction(() => {
      this.loggingIn = true;
    });
    return new Promise((resolve, reject) => {
      authentication.login(email.toLowerCase(), password, source)
        .then(async (result) => {
          if (result?.profile) {
            if (result?.profile?.onboarded && !forgot) {
              // likely a login from an expired refreshToken or from logging out
              runInAction(() => {
                this.email = result?.email;
                this.phone = result?.phone;
                this.accessToken = result?.accessToken;
                this.refreshToken = result?.refreshToken;
              });
              resolve(true);
            }
            else {
              // they still need to be onboarded so save everything
              // or they forgot their password - don't do MFA
              runInAction(() => {
                this.user = result;
                this.error = null;
                this.loggingIn = false;
                this.loggedIn = true;
              });
              this.rootStore.profile.hydrate(this.user.profile);
              this.rootStore.preferences.hydrate(this.user.profile);
              this.rootStore.favorites.hydrate(this.user.profile);
            }
            resolve(false);
          }
          reject('user profile does not exist');
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
            this.loggingIn = false;
          });
          reject(e);
        });
    });
  }

  get(accessToken) {
    return new Promise((resolve, reject) => {
      authentication.get(accessToken)
        .then((result) => {
          if (result?.profile) {
            runInAction(() => {
              this.user = result;
              // access token not included in this API endpoint so update here
              this.user.accessToken = accessToken;
              this.error = null;
              this.loggingIn = false;
              this.loggedIn = true;
            });
            this.rootStore.profile.hydrate(this.user.profile);
            this.rootStore.preferences.hydrate(this.user.profile);
            this.rootStore.favorites.hydrate(this.user.profile);
            resolve(true);
          }
          else {
            resolve(false);
          }
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
            this.loggingIn = false;
          });
          reject(e);
        });
    });
  }

  logout() {
    this.reset();
    this.rootStore.profile.reset();
    this.rootStore.favorites.reset();
    this.rootStore.preferences.reset();
    this.rootStore.schedule.reset();
    this.rootStore.trip.reset();
    clearPersistedStore(this);
  }

  setLoggedIn(loggedIn) {
    runInAction(() => {
      this.loggedIn = loggedIn;
    });
  }

  reset() {
    runInAction(() => {
      this.rootStore.mapManager.hide();
      this.user = {};
      this.error = null;
      this.loggingIn = false;
      this.loggedIn = false;
      this.registering = false;
      this.accessToken = null;
      this.refreshToken = null;
      this.email = null;
      this.phone = null;
      this.mfa = null;
    });
  }

  updateUser(user) {
    runInAction(() => {
      this.user = user;
    });
  }

  updateUserProfile(profile) {
    return new Promise(async (resolve) => {
      await this.fetchAccessToken();
      authentication.update({ profile }, this.user.accessToken)
        .then(async (result) => {
          if (result?.profile) {
            await this.rootStore.profile.hydrate(result.profile);
            await this.rootStore.preferences.hydrate(result.profile);
            await this.rootStore.favorites.hydrate(result.profile);
            runInAction(() => {
              this.user.profile = result.profile;
            });
          }
          runInAction(() => {
            this.error = null;
            this.loggingIn = false;
            this.loggedIn = true;
          });
          resolve(profile);
        })
        .catch((e) => {
          console.warn(e);
          resolve({ error: e });
        });
    });
  }

  updateUserPassword(oldPassword, password) {
    return new Promise(async (resolve, reject) => {
      await this.fetchAccessToken();
      authentication.updatePassword(oldPassword, password, this.user.accessToken)
        .then(() => {
          runInAction(() => {
            this.error = null;
            this.loggingIn = false;
            this.loggedIn = true;
          });
          resolve(true);
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
          });
          reject(e);
        });
    });
  }

  updateUserPhone(phone) {
    return new Promise(async (resolve, reject) => {
      await this.fetchAccessToken();
      authentication.updatePhone(phone, this.user.accessToken)
        .then((result) => {
          runInAction(() => {
            this.user.phone = result.phone;
            this.error = null;
            this.loggingIn = false;
            this.loggedIn = true;
          });
          resolve(true);
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
          });
          reject(e);
        });
    });
  }

  updateEmail(email) {
    runInAction(() => {
      this.email = email;
    });
  }

  updatePhone(phone) {
    runInAction(() => {
      this.phone = phone;
    });
  }

  updateMfa(mfa) {
    runInAction(() => {
      this.mfa = mfa;
    });
  }

  deleteAccount() {
    return new Promise(async (resolve) => {
      await this.fetchAccessToken();
      authentication.delete(this.user.accessToken)
        .then(() => {
          resolve(true);
        })
        .catch((e) => {
          console.warn(e);
          resolve({ error: e });
        });
    });
  }

  recover() {
    return new Promise((resolve, reject) => {
      authentication.recover(this.email.toLowerCase(), this.mfa)
        .then((result) => {
          runInAction(() => {
            this.recoveryCode = result?.code;
            this.recoveryDestination = result?.destination;
          });
          resolve(result);
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
          });
          reject(e);
        });
    });
  }

  resetPassword(newPassword) {
    return new Promise((resolve, reject) => {
      authentication.reset(this.email.toLowerCase(), this.recoveryCode, newPassword)
        .then((result) => {
          resolve(result);
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
          });
          reject(e);
        });
    });
  }

  verify() {
    runInAction(() => {
      this.registering = true;
    });
    const to = this.mfa === 'email' ? this.email.toLowerCase() : this.phone;
    return new Promise((resolve, reject) => {
      authentication.verify(this.mfa, to)
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

  confirm(code, destination) {
    runInAction(() => {
      this.registering = true;
    });
    const to = destination; // this.mfa === 'email' ? this.email : this.recoveryDestination;
    return new Promise((resolve, reject) => {
      authentication.confirm(to, code)
        .then((result) => {
          if (result?.valid) {
            runInAction(() => {
              this.error = null;
              this.registering = false;
            });
            resolve(true);
          }
          reject(false);
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
}

export default Authentication;
