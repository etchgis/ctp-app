/* eslint-disable no-unused-vars */
import { v5 as uuidv5 } from 'uuid';
import TripRequest from './trip-request';
import formatters from '../utils/formatters';
import { otp } from '../services/transport';
import TripPlanInput from './trip-plan-input';

export default class TripPlan {

  /**
   * Initialize the TripPlan with JSON from a server.
   * @param {Object} plan
   */
  constructor(plan) {
    plan = TripPlanInput.standardize(plan);
    this.distance = plan.distance;
    this.duration = plan.duration;
    if (plan.waypoints) {
      this.waypoints = plan.waypoints;
    }
    if (plan.legs) {
      this.legs = plan.legs;
      this.startTime = plan.startTime;
      this.endTime = plan.endTime;
      console.log(`plan start: ${this.startTime} plan end: ${this.endTime}`);
    }
  }

  /**
   * Returns [ lngMin, latMin, lngMax, latMax ]
   * @param {TripPlan} plan
   */
  bounds() {
    const bounds = [
      180,
      90,
      -180,
      -90,
    ];
    this.legs.forEach((leg) => {
      const coords = leg.geometry.coordinates;
      coords.forEach((lngLat) => {
        const lng = lngLat[0];
        const lat = lngLat[1];
        if (lng < bounds[0]) { bounds[0] = lng; }
        if (lat < bounds[1]) { bounds[1] = lat; }
        if (lng > bounds[2]) { bounds[2] = lng; }
        if (lat > bounds[3]) { bounds[3] = lat; }
      });
    });
    return bounds;
  }

  /**
   * This take leg.from or leg.to and resolves it to a object that has
   * `coordinates`, `address`, and any other info.
   * @param {Object} fromOrTo
   */
  legEndpoint(fromOrTo) {
    // Every leg has a `.from` and `.to` property. Some legs are automatically created
    // for mode transitions, so this will have the bus stop or scooter ID.
    // For endpoints that are specifically provided by the user, `from.waypoint` and
    // `to.waypoint` are indices into the waypoint list for intentional stops.
    if (fromOrTo.waypoint || fromOrTo.waypoint === 0) {
      return this.waypoints[fromOrTo.waypoint];
    }
    return fromOrTo;
  }

  /**
   * Combines the geometry of all legs to create a LineString for the entire plan.
   * @returns {Geometry}
   */
  fullGeometry() {
    const geometry = {
      type: 'LineString',
      coordinates: [],
    };
    this.legs.forEach((leg) => {
      leg.geometry.coordinates.forEach((c) => {
        geometry.coordinates.push(c);
      });
    });
    return geometry;
  }

  /**
     * Perform trip planning.
     * @param {TripRequest} tripRequest
     * @param {Object} preferences
     * @param {int} queryId
     * @returns {object[]}
     */
  static generate(tripRequest, preferences, queryId) {
    return new Promise((resolve, reject) => {
      queryPlanner(tripRequest, preferences, queryId, resolve, reject);
    });
  }

}

/**
 *
 * @param {TripRequest} tripRequest
 * @param {Date} tripRequest.whenTime
 * @param {object} preferences
 * @param {string} preferences.language
 * @param {number} queryId
 * @param {any} resolve
 * @param {any} reject
 */
