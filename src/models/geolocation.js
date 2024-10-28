/* eslint-disable react-hooks/exhaustive-deps */
import { AppState, NativeEventEmitter, NativeModules } from 'react-native';
import distance from '@turf/distance';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PERMISSIONS, checkMultiple } from 'react-native-permissions';
import { Devices } from '../styles';
import config from '../config';

const { Geolocation } = NativeModules;

const NBR_OF_POINTS_FOR_STABILITY = 3;
const INITIAL_STABLE_THRESHOLD_KM = 0.1;
const STABLE_THRESHOLD_KM = 0.05;

/**
 * Responsible for acquiring the user's GPS location.
 * Each subscriber states the desired accuracy level. The GPS circuitry will run at the
 * level needed for the current most demanding subscriber. This is updated whenever
 * subscribers are added or removed.
 * @module geolocator
 */

export const geolocation = {

  /** Quality levels */
  Quality: {
    AREA: 1, // update for significant area changes
    DYNAMIC: 2, // update speed depends on movement speed
    BEST: 3, // always use best result available
  },

  quality: 0, // default to 0 = GPS is not on

  Accuracy: {
    GOOD: 1,
    POOR: 2
  },

  accuracy: 1,

  /** True when pause() has been called */
  isPaused: false,

  /** Provides the last point that was retrieved. {lat, lng} */
  lastPoint: null,

  lastNPoints: [],

  /** Provides the last heading that was retrieved. 0 = north, 90 = east */
  lastHeading: null,

  /** Provides the last speed that was retrieved. This is instantaneous speed in meters/sec */
  lastSpeed: null,

  /** Provides the last accuracy that was retrieved. */
  lastAccuracy: null,

  /** True if user permission granted, false if denied, null if unknown. */
  // hasPermission: null,

  _locationSubscribers: [],
  _geofenceSubscribers: [],
  _pointWaiters: [],

  _accuracyCount: 0,
  _reachedInitialStable: false,

  init: () => {
    geolocation._geoEventEmitter = new NativeEventEmitter(Geolocation);
    geolocation._nativeLocationSub = geolocation._geoEventEmitter.addListener('UpdateLocation', onLocationUpdate);
    geolocation._nativeHeadingSub = geolocation._geoEventEmitter.addListener('UpdateHeading', onHeadingUpdate);
    geolocation._nativeErrorSub = geolocation._geoEventEmitter.addListener('LocationError', onLocationError);
    geolocation._nativeGeofenceSub = geolocation._geoEventEmitter.addListener('GeofenceEvent', onGeofenceEvent);
    geolocation.quality = 1; // on, but default quality
    Geolocation.start();
    geolocation.updateQuality();
  },
  shutdown: () => {
    if (geolocation._nativeLocationSub) {
      geolocation._nativeLocationSub.remove();
      geolocation._nativeHeadingSub.remove();
      geolocation._nativeErrorSub.remove();
      geolocation._nativeGeofenceSub.remove();
      geolocation._nativeLocationSub = null;
      geolocation._nativeHeadingSub = null;
      geolocation._nativeGeofenceSub = null;
      geolocation._nativeErrorSub = null;
    }
  },

  /**
    * Get next available GPS position.
    * @returns {Promise} Resolves to { lat, lng } or generates PositionError.
    */
  getPoint: () => new Promise((resolve) => {
    if (geolocation.lastPoint) {
      // TODO: cache this for some amount of time.
      resolve(geolocation.lastPoint);
    } else {
      geolocation._pointWaiters.push(resolve);
    }
  }),

  /**
    * Subscribe to changes in the user's position. Call `cancel` when done subscribing.
    * @param {Function} fn - Callback for receiving each position.
    * @param {Function} errFn - Called as errors occur, optional.
    * @param {String} quality - One of the geolocation.Quality values, optional.
    * @returns {Object} A watcher object with the `cancel` function.
    */
  subscribe: (fn, errFn, quality) => {
    const subscriber = {
      fn,
      cancel: () => {
        const index = geolocation._locationSubscribers.indexOf(subscriber);
        if (index !== -1) {
          geolocation._locationSubscribers.splice(index, 1);
          geolocation.updateQuality();
        }
      },
    };
    let qualityValue = quality || 1;
    if (errFn && errFn instanceof Function) {
      subscriber.errFn = errFn;
    } else {
      qualityValue = errFn || 1;
    }
    subscriber.quality = qualityValue;
    geolocation._locationSubscribers.push(subscriber);
    geolocation.updateQuality();

    // Always give them the latest point
    if (geolocation.lastPoint) {
      fn(geolocation.lastPoint, geolocation.lastHeading, geolocation.lastSpeed);
    }

    return subscriber;
  },

  /**
    * Subscribe to the user's geofence enter or exit events. Call `cancel` when done subscribing.
    * @param {Function} fn - Callback for receiving each event.
    * @param {Function} errFn - Called as errors occur.
    * @returns {Object} A watcher object with the `cancel` function.
    */
  subscribeToGeofences: (fn, errFn) => {
    const subscriber = {
      fn,
      errFn,
      cancel: () => {
        const index = geolocation._geofenceSubscribers.indexOf(subscriber);
        if (index !== -1) {
          geolocation._geofenceSubscribers.splice(index, 1);
        }
      },
    };
    geolocation._geofenceSubscribers.push(subscriber);

    // TODO: should we do send the latest event that occurred in less than 1 second?
    // What if the app is launched because of a geofence event
    // but a handler hasn't been set yet?
  },

  /**
    * Register a geofence to background wake the app.
    */
  addGeofence: (lat, lng, radius, name) => {
    Geolocation.addGeofence(lat, lng, radius, name);
  },

  /**
    * Wipe all fences set.
    */
  clearGeofences: () => {
    Geolocation.clearGeofences();
  },

  /**
    * Check for the minimum required quality level of all subscribers and
    * upgrade or downgrade as needed.
    */
  updateQuality: () => {
    if (geolocation.quality === 0) {
      return; // not running yet.
    }
    let minQuality = 1; // ensure it's always on (at least 1)
    geolocation._locationSubscribers.forEach((subscriber) => {
      if (subscriber.quality > minQuality) {
        minQuality = subscriber.quality;
      }
    });

    if (minQuality > 0 && minQuality !== geolocation.quality) {
      // upgrade or downgrade GPS requirement.
      console.log(`Switching GPS quality level from ${geolocation.quality} to ${minQuality}`);
      Geolocation.setAccuracy(minQuality);
      geolocation.quality = minQuality;
    }
  },

  /**
    * Stop receiving realtime location updates.
    * Simulated coordinates will still be received.
    */
  pause: () => {
    if (!geolocation.isPaused) {
      Geolocation.pause();
      geolocation.isPaused = true;
    }
  },

  /**
    * Restore realtime location updates, overriding any simulated location.
    */
  resume: () => {
    if (geolocation.isPaused) {
      Geolocation.resume();
      geolocation.isPaused = false;
    }
  },

  /**
    * Feed in simulated GPS data.
    */
  setLocation: (point, heading, speed) => {
    geolocation.pause();
    Geolocation.simulate(point.lat, point.lng, heading, speed);
  },

  getDistanceKm: (lng, lat) => {
    const me = geolocation.lastPoint;
    return distance([me.lng, me.lat], [lng, lat]);
  },

  isStable: () => {
    if (geolocation.lastNPoints.length < NBR_OF_POINTS_FOR_STABILITY) {
      return false;
    }

    // calculate the distance traveled in the last N points
    let totalDistance = 0;
    for (let i = 1; i < geolocation.lastNPoints.length; i++) {
      totalDistance += geolocation.getDistanceBetweenPoints(geolocation.lastNPoints[i - 1], geolocation.lastNPoints[i]);
    }

    if (!geolocation._reachedInitialStable && totalDistance < INITIAL_STABLE_THRESHOLD_KM) {
      geolocation._reachedInitialStable = true;
    }
    return totalDistance < STABLE_THRESHOLD_KM;
  },

  getDistanceBetweenPoints: (point1, point2) => {
    const from = [point1.lng, point1.lat];
    const to = [point2.lng, point2.lat];
    const distanceKm = distance(from, to);
    return distanceKm;
  }

};

