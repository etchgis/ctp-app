import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable, runInAction } from 'mobx';
import { clearPersistedStore, makePersistable, PersistStoreMap } from 'mobx-persist-store';
import config from '../config';
import translator from '../models/translator';
import FastTranslator from 'fast-mlkit-translate-text';
import voice from '../services/voice';

class Preferences {

  ready = false;
  language = 'en';
  wheelchair = false;
  serviceAnimal = false;
  maxCost = 10;
  maxTransfers = 4;
  minimizeWalking = false;
  modes = [];
  notifications = [];
  notificationTypes = [];
  shareWithConcierge = false;
  navigationDirections = 'voiceOn';
  pin = '';

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;

    if (!Array.from(PersistStoreMap.values())
      .map((item) => item.storageName)
      .includes('Preferences')
    ) {
      makePersistable(this, {
        name: 'Preferences',
        properties: ['language', 'wheelchair', 'serviceAnimal', 'maxCost', 'maxTransfers', 'minimizeWalking', 'modes', 'notifications', 'notificationTypes', 'shareWithConcierge', 'navigationDirections', 'pin'],
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
    // this.loadLanguages();
  }

  // async loadLanguages() {
  //   await FastTranslator.downloadLanguageModel('Spanish');
  //   await FastTranslator.downloadLanguageModel('English');
  //   if (config.USE_ML_TRANSLATION_KIT) {
  //     voice.setLanguage(this.language);
  //   }
  //   console.log('Language models downloaded');
  //   console.log('current language', this.language);
  // }

  // async prepareSpanishLanguage() {
  //   await FastTranslator.prepare({
  //     source: 'English',
  //     target: 'Spanish',
  //     downloadIfNeeded: true
  //   });

  //   console.log('Language prepared');
  // }

  updateProperty(name, value) {
    runInAction(() => {
      this[name] = value;
    });
    // if (name === 'language') {
    //   if (config.USE_ML_TRANSLATION_KIT) {
    //     voice.setLanguage(this.language);
    //   }
    //   if (value === 'es') {
    //     this.prepareSpanishLanguage();
    //   }
    // }
    return this.updateProfile();
  }

  addMode(value) {
    runInAction(() => {
      this.modes.push(value);
    });
    return this.updateProfile();
  }

  removeMode(value) {
    runInAction(() => {
      var i = this.modes.findIndex(m => m === value);
      if (i > -1) {
        this.modes.splice(i, 1);
      }
    });
    return this.updateProfile();
  }

  addNotification(value) {
    runInAction(() => {
      this.notifications.push(value);
    });
    return this.updateProfile();
  }

  removeNotification(value) {
    runInAction(() => {
      var i = this.notifications.findIndex(m => m === value);
      if (i > -1) {
        this.notifications.splice(i, 1);
      }
    });
    return this.updateProfile();
  }

  addNotificationType(values) {
    runInAction(() => {
      this.notificationTypes.push(...values);
    });
    return this.updateProfile();
  }

  removeNotificationType(values) {
    runInAction(() => {
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        var j = this.notificationTypes.findIndex(m => m === value);
        if (j > -1) {
          this.notificationTypes.splice(j, 1);
        }
      }
    });
    return this.updateProfile();
  }

  updateProfile() {
    this.rootStore.profile.updateProfile();
  }

  getAll() {
    return {
      language: this.language,
      wheelchair: this.wheelchair,
      serviceAnimal: this.serviceAnimal,
      maxCost: this.maxCost,
      maxTransfers: this.maxTransfers,
      minimizeWalking: this.minimizeWalking,
      modes: this.setAndCleanModes(),
      notifications: this.setAndCleanNotificationChannels(),
      notificationTypes: this.setAndCleanNotificationTypes(),
      shareWithConcierge: this.shareWithConcierge,
      navigationDirections: this.navigationDirections,
      pin: this.pin
    };
  }

  setAndCleanModes() {
    let modes = [];
    for (let i = 0; i < config.MODES.length; i++) {
      let mode = config.MODES[i].mode;
      if (this.modes.indexOf(mode) > -1) {
        modes.push(mode);
      }
    }
    return modes;
  }

  setAndCleanNotificationChannels() {
    let notifications = [];
    for (let i = 0; i < config.NOTIFICATION_CHANNELS.length; i++) {
      let notification = config.NOTIFICATION_CHANNELS[i].value;
      if (this.notifications.indexOf(notification) > -1) {
        notifications.push(notification);
      }
    }
    return notifications;
  }

  setAndCleanNotificationTypes() {
    let nTypes = [];

    for (let i = 0; i < config.NOTIFICATION_TYPES.caregiver.length; i++) {
      let types = config.NOTIFICATION_TYPES.caregiver[i].types;
      for (let j = 0; j < types.length; j++) {
        let type = types[j];
        if (this.notificationTypes.indexOf(type) > -1) {
          nTypes.push(type);
        }
      }
    }

    for (let i = 0; i < config.NOTIFICATION_TYPES.traveler.length; i++) {
      let types = config.NOTIFICATION_TYPES.traveler[i].types;
      for (let j = 0; j < types.length; j++) {
        let type = types[j];
        if (this.notificationTypes.indexOf(type) > -1) {
          nTypes.push(type);
        }
      }
    }

    return nTypes;
  }

  hydrate(profile) {
    if (profile.preferences) {
      runInAction(() => {
        this.language = profile.preferences.language || 'en';
        translator.configure(this.language, false);
        this.wheelchair = profile.preferences.wheelchair || false;
        this.serviceAnimal = profile.preferences.serviceAnimal || false;
        this.maxCost = profile.preferences.maxCost || 10;
        this.maxTransfers = (profile.preferences.maxTransfers !== null) ? profile.preferences.maxTransfers : 4;
        this.minimizeWalking = profile.preferences.minimizeWalking || false;
        this.modes = profile.preferences.modes || [];
        this.notifications = profile.preferences.notifications || [];
        this.notificationTypes = profile.preferences.notificationTypes || [];
        this.shareWithConcierge = profile.preferences.shareWithConcierge || false;
        let navDir = profile.preferences.navigationDirections;
        if (profile.preferences.navigationDirections === 'Voice On') {
          navDir = 'voiceOn';
        } else if (profile.preferences.navigationDirections === 'Voice Off') {
          navDir = 'voiceOff';
        }
        this.navigationDirections = navDir || 'voiceOn';
        this.pin = profile.preferences.pin || '';
      });
    }
  }

  async reset() {
    runInAction(() => {
      this.language = 'en';
      this.wheelchair = false;
      this.serviceAnimal = false;
      this.maxCost = 10;
      this.maxTransfers = 4;
      this.minimizeWalking = false;
      this.modes = [];
      this.notifications = [];
      this.notificationTypes = [];
      this.shareWithConcierge = false;
      this.navigationDirections = 'voiceOn';
      this.pin = '';
    });
    await clearPersistedStore(this);
  }

}

export default Preferences;