const queryPlanner = (tripRequest, preferences, queryId, resolve, reject) => {

  const whenTime = tripRequest.whenTime || new Date();
  // const walkLimit = preferences.maxWalk;
  let doExtraBikeQuery = false;

  const routeTypes = pickRouteTypes(tripRequest);

  const queries = routeTypes.map(routeType => {

    let params = {
      'fromPlace': `${tripRequest.origin.point.lat},${tripRequest.origin.point.lng}`,
      'toPlace': `${tripRequest.destination.point.lat},${tripRequest.destination.point.lng}`,
      'time': formatters.datetime.asHMA(whenTime),
      'date': formatters.datetime.asMDYYYY(whenTime),
      'arriveBy': tripRequest.whenAction === 'arrive' ? true : false,
      'showIntermediateStops': true,
      'wheelchair': preferences.wheelchair ? 'true' : 'false',
      'locale': preferences.language,
      'walkSpeed': 1.25,
      'maxHours': 5,
      'useRequestedDateTimeInMaxHours': true,
      'waitAtBeginningFactor': 0.6,
      'walkReluctance': preferences.minimizeWalking ? 2 : 10,
    };

    const modes = RouteTypes[routeType].join(',');
    params.mode = modes;

    // if (preferences.minimizeWalking) {
    //   params.maxWalkDistance = 804.672;
    // }

    // if (walkLimit) {
    //   if (modes.indexOf('BICYCLE') === -1) { // temporary
    //     params.maxWalkDistance = walkLimit;
    //   }
    // }
    if (modes.indexOf('BICYCLE') !== -1) { // temporary
      params.maxWalkDistance = 3218.69; // 2 mi
    }

    if (tripRequest.bannedProviders.length > 0) {
      const bannedProviders = tripRequest.bannedProviders.join(',').toLowerCase();
      params.bannedProviders = bannedProviders;
    }

    if (routeType === 'rentBike' || routeType === 'rentBikeToTransit') {
      if (!tripRequest.hasMode('bike_rental')) {
        params.bannedVehicles = 'bike';
      }
      else if (!tripRequest.hasMode('scooter')) {
        params.bannedVehicles = 'scooter';
      }
      else {
        doExtraBikeQuery = modes; // both are on
      }
    }
    else if (routeType === 'hail' || routeType === 'hailToTransit') {
      if (tripRequest.sortBy === 'fastest') {
        params.driveDistanceReluctance = 0;
        params.driveTimeReluctance = 0;
      }
      params.maxPreTransitTime = 120 * 60;
    }

    return otp.query(params);

  });

  if (doExtraBikeQuery) {
    let params = {
      'fromPlace': `${tripRequest.origin.point.lat},${tripRequest.origin.point.lng}`,
      'toPlace': `${tripRequest.destination.point.lat},${tripRequest.destination.point.lng}`,
      'time': formatters.datetime.asHMA(whenTime),
      'date': formatters.datetime.asMDYYYY(whenTime),
      'arriveBy': tripRequest.whenAction === 'arrive' ? true : false,
      'showIntermediateStops': true,
      'wheelchair': preferences.wheelchair ? 'true' : 'false',
      'locale': preferences.language,
      'mode': doExtraBikeQuery,
      'maxWalkDistance': 3218.69, // 2mi
      'walkSpeed': 1.25,  // meters/sec
      'maxHours': 5,
      'waitAtBeginningFactor': 0.6,
      'walkReluctance': preferences.minimizeWalking ? 15 : 75,
      'bannedVehicles': 'scooter',
    };

    if (tripRequest.bannedProviders.length > 0) {
      const bannedProviders = tripRequest.bannedProviders.join(',').toLowerCase();
      params.bannedProviders = bannedProviders;
    }

    queries.push(otp.query(params));
  }

  Promise.all(queries)
    .then(otpResults => {
      Promise.all(
        otpResults.map((p, i) => furtherDetails(p, routeTypes[i])))
        .then(responses => {
          resolve({
            plans: calculateShortest(
              removeDuplicates(
                responses
                  .reduce((results, otpPlan, j) => {
                    // it's possible to have a .error response, for instance
                    // if no path exists.
                    if (otpPlan.plan) {
                      otpPlan.plan.itineraries.forEach((plan, k) => {
                        plan = createPlan(plan, tripRequest);
                        plan.id = Date.now() + j + k; //uuidv5(`app.etch-${Date.now}`, uuidv5.DNS);
                        if (filterPlan(plan, preferences, tripRequest.modes)) {
                          results.push(plan);
                        }
                      });
                    }
                    return calculateShortest(results);
                  }, []))),
            id: queryId,
          });
        });

    })
    .catch(err => {
      console.error(err);
    });

};

