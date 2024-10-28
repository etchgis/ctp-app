// import AsyncStorage from '@react-native-community/async-storage';
import { makeAutoObservable, runInAction } from 'mobx';
// import { makePersistable, PersistStoreMap } from 'mobx-persist-store';
import { StatusBar } from 'react-native';

class Display {
  mode = 'light';
  sideMenuVisible = false;
  spinner = false;
  spinnerOpacity = 1;
  spinnerText = '';
  feedbackVisible = false;
  feedbackTrip = null;

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;

    // if (!Array.from(PersistStoreMap.values())
    //   .map((item) => item.storageName)
    //   .includes('Display')
    // ) {
    //   makePersistable(this, {
    //     name: 'Display',
    //     properties: ['mode'],
    //     storage: AsyncStorage,
    //   });
    // }
  }

  updateMode(mode) {
    runInAction(() => {
      this.mode = mode;
    });
  }

  updateStatusBarStyle(style) {
    StatusBar.setBarStyle(style, true);
  }

  showSideMenu() {
    console.log('showSideMenu');
    runInAction(() => {
      this.sideMenuVisible = true;
    });
  }

  hideSideMenu() {
    console.log('hideSideMenu');
    runInAction(() => {
      this.sideMenuVisible = false;
    });
  }

  showSpinner(opacity = 1, text = '') {
    runInAction(() => {
      this.spinnerOpacity = opacity;
      this.spinnerText = text;
      this.spinner = true;
    });
  }

  hideSpinner() {
    runInAction(() => {
      this.spinnerOpacity = 1;
      this.spinnerText = '';
      this.spinner = false;
    });
  }

  showFeedback(trip) {
    runInAction(() => {
      this.feedbackVisible = true;
      this.feedbackTrip = trip;
    });
  }

  hideFeedback() {
    runInAction(() => {
      this.feedbackVisible = false;
      this.feedbackTrip = null;
    });
  }

}

export default Display;
