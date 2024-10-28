/**
 * Tracks important status information on active / upcoming trips.
 * @module triptracker
 */

// import { Toast } from 'react-native';
import { fromGeoJSON } from '../utils/polyline';

// import config from '../config';
// import NotificationsService from './notifications';
import stream from './stream';
import navigator from './navigator';
import clock from '../models/clock';

const subscribers = [];
const trackedVehicles = []; // tracking taxi, carpool, etc.

let _store;

function onNavigationProgress(tripProgress) {
  // const tripPlan = tripProgress?.tripPlan;
  // if (!tripPlan) return;
  const msg = {
    // id: tripProgress.tripPlan.request.commuteTripId,
  };
  msg.location = {
    lng: tripProgress.latLng.lng,
    lat: tripProgress.latLng.lat,
    heading: tripProgress.heading,
    speed: tripProgress.instSpeed,
    timestamp: clock.now(),
  };
  msg.legIndex = tripProgress.legIndex;
  msg.legTimeLeft = tripProgress.legDurationRemaining;
  // Commented by Jon for now, could be useful for sending to caregiver.
  // stream.sendMessage('shuttles', 'progress', msg);
}

let lastRouteUpdate;
let updateTimer = null;

function onNavigationRouteChanged(route) {
  console.log(`Nav route is changing, valid: ${!!route}`);
  if (!route) {return;}

  const tripPlan = navigator.tripProgress?.tripPlan;
  if (!tripPlan) {return;}
  const msg = {
    // id: tripPlan.id,
    // toWaypoint: navigator.tripProgress.nextWaypoint,
    legIndex: navigator.tripProgress.legIndex,
    legTimeLeft: navigator.tripProgress.legDurationRemaining,
    legs: tripPlan.legs.map((leg) => ({
      startTime: leg.startTime,
      endTime: leg.endTime,
      duration: leg.duration,
      distance: leg.distance,
      toWaypoint: tripPlan.legEndpoint(leg.to),
      polyline: fromGeoJSON(leg.geometry),
    })),
    // polyline: fromGeoJSON(route.geometry),
  };
  // console.log(`Sending route to server: ${JSON.stringify(msg)}`);
  // Commented by Jon for now, could be useful for sending to caregiver.
  // stream.sendMessage('shuttles', 'route', msg);
  lastRouteUpdate = msg;

  if (updateTimer) {
    clearInterval(updateTimer);
  }
  // Commented by Jon for now, could be useful for sending to caregiver.
  // updateTimer = setInterval(() => {
  //   stream.sendMessage('shuttles', 'route', lastRouteUpdate);
  // }, 30000);
}

function applyTrackedVehicleUpdate(trip, driver, driverProgress) {
  // console.log(`${JSON.stringify(driver)} @ ${JSON.stringify(location)}`);
  let vehicle;
  for (let i = 0; i < trackedVehicles.length; i++) {
    const v = trackedVehicles[i];
    if (v.driver === driver) { // (v.trip === trip && v.driver === driver) {
      vehicle = v;
      break;
    }
  }
  if (!vehicle) {
    vehicle = { trip, driver };
    trackedVehicles.push(vehicle);

    /*
    Toast.show({
      text: 'Your vehicle is on its way.',
      duration: 15000,
      position: 'bottom',
      textStyle: { textAlign: 'center' },
      buttonText: 'Hide',
    });
    */
  }
  vehicle.location = driverProgress.location;
  vehicle.legIndex = driverProgress.legIndex;
  vehicle.legTimeLeft = driverProgress.legTimeLeft;
  /*
  if (!vehicle.hasGottenClose) {
    const myLocation = geolocation.lastPoint;
    if (myLocation
    && distance([location.lng, location.lat], [myLocation.lng, myLocation.lat]) < 3) {
      vehicle.hasGottenClose = true;
      Toast.show({
        text: 'Your vehicle will soon be arriving to pick you up.',
        duration: 30000,
        position: 'bottom',
        textStyle: { textAlign: 'center' },
        buttonText: 'Hide',
      });
    }
  }
  */

  for (let i = 0; i < subscribers.length; i++) {
    subscribers[i].fn('vehicleUpdate', vehicle.trip, vehicle);
  }
}

function applyShuttleProgress(driverProgress) {
  if (!driverProgress.location) {return;}
  if (_store.authentication.user.role === 'rider') {
    applyTrackedVehicleUpdate(null, driverProgress.userId, driverProgress);
  }
}

function applyRouteUpdate(routeUpdate) {
  lastRouteUpdate = routeUpdate;
  for (let i = 0; i < subscribers.length; i++) {
    subscribers[i].fn('routeUpdate', routeUpdate);
  }
}

function gotShuttleMessage(msg) {
  const { user } = _store.authentication;
  if (user.role === 'driver') {
    // This wouldn't be needed in a production system, but when you
    // run a rider and driver app on the same React Native server the
    // messages get sent to BOTH systems.
    return;
  }
  if (msg.action === 'progress') {
    applyShuttleProgress(msg);
  } else if (msg.action === 'route') {
    applyRouteUpdate(msg);
  }
}

let navWatcher;
let navRouteWatcher;
let streamWatcher;

const triptracker = {

  init(store) {
    _store = store;
    navWatcher = navigator.subscribe(onNavigationProgress);
    navRouteWatcher = navigator.onRouteChanged(onNavigationRouteChanged);
    streamWatcher = stream.addListener('shuttle', gotShuttleMessage);
  },

  shutdown() {
    if (streamWatcher) {
      streamWatcher.remove();
      streamWatcher = null;
    }
    if (navWatcher) {
      navWatcher.cancel();
      navWatcher = null;
      navRouteWatcher.cancel();
      navRouteWatcher = null;
    }
  },

  subscribe(fn) {
    const subscriber = {
      fn,
      cancel: () => {
        const index = subscribers.indexOf(subscriber);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }
      },
    };
    subscribers.push(subscriber);

    // make sure subscriber knows the current state.
    setTimeout(() => {
      if (lastRouteUpdate) {
        subscriber.fn('routeUpdate', lastRouteUpdate);
      }
    }, 0);

    return subscriber;
  },

  trackedVehicles,

};

export default triptracker;