const calculateShortest = (plans) => {
  const shortest = plans.reduce((acc, plan) => {
    acc?.duration && acc.duration < plan.duration
      ? acc
      : plan
  }, []);
  for (var i = 0; i < plans.length; i++) {
    if (shortest && plans[i].id === shortest.id) {
      plans[i].shortest = true;
    }
    else {
      plans[i].shortest = false;
    }
  }
  return plans;
};

const RouteTypes = {
  walk: ['WALK'],
  bike: ['BICYCLE'],
  rentBike: ['WALK', 'MICROMOBILITY_RENT'],
  drive: ['CAR'],                             // personal vehicle
  carParkAndRide: ['CAR_PARK', 'WALK', 'TRANSIT'],
  bikeParkAndRide: ['BICYCLE_PARK', 'WALK', 'TRANSIT'],
  hail: ['CAR_HAIL', 'WALK'],                   // dropoff / rideshare -- note that with WALK this drops the rider on the street corner!
  hailToTransit: ['CAR_HAIL', 'WALK', 'TRANSIT'],  // TNC
  walkToTransit: ['TRANSIT', 'WALK'],
  bikeToTransit: ['TRANSIT', 'BICYCLE'],
  rentBikeToTransit: ['TRANSIT', 'WALK', 'MICROMOBILITY_RENT'],
};

/**
 *
 * @param {TripRequest} tripRequest
 * @returns {string[]}
 */
const pickRouteTypes = (trip) => {

  const modeSets = [];

  if (trip.hasMode('bus') || trip.hasMode('tram')) {
    if (trip.hasMode('car')) {
      modeSets.push('carParkAndRide');
      modeSets.push('drive'); // temp? pass sort mode to server + make server smarter
    }
    if (trip.hasMode('hail')) {
      modeSets.push('hailToTransit');
      modeSets.push('hail'); // temp?
    }

    if (trip.hasMode('bike') || trip.hasMode('bicycle')) { modeSets.push('bikeToTransit'); }

    if (trip.hasMode('scooter') || trip.hasMode('bike_rental')) {
      modeSets.push('rentBikeToTransit');
    }
    // TODO: use the below "else if" once we make OTP smarter.
    // scooter/bike rental/tnc can already do a straight walk option.
    // only add straight walk if none of those options are selected
    //else if (!trip.hasMode('hail'))
    modeSets.push('walkToTransit');
  }
  else {
    if (trip.hasMode('car')) {
      modeSets.push('drive');
    }
    if (trip.hasMode('hail')) {
      modeSets.push('hail');
    }
    if (trip.hasMode('bike') || trip.hasMode('bicycle')) { modeSets.push('bike'); }
    if (trip.hasMode('scooter') || trip.hasMode('bike_rental')) { modeSets.push('rentBike'); }
    else if (!trip.hasMode('hail')) { modeSets.push('walk'); }
  }
  return modeSets;
};

/**
 *
 * @param {obj} otpPlan
 * @param {string} routeType
 * @returns {Promise}
 */
const furtherDetails = (otpPlan, routeType) => {
  // it's possible to have a .error response with no .plan, for instance
  // if no reachable path exists.
  let promise;
  if (otpPlan.plan) {
    const promises = [];
    otpPlan.plan.itineraries.forEach(plan => {
      plan.routeType = routeType;
      plan.legs.forEach(leg => {
        if (leg.routeColor) { leg.routeColor = '#' + leg.routeColor; }
        if (leg.routeTextColor) { leg.routeTextColor = '#' + leg.routeTextColor; }
        if (leg.vehicleType === 'bike') { leg.mode = 'BICYCLE'; }
        if (leg.vehicleType === 'scooter') { leg.mode = 'SCOOTER'; }
        //if (leg.hailedCar) {
        if (leg.mode === 'CAR' && (routeType === 'hailToTransit' || routeType === 'hail')) {
          promises.push(convertToHail(leg));
        }
      });
    });
    if (promises.length) {
      promise = Promise.all(promises).then(() => {
        return otpPlan;
      });
    }
  }
  if (!promise) {
    promise = Promise.resolve(otpPlan);
  }
  return promise;
};

