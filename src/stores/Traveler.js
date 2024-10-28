import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable, runInAction } from 'mobx';
import { PersistStoreMap, makePersistable } from 'mobx-persist-store';
import traveler from '../services/transport/traveler';


class Traveler {

  ready = false;
  caregivers = [];
  dependents = [];
  error = null;
  selectedDependent = null;

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;

    if (!Array.from(PersistStoreMap.values())
      .map((item) => item.storageName)
      .includes('Caregivers')
    ) {
      makePersistable(this, {
        name: 'Caregivers',
        properties: ['caregivers'],
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
  setSelectedDependent(id) {
    runInAction(() => {
      this.selectedDependent = id;
    });
  }

  inviteCaregiver(email, firstName, lastName, accessToken) {
    return new Promise(async (resolve, reject) => {
      const idx = this.caregivers.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
      if (idx > -1) {
        console.log('reinvite');
        traveler.caregivers.reinvite(this.caregivers[idx].id, accessToken)
          .then(result => {
            runInAction(() => {
              this.caregivers[idx] = result;
            });
            resolve(result);
          })
          .catch((e) => {
            runInAction(() => {
              this.error = e;
            });
            reject(e);
          });
      }
      else {
        console.log('invite');
        traveler.caregivers.invite(email, firstName, lastName, accessToken)
          .then(result => {
            runInAction(() => {
              this.caregivers.push(result);
            });
            resolve(result);
          })
          .catch((e) => {
            runInAction(() => {
              this.error = e;
            });
            reject(e);
          });
      }
    });
  }

  getCaregivers(accessToken) {
    return new Promise(async (resolve, reject) => {
      return traveler.caregivers.get.all(accessToken)
        .then(result => {
          runInAction(() => {
            this.caregivers = result?.member || [];
          });
          resolve(result?.member || []);
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
          });
          reject(e);
        });
    });
  }

  getDependents(accessToken) {
    return new Promise(async (resolve, reject) => {
      return traveler.dependents.get.all(accessToken)
        .then(result => {
          runInAction(() => {
            this.dependents = result?.member || [];
          });
          resolve(result?.member || []);
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
          });
          reject(e);
        });
    });
  }

  updateDependentStatus(caregiverId, userId, status, accessToken) {
    return new Promise(async (resolve, reject) => {
      traveler.dependents.update.status(caregiverId, userId, status, accessToken)
        .then(result => {
          runInAction(() => {
            const idx = this.dependents.findIndex(d => d.id === caregiverId);
            if (idx > -1) {
              this.dependents[idx].status = status;
            }
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

  deleteCaregiver(id, accessToken) {
    return new Promise(async (resolve, reject) => {
      traveler.caregivers.delete(id, accessToken)
        .then(result => {
          console.log('deleteCaregiver', result);
          runInAction(() => {
            const idx = this.caregivers.map(p => p.id).indexOf(id);
            console.log('idx', idx);
            this.caregivers.splice(idx, 1);
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

  deleteDependent(id, accessToken) {
    return new Promise(async (resolve, reject) => {
      traveler.dependents.delete(id, accessToken)
        .then(result => {
          runInAction(() => {
            const idx = this.dependents.map(p => p.id).indexOf(id);
            this.dependents.splice(idx, 1);
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

}

export default Traveler;
