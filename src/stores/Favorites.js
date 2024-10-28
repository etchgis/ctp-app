import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable, runInAction } from 'mobx';
import { clearPersistedStore, makePersistable, PersistStoreMap } from 'mobx-persist-store';

class Favorites {

  ready = false;
  locations = [];
  trips = [];

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;

    if (!Array.from(PersistStoreMap.values())
      .map((item) => item.storageName)
      .includes('Favorites')
    ) {
      makePersistable(this, {
        name: 'Favorites',
        properties: ['locations', 'trips'],
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

  updateProperty(name, value) {
    runInAction(() => {
      this[name] = value;
    });
    return this.updateProfile();
  }

  addLocation(location) {
    let newLocation = { ...location };
    newLocation.id = Date.now();
    runInAction(() => {
      this.locations.push(newLocation);
    });
    this.updateProfile();
    return newLocation.id;
  }

  removeLocation(id) {
    runInAction(() => {
      var i = this.locations.findIndex(l => l.id === id);
      if (i > -1) {
        this.locations.splice(i, 1);
      }
    });
    return this.updateProfile();
  }

  addTrip(trip) {
    let newTrip = { ...trip };
    newTrip.id = Date.now();
    runInAction(() => {
      this.trips.push(newTrip);
    });
    this.updateProfile();
    return newTrip.id;
  }

  removeTrip(id) {
    runInAction(() => {
      var i = this.trips.findIndex(t => t.id === id);
      if (i > -1) {
        this.trips.splice(i, 1);
      }
    });
    return this.updateProfile();
  }

  getAll() {
    return {
      locations: this.locations,
      trips: this.trips,
    };
  }

  updateProfile() {
    this.rootStore.profile.updateProfile();
  }

  hydrate(profile) {
    if (profile.favorites) {
      runInAction(() => {
        this.locations = profile.favorites.locations || [];
        this.trips = profile.favorites.trips || [];
      });
    }
  }

  async reset() {
    runInAction(() => {
      this.locations = [];
      this.trips = [];
    });
    await clearPersistedStore(this);
  }

}

export default Favorites;
