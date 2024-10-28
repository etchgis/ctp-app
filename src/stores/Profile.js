import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable, runInAction } from 'mobx';
import { clearPersistedStore, makePersistable, PersistStoreMap } from 'mobx-persist-store';

class Profile {

  ready = false;
  firstName = '';
  lastName = '';
  address = {};
  caretakers = [];
  onboarded = false;
  mfa = false;
  deviceId = '';
  consent = false;

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;

    if (!Array.from(PersistStoreMap.values())
      .map((item) => item.storageName)
      .includes('Profile')
    ) {
      makePersistable(this, {
        name: 'Profile',
        properties: ['firstName', 'lastName', 'address', 'caretakers', 'onboarded', 'mfa', 'consent'],
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

  async reset() {
    runInAction(() => {
      this.firstName = '';
      this.lastName = '';
      this.address = {};
      this.caretakers = [];
      this.onboarded = false;
      this.mfa = false;
      this.deviceId = '';
      this.consent = false;
    });
    await clearPersistedStore(this);
  }

  updateProperty(name, value) {
    runInAction(() => {
      this[name] = value;
    });
    return this.updateProfile();
  }

  addCaretaker(caretaker) {
    runInAction(() => {
      this.caretakers.push(caretaker);
    });
    return this.updateProfile();
  }

  updateCaretaker(caretaker, index) {
    runInAction(() => {
      this.caretakers[index] = caretaker;
    });
    return this.updateProfile();
  }

  removeCaretaker(index) {
    runInAction(() => {
      this.modes.caretakers.splice(index, 1);
    });
    return this.updateProfile();
  }

  updateProfile() {
    var profile = this.rootStore.authentication?.user?.profile;
    profile.firstName = this.firstName;
    profile.lastName = this.lastName;
    profile.address = this.address;
    profile.caretakers = this.caretakers;
    profile.onboarded = this.onboarded;
    profile.mfa = this.mfa;
    profile.deviceId = this.deviceId;
    profile.consent = this.consent;
    profile.preferences = this.rootStore.preferences.getAll();
    profile.favorites = this.rootStore.favorites.getAll();
    return this.rootStore.authentication.updateUserProfile(profile);
  }

  hydrate(profile) {
    runInAction(() => {
      this.firstName = profile.firstName || '';
      this.lastName = profile.lastName || '';
      this.address = profile.address || {};
      this.caretakers = profile.caretakers || [];
      this.onboarded = profile.onboarded || false;
      this.mfa = profile.mfa || false;
      this.deviceId = profile.deviceId || '';
      this.consent = profile.consent || false;
    });
  }

}

export default Profile;
