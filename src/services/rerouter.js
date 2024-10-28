/**
 * The services in this module calculate routes to send to the navigation engine.
 * It clips a full TripPlan down to a single leg with upcoming steps.
 */

import nearestPointOnLine from '@turf/nearest-point-on-line';
import distance from '@turf/distance';

import config from '../config';
import TripPlan from '../models/trip-plan';
import clock from '../models/clock';
import { geolocation } from '../models/geolocation';
import navigator from './navigator';
import TripPlanInput from '../models/trip-plan-input';

const REROUTE_AGAIN_DELAY_MS = 10000;
// TEMP? force re-route even if navigation says we're on-route
// const FORCE_REROUTE_RATE_MS = 30000;

let _lastRouteUpdateTime = 0;
// let _lastRouteCheckTime = 0;
let _navProgressWatch = null;
let _navRouteWatch = null;
let _lastQueryTime = null;

const _subscribers = [];

let _isRerouting = false;

let _store;

function setRerouting(isRerouting) {
  if (isRerouting === _isRerouting) {
    return;
  }
  _isRerouting = isRerouting;
  _subscribers.forEach((subscriber) => {
    subscriber.fn(isRerouting);
  });
}

/**
 * Return a copy of the trip plan that can be trimmed down during the
 * course of trip execution.
 * @param {TripPlan} plan
 */
function initRoute(plan) {
  const route = { ...plan };
  route.startedFrom = {
    routeLegIndex: 0,
    legStepIndex: 0,
    distAlongRoute: 0,
    distAlongLeg: 0,
    distAlongStep: 0,
  };
  route.endTrimDist = 0;

  return route;
}

/**
 * Get leg / step of the route that is closest to the current point.
 * The route is treated as immutable, a trimmed copy is returned.
 * @param {*} currentLocation
 * @param {*} route
 */
function trimRouteToLocation(currentLocation, route) {
  // TODO: this needs to be made smarter over time -- a route can double back on itself because
  // the user needs to transition modes to a rented bike/scooter or a bus line. Right now, an
  // earlier leg will be selected when there is an exact tie, but it is pretty much random
  // otherwise.
  const currentLocationPoint = {
    type: 'Point',
    coordinates: [currentLocation.lng, currentLocation.lat],
  };

  let closestLegIndex;
  let closestStepIndex;
  // let closestStepPoint;
  let closestDistToRoute = Number.MAX_VALUE;

  // route.legs.forEach((leg, legIndex) => {
  const leg = route.legs[0];
  if (leg) {
    leg.steps.forEach((step, stepIndex) => {
      const geojson = step.geometry;
      const stepPt = nearestPointOnLine(geojson, currentLocationPoint);
      const dist = distance(stepPt, currentLocationPoint);
      if (dist < closestDistToRoute) {
        closestDistToRoute = dist;
        closestLegIndex = 0; // legIndex;
        closestStepIndex = stepIndex;
        // closestStepPoint = stepPt;
      }
    });
    closestDistToRoute = Math.round(closestDistToRoute * 1000); // km to meters
  }
  // });

  // console.log('off-route: ' + closestDist + ' ' + routeLegIndex + '/' + legStepIndex);

  // Don't snap if we're far from the route
  if (closestDistToRoute > config.SNAP_TO_ROUTE_METERS) {
    return null;
  }

  const trimmed = { ...route };
  trimmed.legs = trimmed.legs.slice();

  // trim up to the closest leg if needed
  if (closestLegIndex !== 0) {
    const deletedLegs = trimmed.legs.splice(0, closestLegIndex);
    // route.routeOptions.coordinates.splice(0, closestLegIndex * 2);
    deletedLegs.forEach((deletedLeg) => {
      trimmed.distance -= deletedLeg.distance;
      trimmed.duration -= deletedLeg.duration;
    });
  }

  const newFirstLeg = { ...trimmed.legs[0] };
  trimmed.legs[0] = newFirstLeg;
  // const firstLegPt = newFirstLeg.steps[0].geometry.coordinates[0];
  const originalLegLen = newFirstLeg.distance;

  if (closestStepIndex !== 0) {
    newFirstLeg.steps = newFirstLeg.steps.slice();
    const deletedSteps = newFirstLeg.steps.splice(0, closestStepIndex);
    deletedSteps.forEach((deletedStep) => {
      trimmed.distance -= deletedStep.distance;
      trimmed.duration -= deletedStep.duration;
      newFirstLeg.distance -= deletedStep.distance;
      newFirstLeg.duration -= deletedStep.duration;
    });
  }

  const newFirstStep = newFirstLeg.steps[0];
  const originalStepLen = newFirstStep.distance;

  // TODO: slice the step and route at the closestStepPoint
  // const stepGeom = newFirstStep.geometry;
  // const rtGeom = trimmed.geometry;
  // const lastRtPt = rtGeom.coordinates[rtGeom.coordinates.length - 1];
  // const firstStepPt = stepGeom.coordinates[0];
  // const sliced = lineSlice(firstStepPt, lastRtPt, rtGeom).geometry;
  // trimmed.geometry = sliced; // fromGeoJSON(sliced, 6);
  trimmed.geometry = newFirstLeg.geometry;

  const deletedRouteLen = route.distance - trimmed.distance;
  const deletedLegLen = originalLegLen - newFirstLeg.distance;
  const deletedStepLen = originalStepLen - newFirstStep.distance;

  trimmed.startedFrom = {
    routeLegIndex: closestLegIndex,
    legStepIndex: closestStepIndex,
    // distAlongRoute: turfLength(lineSlice(firstRtPt, firstStepPt, rtGeom)) * 1000,
    // distAlongLeg: turfLength(lineSlice(firstLegPt, firstStepPt, rtGeom)) * 1000,
    distAlongRoute: deletedRouteLen,
    distAlongLeg: deletedLegLen,
    distAlongStep: deletedStepLen,
  };
  return trimmed;
}

