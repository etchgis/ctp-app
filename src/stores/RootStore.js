// copied and modified from https://codesandbox.io/s/3p53x?file=/src/hooks/useStores.tsx
// and https://codingislove.com/setup-mobx-react-context/
import React from 'react';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

import Authentication from './Authentication';
import Display from './Display';
import MapManager from './MapManager';
import Profile from './Profile';
import Registration from './Registration';
import Trip from './Trip';
import Preferences from './Preferences';
import Favorites from './Favorites';
import Schedule from './Schedule';
import Traveler from './Traveler';
import Hail from './Hail';
import { autorun, makeAutoObservable, runInAction } from 'mobx';

export default class RootStore {

  isLoaded = false;

  constructor() {
    makeAutoObservable(this);
    this.authentication = new Authentication(this);
    this.display = new Display(this);
    this.favorites = new Favorites(this);
    this.hail = new Hail(this);
    this.mapManager = new MapManager(this);
    this.preferences = new Preferences(this);
    this.profile = new Profile(this);
    this.registration = new Registration(this);
    this.schedule = new Schedule(this);
    this.traveler = new Traveler(this);
    this.trip = new Trip(this);
    this.checkAllDataLoaded();
  }

  checkAllDataLoaded() {
    const loadingPromises =
      [
        this.authentication,
        this.favorites,
        this.preferences,
        this.profile,
        this.schedule,
        this.traveler
      ].map((dataClass) =>
        new Promise((resolve) => {
          // Listen for changes in 'ready' and resolve the promise when true
          const disposer = autorun(() => {
            if (dataClass.ready) {
              console.log(`${dataClass.constructor.name} is ready`);
              resolve();
              disposer();
            }
          });
        })
      );

    // Once all loading promises are resolved, update the RootStore's loading state
    Promise.all(loadingPromises).then(() => {
      console.log('root store data loaded');
      runInAction(() => {
        this.isLoaded = true;
      });
    }).catch((error) => {
      console.error('error loading root store data', error);
    });
  }

}

const StoreContext = React.createContext();

export const StoreProvider = ({ children, store }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);

StoreProvider.propTypes = {
  children: PropTypes.object,
  store: PropTypes.object,
};

StoreProvider.defaultProps = {
  children: null,
  store: null,
};

export const useStore = () => React.useContext(StoreContext);

export const withStore = (Component) => (props) => <Component {...props} store={useStore()} />;
