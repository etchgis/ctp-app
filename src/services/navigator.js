/**
 * Service that tracks the progress of the user along their current trip.
 * @module navigator
 */

import clock from '../models/clock';
import { geolocation } from '../models/geolocation';
import RouteProgress from '../models/route-progress';
import TripProgress from '../models/trip-progress';
import voice from './voice';

/*
A trips is a list of legs. Each leg may be a different mode:
   WALK -> RENT -> BIKE -> DROPOFF -> WALK -> BUS -> WALK

The biggest challenge of navigation is inferring what mode the user is on:
 - User may decide to skip bike rental and walk past it. How does app know?
 - User minimizes app for 10 minutes and there's no background location. When the
 app comes back up, how does it decide how to continue?
 - User goes past bus stop, did they get off or not?
 - User is moving from a bus stop, did they make it on the bus?

Structure of navigation system:

 - models/routeprogress is exclusively focused on tracking progress along a leg
 to show directions.
 - services/navigation starts and stops navigation and receives GPS coordinates.
 - services/rerouter replans the remainder of trip from the current location, and
 transitions to the next leg. It may also backtrack to a prior leg.
 */

// time to ignore mapbox progress updates after updating the route.
// const WAIT_AFTER_ROUTE_UPDATE_MS = 5000;

const navigator = {

  tripProgress: null,

  route: null,
  routeProgress: null,

  /**
   * List of listeners for navigation progress updates.
   */
  _progressSubscribers: [],

  /**
   * List of listeners for navigation route updates.
   */
  _routeSubscribers: [],

  /**
   * User telemetry log of breacrumbs for current trip.
   * Each log entry has: { lat, lng, speed, heading, legIndex }
   * The legIndex is inferred based on user movements.
   */
  _log: [],

  /*
   * History of inferred legs that were in the trip up to and
   * including the current leg.
   * Each entry has: { mode }
   */
  _history: [],

  /**
   * The language to use for voice and banners.
   */
  _language: 'en',

  startTime: 0,

  /**
   * Returns true if navigation is running.
   * @return {boolean}
   */
  isRunning() {
    return navigator.startTime !== 0;
  },

  /**
   * If navigation is running and coordinates are available, this provides the
   * latest `TripProgress`.
   * @returns {TripProgress}
   */
  getTripProgress() {
    return navigator.tripProgress;
  },

  /**
   * Returns the trip model with the  OTP trip plan that the navigation is following.
   * @return {TripPlan} - route to follow, if navigation is running.
   */
  getTripPlan() {
    if (navigator.isRunning()) {
      return navigator.trip;
    }
    return null;
  },

  /**
   * Called when trip plan changes during routing.
   */
  updateTripPlan(trip) {
    if (navigator.isRunning()) {
      navigator.trip = trip;
    }
  },

  /**
   * Begins navigation tracking for the current trip.
   */
  start(trip, language = 'en') {
    if (navigator.isRunning()) {
      return;
    }

    navigator.trip = trip;

    navigator._language = language;

    console.log('Navigation service started.');
    navigator.startTime = clock.now();

    // send null route to subscribers before GPS is first applied
    navigator.updateRoute(null);

    if (!navigator._gpsWatchId) {
      navigator._gpsWatchId = geolocation.subscribe(
        navigator._updateUserLocation,
        geolocation.Quality.BEST,
      );
    }
  },

  /**
   * Ends navigation tracking for the current trip.
   */
  stop() {
    console.log('stopping navigation...');
    if (navigator.isRunning()) {
      navigator.startTime = 0;
      // navigator.actions.navigation.stop();
      // navigator.actions.navigation.resetProgress();
      console.log('navigation has been stopped and progress cleared.');

      if (navigator._gpsWatchId) {
        navigator._gpsWatchId.cancel();
        delete navigator._gpsWatchId;
      }
      geolocation.clearGeofences(); // TEMP? maybe be more selective?
      // navigator.actions.map.setFocus(null);

      // navigator.sendLog();

      navigator.updateRoute(null);
    }
  },

  updateRoute(route) {
    console.log('navigation route updating.');

    navigator.route = route;
    navigator.routeProgress = route ? new RouteProgress(route) : null;

    // don't send route updates when resetting after navigation (route gets set to null)
    if (navigator.isRunning()) {
      if (route) {
        console.log('applying new route');
        navigator.applyLatestGps();
      }

      navigator._routeSubscribers.forEach((subscriber) => {
        subscriber.fn(navigator.route);
      });
    }
  },

  /**
   * Apply coordinates to the navigation progress and update the app state.
   */
  updateProgress(latLng, heading, speed) {
    const { route, routeProgress } = navigator;
    const tripPlan = navigator.getTripPlan();

    // It's possible for this to be called after navigation is ended.
    // It's also possible to get GPS points before route is calculated.
    // It's also possible for the trip to be changed while navigation is still running.
    if (!navigator.isRunning() || !routeProgress || !tripPlan) {
      return;
    }

    routeProgress.update(latLng, heading, speed, navigator._language);

    const lastProgress = navigator.tripProgress;
    navigator.tripProgress = new TripProgress(tripPlan, route, routeProgress, navigator.startTime);

    // console.log(JSON.stringify(navigator.tripProgress));

    // navigator.updateLog({
    //   latLng, heading, speed, routeProgress: routeProgress.asPojo(), timestamp: Date.now(),
    // });

    navigator._progressSubscribers.forEach((subscriber) => {
      subscriber.fn(navigator.tripProgress, lastProgress);
    });

    const voiceInstruction = navigator.tripProgress
      ? navigator.tripProgress.voiceInstruction : null;
    const lastVoiceInstruction = lastProgress ? lastProgress.voiceInstruction : null;
    if (voiceInstruction !== lastVoiceInstruction && voiceInstruction) {
      navigator.handleVoiceInstruction(voiceInstruction);
    }
  },

  _updateUserLocation() { // position, heading, speed) {
    navigator.applyLatestGps();
  },

  applyLatestGps() {
    const position = geolocation.lastPoint;
    const heading = geolocation.lastHeading;
    const speed = geolocation.lastSpeed;
    // console.log(`applying gps to navi: ${JSON.stringify(position)}`);
    navigator.updateProgress(position, heading, speed);
  },

  handleVoiceInstruction(voiceInstruction) {
    console.log(`Voice instruction "${voiceInstruction.announcement}"`);
    // voice.speak(voiceInstruction.ssmlAnnouncement);
    voice.speak(voiceInstruction.announcement);
  },

  /**
   * Subscribe to changes in the user's position. Call `cancel` when done subscribing.
   * @param {Function} fn - Callback for receiving each position.
   * @param {Function} errFn - Called as errors occur.
   * @returns {Object} A watcher object with the `cancel` function.
   */
  subscribe: (fn, errFn) => {
    const subscriber = {
      fn,
      errFn,
      cancel: () => {
        const index = navigator._progressSubscribers.indexOf(subscriber);
        if (index !== -1) { navigator._progressSubscribers.splice(index, 1); }
      },
    };
    navigator._progressSubscribers.push(subscriber);

    // Always give them the last known progress value
    if (navigator.routeProgress) {
      fn(navigator.routeProgress);
    }

    return subscriber;
  },

  /**
   * Subscribe to changes in the route. Call `cancel` when done subscribing.
   * @param {Function} fn - Callback for receiving each update.
   * @param {Function} errFn - Called as errors occur.
   * @returns {Object} A watcher object with the `cancel` function.
   */
  onRouteChanged: (fn, errFn) => {
    const subscriber = {
      fn,
      errFn,
      cancel: () => {
        const index = navigator._routeSubscribers.indexOf(subscriber);
        if (index !== -1) { navigator._routeSubscribers.splice(index, 1); }
      },
    };
    navigator._routeSubscribers.push(subscriber);

    // Always give them the last known value
    if (navigator.route) {
      fn(navigator.route);
    }

    return subscriber;
  },

};

export default navigator;