/**
 *
 * @param {object} leg
 * @returns {Promise}
 */
const convertToHail = (leg) => {
  leg.mode = 'HAIL';
  leg.tripId = 'HDS:A1';
  // leg.providerId = 'yc';
  // const miles = leg.distance * 0.000621371;
  // let minutes = leg.duration / 60;
  // if (minutes > 15) { minutes -= 15; } // TEMP: Stop including wait time in leg's duration
  // leg.price = 300 + (miles * 241 + minutes * 16) || 0;
  return Promise.resolve(leg);
};

/**
 *
 * @param {object} planList
 * @returns {object}
 */
const removeDuplicates = (planList) => {
  // TEMP: this function is only needed because we have to run a lot of
  // parallel OTP queries. You can end up with the same trip when using
  // hail+transit, walk+transit, and micromobility rental + transit, for example.
  for (var i = 0; i < planList.length; i++) {
    var planI = planList[i];
    for (var j = planList.length - 1; j > i; j--) {
      var planJ = planList[j];
      if (plansEqual(planI, planJ)) {
        planList.splice(j, 1);
      }
      else if (plansSimilar(planI, planJ)) {
        // hailToTransit/bikeToTransit/rentToTransit and walkToTransit can be duplicates of each other, but
        // will be slightly different at the first or last walk leg because of
        // https://github.com/opentripplanner/OpenTripPlanner/issues/2808.
        // For example the hailToTransit version will end at the nearest car-traversible edge. Let's delete the non-walk one.
        if (planI.routeType !== 'walkToTransit') {
          planList.splice(i, 1);
          --i;
          break;
        }
        else if (planJ.routeType !== 'walkToTransit') {
          planList.splice(j, 1);
        }
      }
    }
  }
  return planList;
};

/**
 *
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
const plansEqual = (a, b) => {
  if (a.startTime !== b.startTime || a.endTime !== b.endTime || a.legs.length !== b.legs.length) { return false; }
  for (var i = a.legs.length; i--;) {
    if (a.legs[i].mode !== b.legs[i].mode || a.legs[i].providerId !== b.legs[i].providerId) { return false; }
  }
  return true;
};

const plansSimilar = (a, b) => {
  if (a.legs.length !== b.legs.length) { return false; }
  for (var i = a.legs.length; i--;) {
    const al = a.legs[i],
      bl = b.legs[i];
    if (al.mode !== bl.mode || al.providerId !== bl.providerId) { return false; }
    if (al.mode !== 'WALK' && (Math.abs(al.startTime - bl.startTime) > 15000 || Math.abs(al.endTime - bl.endTime) > 15000)) { return false; }
  }
  return true;
};

/**
 *
 * @param {object} itinerary
 * @param {TripRequest} request
 * @returns
 */
const createPlan = (itinerary, request) => {
  const plan = itinerary; // we just modify OTP plan

  // calcCost(plan);
  scorePlan(plan, request);

  return plan;
};

/**
 *
 * @param {TripPlan} plan
 */