function onLocationUpdate(evt) {
  const pt = {
    lat: evt.lat,
    lng: evt.lng,
    ts: Date.now()
  };
  // rate limit points to 1 per second, this should be done in native code?
  const timeSinceLastPoint = pt.ts - (geolocation.lastPoint?.ts ?? 0);
  if (pt.lat && pt.lng && timeSinceLastPoint >= 1000) {
    updateAccuracy(evt.accuracy);
    geolocation.lastPoint = pt;
    geolocation.lastHeading = evt.heading;
    geolocation.lastSpeed = evt.speed;
    geolocation.lastAccuracy = evt.accuracy;
    geolocation.lastNPoints.push(pt);
    if (geolocation.lastNPoints.length > NBR_OF_POINTS_FOR_STABILITY) {
      geolocation.lastNPoints.shift();
    }
    geolocation._locationSubscribers.forEach((subscriber) => {
      subscriber.fn(geolocation.lastPoint, geolocation.lastHeading, geolocation.lastSpeed);
    });
    geolocation._pointWaiters.forEach((waiter) => {
      waiter(geolocation.lastPoint);
    });
    geolocation._pointWaiters.length = 0;
  }
}

// function updateAccuracy(currentAccuracy) {
//   const { GOOD, POOR } = geolocation.Accuracy;
//   if (geolocation.accuracy === GOOD) {
//     geolocation._accuracyCount++;
//     if (geolocation._accuracyCount === 10) {
//       geolocation.accuracy = POOR;
//     }
//   } else if (geolocation.accuracy === POOR) {
//     geolocation._accuracyCount--;
//     if (geolocation._accuracyCount === 0) {
//       geolocation.accuracy = GOOD;
//     }
//   }
// }

