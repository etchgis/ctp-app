import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable, runInAction } from 'mobx';
import { clearPersistedStore, makePersistable, PersistStoreMap } from 'mobx-persist-store';
import moment from 'moment';
import config from '../config';
import { trips } from '../services/transport';

class Schedule {

  ready = false;
  trips = [];
  dependentTrips = [];
  selectedTrip = null;
  error = null;

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;

    if (!Array.from(PersistStoreMap.values())
      .map((item) => item.storageName)
      .includes('Schedule')
    ) {
      makePersistable(this, {
        name: 'Schedule',
        properties: ['trips'],
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

  selectTrip(trip) {
    runInAction(() => {
      this.selectedTrip = trip;
    });
  }

  add(plan, request, accessToken) {
    const userId = this.rootStore.authentication.user?.id;
    const organizationId = config.ORGANIZATION;
    const datetime = moment(plan.startTime).valueOf();
    const origin = {
      address: request?.origin?.text || '',
      coordinates: [request?.origin?.point?.lng || 0, request?.origin?.point?.lat || 0],
    };
    const destination = {
      address: request?.destination?.text || '',
      coordinates: [request?.destination?.point?.lng || 0, request?.destination?.point?.lat || 0],
    };
    let tripPlan = { ...plan };
    tripPlan.request = request;
    return new Promise(async (resolve, reject) => {
      trips.add(userId, organizationId, datetime, origin, destination, tripPlan, accessToken)
        .then((result) => {
          runInAction(() => {
            this.error = null;
            this.trips.push(result);
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

  cancel(tripId, accessToken) {
    return new Promise(async (resolve, reject) => {
      trips.delete(tripId, accessToken)
        .then(() => {
          runInAction(() => {
            this.error = null;
            var i = this.trips.findIndex(t => t.id === tripId);
            if (i > -1) {
              this.trips.splice(i, 1);
            }
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

  get(datetime, accessToken) {
    return new Promise(async (resolve, reject) => {
      trips.get(datetime, accessToken)
        .then((result) => {
          runInAction(() => {
            this.error = null;
            this.trips = result?.member || [];
            if (this.trips.length > 0) {
              this.trips.sort((a, b) => a.plan?.startTime - b.plan?.startTime);
            }
          });
          resolve(this.trips);
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
          });
          reject(e);
        });
    });
  }

  getRange(from, to, accessToken) {
    return new Promise(async (resolve, reject) => {
      trips.getRange(from, to, accessToken)
        .then((result) => {
          runInAction(() => {
            this.error = null;
            this.trips = result?.member || [];
            if (this.trips.length > 0) {
              this.trips.sort((a, b) => a.plan?.startTime - b.plan?.startTime);
            }
          });
          resolve(this.trips);
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
          });
          reject(e);
        });
    });
  }

  getDependentSchedule(dependentId, from, to, accessToken) {
    return new Promise(async (resolve, reject) => {
      trips.getDependentsRange(dependentId, from, to, accessToken)
        .then((result) => {
          runInAction(() => {
            this.error = null;
            this.dependentTrips = result?.member || [];
            if (this.dependentTrips.length > 0) {
              this.dependentTrips.sort((a, b) => a.plan?.startTime - b.plan?.startTime);
            }
          });
          resolve(this.trips);
        })
        .catch((e) => {
          runInAction(() => {
            this.error = e;
          });
          reject(e);
        });
    });
  }

  updateTripRequest(id, request, accessToken) {
    return new Promise(async (resolve, reject) => {
      let i = this.trips.findIndex(t => t.id === id);
      if (i > -1) {
        const trip = this.trips[i];
        let plan = { ...trip.plan };
        plan.request = request;
        trips.update.plan(trip.id, plan, accessToken)
          .then((result) => {
            runInAction(() => {
              this.trips[i] = result;
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
        reject(false);
      }
    });
  }

  async reset() {
    runInAction(() => {
      this.trips = [];
      this.selectedTrip = null;
      this.error = null;
    });
    await clearPersistedStore(this);
  }

}

export default Schedule;