/**
 * Removes all legs up to the given routeLegIndex.
 * The route is treated as immutable, a trimmed copy is returned.
 * @param {*} route
 * @param {*} routeLegIndex
 */
function trimRouteUpToLeg(route, routeLegIndex) {
  const trimmed = { ...route };
  trimmed.legs = trimmed.legs.slice();
  let deletedDistanceToLeg = 0;
  if (routeLegIndex !== 0) {
    const deleted = trimmed.legs.splice(0, routeLegIndex);
    deleted.forEach((deleteLeg) => {
      trimmed.distance -= deleteLeg.distance;
      trimmed.duration -= deleteLeg.duration;
      deletedDistanceToLeg += deleteLeg.distance;
    });
  }

  const newFirstLeg = trimmed.legs[0];
  trimmed.geometry = newFirstLeg.geometry;

  // total distance up to leg
  // const distAlongRoute = turfLength(lineSlice(firstRtPt, firstLegPt, rtGeom)) * 1000;

  // console.log(`new first leg point: ${JSON.stringify(firstLegPt)}`);
  console.log(`new first route point: ${JSON.stringify(trimmed.geometry.coordinates[0])}`);
  console.log(`went from ${route.legs.length} legs to ${trimmed.legs.length}, deleted ${deletedDistanceToLeg}m`);

  trimmed.startedFrom = {
    routeLegIndex,
    legStepIndex: 0,
    distAlongRoute: deletedDistanceToLeg,
    distAlongLeg: 0,
    distAlongStep: 0,
  };

  return trimmed;
}

/**
 * Cuts the route to just the first leg.
 * The route is treated as immutable, a trimmed copy is returned.
 * A copy will be created even if the route is already a single leg.
 * @param {} route
 */
function trimRouteToSingleLeg(route) {
  console.log('Trimming route to single leg...');
  const nbrLegs = route.legs.length;

  const trimmed = { ...route };
  trimmed.legs = trimmed.legs.slice(0, 1);

  let endTrimDist = 0;
  const deleted = route.legs.slice(1);
  deleted.forEach((deleteLeg) => {
    trimmed.distance -= deleteLeg.distance;
    trimmed.duration -= deleteLeg.duration;
    endTrimDist += deleteLeg.distance;
  });

  const leg = trimmed.legs[0];
  trimmed.geometry = leg.geometry;

  trimmed.endTrimDist = endTrimDist;

  console.log(`route went from ${nbrLegs} to ${trimmed.legs.length}`);
  return trimmed;
}

/**
 * Query a new trip plan from the user's current location, using the
 * current trip plan as a template.
 * TODO: make this multi-modal like the version above.
 * @param {*} currentLocation
 */
