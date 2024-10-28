/**
 * Coordinates the simulation of all the various realtime app features.
 * @module simulator
 */

import randomSeed from 'random-seed';
import along from '@turf/along';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import destination from '@turf/destination';
import bearing from '@turf/bearing';

import config from '../config';
import clock from '../models/clock';
import navigator from './navigator';
import { geolocation } from '../models/geolocation';

const OFFROUTE_INTERVAL_MS = 0; // how often to go offroute (or 0)
const GPS_INTERVAL_MS = 1000; // how often to generate points
const GPS_ERROR_METERS = 0; // max error for simulated coordinates
const GPS_DRIFT_METERS = 0; // max drift from route
const RANDOM_SEED = 'etch'; // so we have consistent randomness every time

let gpsTimer = null;
let navProgressWatch = null;
let navRouteWatch = null;
const rand = randomSeed.create(RANDOM_SEED);

let goingOffRoute = false;
let lastRerouteAt = 0;
let gpsDrift = 0; // TODO: evolve over time
let gpsDriftDir = 0; // TODO: evolve over time

const simulator = {

  tripPlan: null,
  tripPlanGeometry: null,
  isRunning: false,
  isMoving: false,
  speed: 1,
  startOffsetMins: 0,

  distAlongPath: 0,
  metersPerSec: 0,
  heading: -1,
  location: null, // sim GPS location, before randomization

  doSimulateDelays: () => false, // simulator.isRunning,

  simulatingGps: () => simulator.isMoving,

  /**
   * Start a simulation that begins at the given time and proceeds at the given rate.
   * @param {Number} startTime - Millisecond epoch time.
   * @param {Number}speed - Clock time multiplier.
   */
  start: (startTime, speed) => {
    if (!simulator.tripPlan) {
      return;
    }

    // restart the random number sequence
    rand.initState();

    if (config.SIMULATE_TIME) {
      console.log(`Starting simulation for ${new Date(startTime)} at ${simulator.speed}x speed.`);
      if (speed) {
        simulator.speed = speed;
      }
      clock.setNow(startTime);
      clock.setClockRate(simulator.speed);
    } else {
      console.log('Starting simulation without changing the time.');
    }

    simulator.isRunning = true;
    simulator.lastUpdateTS = Date.now();

    navProgressWatch = navigator.subscribe(simulator.handleNavigationProgress);
    navRouteWatch = navigator.onRouteChanged(simulator.handleNavigationRouteChanged);
  },

  /**
   * End the simulation.
   */
  stop: () => {
    if (navProgressWatch) {
      navProgressWatch.cancel();
      navRouteWatch.cancel();
      navProgressWatch = null;
      navRouteWatch = null;
    }

    simulator.isRunning = false;

    simulator.stopMoving();

    clock.reset();

    simulator.speed = 3;
    simulator.tripPlan = null;

    console.log('Simulation stopped.');
  },

  /**
   * Submit new GPS point in the simulated sequence, and schedules
   * the next step recursively.
   * During navigation mode, it will move along the current route
   * (single trip plan leg), and outside of navi it will move along
   * the trip plan itself.
   */
  nextGpsStep: () => {
    const { route, tripProgress } = navigator;
    const plan = simulator.tripPlan;

    let simulateLeg = true;
    const leg = tripProgress?.leg;
    if (!config.SIMULATE_HAIL_LEG && leg) {
      simulateLeg = leg.mode !== 'HAIL';
    }

    if (simulateLeg) {
      if (route) {
        // console.log('simulating point along route.');
        simulator.nextStepAlongPath(route.geometry);
      } else if (plan) {
        // console.log('simulating point across trip plan.');
        simulator.nextStepAlongPath(simulator.tripPlanGeometry);
      } else {
        return; // don't continue simulating
      }
    }

    // Simulate going off-route
    // setTimeout(() => {
    //  simulator.handleUserOffRoute();
    // }, 20000);

    gpsTimer = clock.setTimeout(simulator.nextGpsStep, GPS_INTERVAL_MS);
  },

  nextStepAlongPath(geometry) {
    // wait for new route if simulating off route
    if (goingOffRoute) {
      return;
    }

    // const nbrCoords = geometry && geometry.coordinates.length;
    // console.log(`moving along ${geometry.type} with ${nbrCoords} points.`);

    const now = Date.now();
    const elapsedMs = now - simulator.lastUpdateTS;
    simulator.lastUpdateTS = now;

    // TODO: if we're not yet on the linestring, move toward it
    // If we just started moving, location is undefined/null and
    // we start near the first linestring point.
    // TODO: make this randomly near the start point, not exact.
    // let startPt = simulator.location;
    // if (!startPt) {
    //   [startPt] = geometry.coordinates;
    // }

    // TODO: Add the capability to only move the next distance increment if the
    // current sim position is close to the route, otherwise move toward
    // the nearest point on the route.

    const avgDist = simulator.metersPerSec * (elapsedMs / 1000);
    const distToMove = rand.floatBetween(avgDist * 0.8, avgDist * 1.2);
    const nextDist = simulator.distAlongPath + distToMove;
    simulator.distAlongPath = nextDist;
    // finding the point along the line, and then getting the nearest point
    // on the line, will always be the same, but we need to get the segment index.
    let endPt = along(geometry, nextDist / 1000).geometry;
    // console.log(`dist along path: ${nextDist} coords: ${endPt.coordinates}`);
    const endPtOnLine = nearestPointOnLine(geometry, endPt);
    // console.log(`end on line: ${JSON.stringify(endPtOnLine)}`);
    let segIndex = endPtOnLine.properties.index;
    if (segIndex === geometry.coordinates.length - 1) {
      segIndex = geometry.coordinates.length - 2;
    }
    const segBearing = bearing(
      geometry.coordinates[segIndex],
      geometry.coordinates[segIndex + 1],
    );

    // TODO: drift speed each step, but stay around target speed
    // simulator.metersPerSec = simulator.metersPerSec;

    simulator.heading = rand.floatBetween(segBearing - 2, segBearing + 2);
    // The heading has to be between 0 and 360 instead of -180, +180.
    if (simulator.heading < 0) { simulator.heading += 360; }
    simulator.location = endPt;

    // console.log(`simulated: ${JSON.stringify(simulator.location)} ${simulator.heading}`);

    // add error to the new point
    let errorMinDist = 0;
    let errorMaxDist = GPS_ERROR_METERS / 1000;
    if (OFFROUTE_INTERVAL_MS
      && (clock.now() - lastRerouteAt > OFFROUTE_INTERVAL_MS)) {
      errorMinDist = 0.4;
      errorMaxDist = 1;
      goingOffRoute = true;
      console.log('Simulating off-route condition...');
    }
    gpsDrift = GPS_DRIFT_METERS / 1000;
    gpsDriftDir = 45;
    if (gpsDrift > 0) {
      endPt = destination(
        endPt,
        gpsDrift,
        gpsDriftDir,
      ).geometry;
    }
    if (errorMaxDist > 0) {
      endPt = destination(
        endPt,
        rand.floatBetween(errorMinDist, errorMaxDist), // error distance

        // TODO: use a distribution in segBearing direction
        rand.floatBetween(-180, 180), // bearing of error
      ).geometry;
    }

    // console.log(`dist along path ${simulator.distAlongPath}`);
    // console.log(`heading ${simulator.heading}`);
    // console.log(`speed ${simulator.metersPerSec}`);
    // console.log(JSON.stringify(endPt));

    geolocation.setLocation({
      lat: endPt.coordinates[1],
      lng: endPt.coordinates[0],
    }, simulator.heading, simulator.metersPerSec);
  },

  startMoving: () => {
    if (!simulator.isRunning || !config.SIMULATE_LOCATION) { return; }
    console.log('GPS simulation started.');
    simulator.isMoving = true;
    simulator.distAlongPath = 0;
    simulator.metersPerSec = 2; // TODO: ramp up speed from 0
    goingOffRoute = false;
    simulator.nextGpsStep();
  },

  stopMoving: () => {
    if (gpsTimer) {
      clearInterval(gpsTimer);
      gpsTimer = null;
    }
    simulator.isMoving = false;
    simulator.distAlongPath = 0;
    goingOffRoute = false;
  },

  pause: () => {
    simulator.isMoving = false;
    simulator.metersPerSec = 0;
  },

  resume: () => {
    simulator.isMoving = true;
    simulator.metersPerSec = 2;
  },

  adjustSpeed: (value) => {
    simulator.metersPerSec = value;
  },

  /**
   * Set the trip plan to simulate.
   */
  setTripPlan: (plan) => {
    console.log(`changing simulator trip plan. valid: ${!!plan}`);
    simulator.tripPlan = plan;
    simulator.distAlongPath = 0;
    goingOffRoute = false;

    if (plan) {
      const fullPlanGeometry = plan.fullGeometry();
      simulator.tripPlanGeometry = fullPlanGeometry;

      console.log(`auto-starting simulation: ${config.AUTO_SIMULATE}`);
      if (config.AUTO_SIMULATE) {
        console.log(`plan start: ${plan.startTime}`);
        const clockStart = plan.startTime + simulator.startOffsetMins * 60 * 1000;
        simulator.start(clockStart);
      }

      // needs to come after .start() because of simulated time
      lastRerouteAt = clock.now();
    }
  },

  handleNavigationRouteChanged: (route) => {
    if (route && route.geometry && simulator.location) {
      const snapped = nearestPointOnLine(route.geometry, simulator.location);
      simulator.distAlongPath = snapped.properties.location * 1000; // km to m
      console.log(`snapping simulator: ${simulator.distAlongPath}`);
    } else {
      simulator.distAlongPath = 0;
    }

    goingOffRoute = false;
    lastRerouteAt = clock.now();
  },

  handleNavigationProgress: (/* tripProgress, oldProgress */) => {

  },

};

export default simulator;