function updateAccuracy(currentAccuracy) {
  const { GOOD, POOR } = geolocation.Accuracy;
  const poorAccuracyThreshold = config.POOR_ACCURACY_RADIUS;
  const AccuracyChangeTicks = 5;

  if (geolocation.isStable()) {
    geolocation._reachedInitialStable = true;
    if (geolocation.accuracy === GOOD) {
      if (currentAccuracy >= poorAccuracyThreshold) {
        geolocation._accuracyCount++;
      } else {
        geolocation._accuracyCount = 0;
      }
      if (geolocation._accuracyCount >= AccuracyChangeTicks) {
        geolocation.accuracy = POOR;
      }
    } else if (geolocation.accuracy === POOR) {
      if (currentAccuracy < poorAccuracyThreshold) {
        geolocation._accuracyCount--;
      } else {
        geolocation._accuracyCount = AccuracyChangeTicks;
      }
      if (geolocation._accuracyCount <= 0) {
        geolocation.accuracy = GOOD;
      }
    }
  } else if (geolocation._reachedInitialStable) {
    // it was stable at one point, but now it's not
    if (geolocation.accuracy === GOOD) {
      geolocation._accuracyCount++;
      if (geolocation._accuracyCount >= AccuracyChangeTicks) {
        geolocation.accuracy = POOR;
      }
    }
  }
}


function onHeadingUpdate(/* evt */) {
  // TODO: heading messages are too frequent. Provide a separate subscription
  // for those events?
  // console.log(JSON.stringify(evt));
  /*
   geolocation.lastHeading = evt.heading;
   if (!geolocation.lastPoint) return;
   geolocation._locationSubscribers.forEach((subscriber) => {
     subscriber.fn(geolocation.lastPoint, geolocation.lastHeading, geolocation.lastSpeed);
   });
   */
}

function onLocationError(evt) {
  geolocation._locationSubscribers.forEach((subscriber) => {
    if (subscriber.errFn) {
      subscriber.errFn(evt.msg);
    }
  });
}

function onGeofenceEvent(evt) {
  console.log(`Got geofence message: ${JSON.stringify(evt)}`);
  geolocation._geofenceSubscribers.forEach((subscriber) => {
    subscriber.fn(evt.name, evt.didEnter);
  });
}

export const useLocationEnabled = () => {

  const appState = useRef(AppState.currentState);
  const [locationEnabled, setLocationEnabled] = useState(undefined);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkPermissions();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkPermissions = () => {
    checkMultiple([
      PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      PERMISSIONS.IOS.LOCATION_ALWAYS,
      PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    ]).then((statuses => {
      const enabled = getEnabled(statuses);
      setLocationEnabled(enabled);
    }));
  };

  const getEnabled = (statuses) => {
    return (Devices.isAndroid && androidHasLocationPermission(statuses)) ||
      (Devices.isIphone && iosHasLocationPermission(statuses));
  };

  const androidHasLocationPermission = (statuses) => {
    return statuses[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] === 'granted' || statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] === 'granted';
  };

  const iosHasLocationPermission = (statuses) => {
    return statuses[PERMISSIONS.IOS.LOCATION_ALWAYS] === 'granted' ||
      statuses[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE] === 'granted';
  };

  return locationEnabled;
};

export const useGeolocation = () => {
  const [currentLocation, setCurrentLocation] = useState({ position: null, heading: null, speed: null });
  const [geolocationWatchId, setGeolocationWatchId] = useState(undefined);

  useEffect(() => {
    if (!geolocationWatchId) {
      let watchId = geolocation.subscribe(handleUserLocationChange, geolocation.Quality.AREA);
      setGeolocationWatchId(watchId);
      setCurrentLocation({ position: geolocation.lastPoint, heading: -1, speed: 0 });
    }
    return () => {
      if (geolocationWatchId) {
        geolocationWatchId.cancel();
        setGeolocationWatchId(undefined);
      }
    };
  }, []);

  const handleUserLocationChange = useCallback((position, heading, speed) => {
    setCurrentLocation({ position: position, heading: heading, speed: speed });
  }, []);

  return {
    currentLocation,
    geolocator: geolocation,
  };
};