function createNewTripPlan(currentLocation) {
  // don't do another query if one is running. Account for the possibility
  // it got stuck a while ago.
  if (_lastQueryTime && clock.now() - _lastQueryTime < 20000) {
    return Promise.resolve(null);
  }

  const tripPlan = navigator.getTripPlan();

  const tripRequest = _store.trip.request.copy();
  // const tripRequest = {};

  let { waypoints } = tripPlan;

  const tripProgress = navigator.getTripProgress();
  let currentLegIndex = 0;
  if (tripProgress?.legIndex) {
    currentLegIndex = tripProgress.legIndex;
    waypoints = waypoints.slice(currentLegIndex);
  } else {
    waypoints = waypoints.slice();
  }
  if (waypoints[0]?.type !== 'start') {
    waypoints.unshift({}); // first one
  }

  console.log(`Rerouting from location ${JSON.stringify(currentLocation)}`);
  waypoints[0] = {
    type: 'start',
    time: Math.floor(Date.now() / 1000),
    coordinates: [currentLocation.lng, currentLocation.lat],
  };

  tripRequest.waypoints = waypoints;

  const origin = {
    point: {
      lat: currentLocation.lat,
      lng: currentLocation.lng
    },
  }
  tripRequest.updateProperty('origin', origin);

  /**
   * use only modes from curret trip plan and not from the original trip request
   */
  tripRequest.updateProperty('modes', []);
  const modes = tripPlan.legs.map((leg) => leg.mode);
  for (var i = 0; i < modes.length; i++) {
    tripRequest.addMode(modes[i].toLowerCase());
  }

  /*
  const currentLeg = tripPlan.legs[currentLegIndex];

  const thisLegOnly = currentLeg.isCarpool; // can't bypass pickup and dropoff legs!
  if (thisLegOnly) {
    tripRequest.destination = {
      point: { lat: currentLeg.to.lat, lng: currentLeg.to.lon },
    };
    console.log(`Routing to waypoint ${JSON.stringify(tripRequest.destination.point)}`);
  }
  */

  /*
  // tripRequest.modes = preferredToTripModes(selModes);
  // tripRequest.options = preferredToTripOptions(selModes);
  // tripRequest.bannedAgencies = preferredToBannedAgencies(selModes);
  // tripRequest.bannedProviders = preferredToBannedProviders(selModes);
  if (_states.preferences.wheelchair) {
    tripRequest.addRequirement('wheelchair');
  } else {
    tripRequest.removeRequirement('wheelchair');
  }

  _actions.trips.setRequest(tripRequest);
  */

  console.log(`Performing query for new plan with waypoints: ${waypoints} - and modes: ${tripRequest.modes}`);
  const queryTime = clock.now();
  _lastQueryTime = queryTime;

  return TripPlan.generate(tripRequest, _store.preferences, _lastQueryTime) // , _states.preferences)
    .then((results) => {
      console.log('trips query completed.');
      // make sure it's most recent.
      if (_lastQueryTime === queryTime) {
        _lastQueryTime = null;
        console.log('using the query results.');
        /*
        const planResults = results.plans.sort(
          TripPlan.compareFunction(_states.preferences.sortBy),
        );
        */
        console.log(`found ${results.plans.length} options.`);
        if (results.plans.length > 0) {
          const oldPlan = navigator.getTripPlan();
          // const [newPlan] = results.plans;
          // const newPlan = TripPlanInput.standardize(results.plans[0]);
          const newPlan = new TripPlan(results.plans[0]);
          if (!oldPlan) {
            console.log('plan was cancelled before rerouting finished');
            return null;
          }
          // check for indoor and appened or prepend if necessary
          if (oldPlan.legs[0].mode === 'INDOOR') {
            console.log('prepending indoor leg');
            newPlan.legs.unshift(oldPlan.legs[0]);
          }
          if (oldPlan.legs[oldPlan.legs.length - 1].mode === 'INDOOR') {
            console.log('appending indoor leg');
            newPlan.legs.push(oldPlan.legs[oldPlan.legs.length - 1]);
          }
          /* if (thisLegOnly) {
            const newLeg = newPlan.legs[0];
            newPlan = { ...oldPlan }; // copy ensures it won't get confused with old plan
            newPlan.legs[currentLegIndex] = newLeg;
            newPlan.duration = oldPlan.duration - currentLeg.duration + newLeg.duration;
            if (currentLeg.isCarpool) {
              newLeg.isCarpool = true;
              newLeg.fromWaypoint = currentLeg.fromWaypoint;
              newLeg.toWaypoint = currentLeg.toWaypoint;
            }
            console.log(`replaced leg ${currentLegIndex} with a new path (${newPlan.duration} vs ${oldPlan.duration} seconds)`);
            console.log(JSON.stringify(newPlan.legs[currentLegIndex]));
          } else {
            newPlan.id = oldPlan.id;
            newPlan.notificationId = oldPlan.notificationId;
          } */
          // console.log('OLD PLAN', oldPlan);
          return newPlan;
        }
        console.log('new route NOT found');
      }
      return null;
    })
    .catch((err) => {
      console.log(`new trip plan for rerouting failed: ${err.message}`);
      if (_lastQueryTime === queryTime) {
        _lastQueryTime = null;
      }
      throw err;
    });
}