const calcCost = (plan) => {
  let firstFare = plan.fare ? (plan.fare.details.regular ? plan.fare.details.regular[0].price.cents : 0) : 0;
  let cents = plan.price = firstFare;
  let displayCents = cents;
  let busAdded = false;
  let didUseCogo = false;
  //let onScooterBikeLeg = null;
  plan.legs.forEach(leg => {
    //if (onScooterBikeLeg && leg.mode !== onScooterBikeLeg.mode && leg.mode !== 'WALK') {
    //  onScooterBikeLeg = null;
    //}
    if (leg.mode === 'CAR') {
      leg.price = leg.distance * 3.28084 * 60 / 5280;
      cents += leg.price;
    }
    else if (leg.mode === 'HAIL') {
      cents += leg.price;
      displayCents += leg.price;
    }
    else if (leg.mode === 'SCOOTER') {
      leg.price = leg.duration * 15 / 60; // 15 cents per minute
      //if (!onScooterBikeLeg) {
      leg.price += 100; // scooter start fee
      //  onScooterBikeLeg = leg;
      //}
      cents += leg.price;
      displayCents += leg.price;
    }
    else if (leg.mode === 'BICYCLE') {
      leg.price = 0;
      if (leg.providerId === 'cogo') {
        if (!didUseCogo) {
          leg.price = 800;// COGO start fee
          didUseCogo = true;
        }
        if (leg.duration > 1800) { // Cadd $3 every 30 minutes after the first
          const blocks = Math.ceil((leg.duration - 1800) / 1800);
          leg.price += blocks * 300;
        }
      }
      cents += leg.price;
      displayCents += leg.price;
    }
    else if (leg.mode === 'WALK') {
      leg.price = 0;
    }
    else if (leg.mode === 'BUS') {
      if (!busAdded) {
        leg.price = firstFare;
        busAdded = true;
      }
      else if (busAdded && plan.fare) {
        var found = plan.fare.details.regular.find((f, i) => {
          return f.routes.indexOf(leg.routeId) > -1;
        });
        if (found && found.price.cents > firstFare) {
          leg.price = found.price.cents - firstFare;
          cents += found.price.cents - firstFare;
          displayCents += found.price.cents - firstFare;
        }
      }
    }
  });
  plan.price = (cents || 0) / 100;
  plan.displayPrice = (displayCents || 0) / 100;
};

/**
 *
 * Scores plan based on user preferences.
 * @param {TripPlan} plan
 * @param {TripRequest} request
 */
const scorePlan = (plan, request) => {

  // factor wait time before or after trip into the total trip time.
  let delay = 0;
  var requestTime;
  if (isNaN(request.whenTime)) { requestTime = (request.whenTime || new Date()).getTime(); }
  else { requestTime = request.whenTime; }
  const arriveBy = request.whenAction === 'arrive';
  if (arriveBy) {
    delay = requestTime - plan.endTime;
  }
  else {
    delay = plan.startTime - requestTime;
  }
  // penalize delay at some relative cost to trip time
  plan.delay = Math.round(delay / 1000);
  plan.timeScore = plan.duration + plan.delay / 3;

  // penalize $1 for every 10 mins
  plan.score = plan.price + plan.timeScore / 60 / 10;

  plan.ecoHarm = 0;
  plan.legs.forEach(leg => {
    if (leg.mode === 'CAR' || leg.mode === 'HAIL') {
      // 10 points per minute
      // todo: give hail penalty for the predicted wait preceding this too.
      plan.ecoHarm += leg.duration * 10 / 60;
    }
    else if (leg.mode === 'BUS') {
      // 1 point per minute
      plan.ecoHarm += leg.duration * 1 / 60;
    }
  });
};

/**
 *
 * @param {TripPlan} plan
 * @param {object} preferences
 * @returns
 */
const filterPlan = (plan, preferences, modes) => {
  for (var i = plan.legs.length; i--;) {
    if (plan.legs[i].providerDown) { return false; }
    if (modes.indexOf(plan.legs[i].mode.toLowerCase()) === -1) { return false; }
  }
  if (plan.displayPrice > preferences.maxCost) {
    return false;
  }
  if (plan.legs.length === 1 && plan.legs[0].mode.toLowerCase() === 'bicycle') {
    return true;
  }
  if (
    preferences.minimizeWalking
    && plan.walkDistance > 804.672
    // && plan.legs.some(l => l.mode.toLowerCase() === 'bicycle')
    // && plan.legs.length === 1
    // && plan.legs[0].mode.toLowerCase() !== 'bicycle'
  ) {
    return false;
  }
  return true;

  //TODO ad condtion for specific mode preferences (ex. TRAM and BUS are both under TRANSIT)
};