function applyRoute(route) {
  navigator.updateRoute(route);
}

function applyTripPlan(tripPlan) {
  navigator.updateTripPlan(tripPlan);
}

function offlineRoute(currentLocation, tripPlan) {
  const route = initRoute(tripPlan);
  return currentLocation ? trimRouteToLocation(currentLocation, route) : route;
}

function findSimilarRoute(currentLocation) {
  // Find a trip with the same time window (if possible) and
  // use the trip ID to query similar bus routes
  return createNewTripPlan(currentLocation)
    .then((newPlan) => {
      console.log('setting new route.');
      const route = initRoute(newPlan);
      applyTripPlan(newPlan);
      return route;
    });
}

function advanceLeg() {
  const oldRoute = navigator.route;
  console.log(`advancing the route from prior leg: ${oldRoute?.startedFrom?.routeLegIndex}`);
  if (oldRoute) {
    const nextLegIndex = oldRoute.startedFrom.routeLegIndex + 1;
    const tripPlan = navigator.getTripPlan();
    if (tripPlan && nextLegIndex < tripPlan.legs.length) {
      console.log(`switching to leg ${nextLegIndex}`);
      let route = initRoute(tripPlan);
      route = trimRouteUpToLeg(route, nextLegIndex);
      route = trimRouteToSingleLeg(route);
      console.log(`final new route: ${route.legs.length} legs, first point: ${JSON.stringify(route.geometry.coordinates[0])}`);
      applyRoute(route);
    }
  }
}

/**
 * Calculate a new route from the current trip and navigation state.
 */
function update() {
  const tripPlan = navigator.getTripPlan();
  const { route } = navigator;
  const tripProgress = navigator.getTripProgress();

  _lastRouteUpdateTime = clock.now();

  let currentLocation = null;
  let currentLegIndex = -1;
  let currentLeg = null;
  if (route) {
    const isSamePlan = tripPlan === route.plan;
    currentLocation = geolocation.lastPoint;
    if (isSamePlan && tripProgress) {
      currentLegIndex = tripProgress.legIndex;
      currentLeg = tripPlan.legs[currentLegIndex];
    }
  }

  let originalRoute;
  console.log(`Updating route (trip: ${tripPlan?.legs?.length} legs) (using navi: ${!!currentLocation})...`);
  // _lastRouteCheckTime = clock.now();
  return new Promise((resolve) => {
    const newRoute = offlineRoute(currentLocation, tripPlan);
    originalRoute = newRoute;

    // route will be null if nothing is close on the existing route.
    // TODO: occassionally check for a new route anyway, and compare
    // new and existing route for quality
    if (newRoute) {
      console.log('Picking up on the original route.');
      // actions.navigation.setRerouting(false);
      resolve(originalRoute);
      return;
    }
    console.log(`MODE: ${currentLeg?.mode}`);
    if (!config.ALLOW_REROUTE || !currentLocation
      || (currentLeg && currentLeg.mode === 'BUS')) {
      // actions.navigation.setRerouting(false);
      resolve(null);
      return;
    }
    // if (!states.navigation.offRoute)
    //   return originalRoute;
    console.log('Finding a new, similar route.');
    setRerouting(true);
    resolve(findSimilarRoute(currentLocation));
  })
    .then((newRoute) => {
      console.log('All route calculation completed.');
      // use better route or original route
      let useRoute = newRoute || originalRoute;
      console.log(`Got a new route: ${!!useRoute}`);
      if (useRoute) {
        if (useRoute === originalRoute) {
          if (currentLegIndex === useRoute.startedFrom.routeLegIndex) {
            console.log('The best leg has not changed, nothing is changing');
            return null;
          }
        }
        useRoute = trimRouteToSingleLeg(useRoute);
        applyRoute(useRoute);
      }
      setRerouting(false);
      return newRoute;
    })
    .catch((err) => {
      console.error('Rerouting failure', err);
      setRerouting(false);
    });
}

function getBackOnRoute(route, tripProgress) {
  update(route, tripProgress);
}

function advanceLegIfNeeded(tripProgress) {
  // check if transitioning from walk to bus
  /*
  var rte = states.navigation.route,
    t = states.trips.selectedPlan,
    waitForBus = false,
    timeUntilBus = Math.max();
  if (rte && t) {
    var cli = rte.startedFrom.routeLegIndex,
      nli = rte.startedFrom.routeLegIndex + 1;
    if (nli < t.legs.length) {
      var cleg = t.legs[cli],
        nleg = t.legs[nli];
      if (cleg.mode.toLowerCase() === 'walk' && nleg.mode.toLowerCase() === 'bus') {
        waitForBus = true;
        timeUntilBus = (nleg.startTime - clock.now()) / 1000; // seconds
      }
    }
  }
  */

  // const now = clock.now();
  // const timeSinceReroute = now - _lastRouteUpdateTime;
  // const timeSinceRerouteCheck = now - _lastRouteCheckTime;
  // if (timeSinceReroute < REROUTE_AGAIN_DELAY_MS) {
  //   return;
  // }
  if (tripProgress.legDistanceRemaining < 0.1) {
    // && (!waitForBus || (waitForBus && timeUntilBus < 30))) {
    // console.log('advancing leg from ' + routeProgress.legIndex + '...');
    advanceLeg();
  } // else if (timeSinceRerouteCheck > FORCE_REROUTE_RATE_MS) {
  //   TEMP? force a re-route check even if we're on-route
  //   update(states, actions, tripProgress);
  // }
}

function switchTripPlan(newPlan) {
  console.log('setting new trip plan, with waypoints:');
  console.log(JSON.stringify(newPlan.waypoints));
  navigator.updateTripPlan(newPlan);
  update();
}

function handleNavigationRouteChanged(route) {
  if (!route) {
    // set initial route for navigation
    update();
  }
}

function handleNavigationProgress(tripProgress, oldProgress) {
  const wasOffRoute = oldProgress && oldProgress.offRoute;
  if (tripProgress.offRoute) {
    if (!wasOffRoute) {
      console.log('User has gone off route!');
      // _actions.navigation.setOffRoute(true);
    }
    if (!_isRerouting) {
      const timeSinceReroute = clock.now() - _lastRouteUpdateTime;
      if (!wasOffRoute || timeSinceReroute > REROUTE_AGAIN_DELAY_MS) {
        getBackOnRoute(tripProgress);
      }
    } else {
      console.log('Rerouting is already underway, ignoring progress update.');
    }
  } else {
    if (wasOffRoute) {
      console.log('User is back on route.');
      // _actions.navigation.setOffRoute(false);
    }
    advanceLegIfNeeded(tripProgress);
  }
}

/**
 * Subscribe to changes in the rerouting status. Call `cancel` when done subscribing.
 * @param {Function} fn - Callback for receiving each status update, with a true or false arg.
 * @param {Function} errFn - Called as errors occur.
 * @returns {Object} A watcher object with the `cancel` function.
 */
function subscribe(fn, errFn) {
  const subscriber = {
    fn,
    errFn,
    cancel: () => {
      const index = _subscribers.indexOf(subscriber);
      if (index !== -1) {
        _subscribers.splice(index, 1);
      }
    },
  };
  _subscribers.push(subscriber);
  return subscriber;
}

function init(store) {
  _store = store;
  _navProgressWatch = navigator.subscribe(handleNavigationProgress);
  _navRouteWatch = navigator.onRouteChanged(handleNavigationRouteChanged);
}

function shutdown() {
  if (_navProgressWatch) {
    _navProgressWatch.cancel();
    _navRouteWatch.cancel();
    _navProgressWatch = null;
    _navRouteWatch = null;
  }
}

export default {
  init,
  shutdown,
  subscribe,
  switchTripPlan,
};