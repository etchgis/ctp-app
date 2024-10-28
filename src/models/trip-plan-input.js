import lineSlice from '@turf/line-slice';
import turfLength from '@turf/length';
import { lineString } from '@turf/helpers';

import { toGeoJSON } from '../utils/polyline';

/*
This code turns an OSRM or OTP route into a standard OSRM-like route. The objects are not
completely identical to OSRM but are enhanced with additional properties.

The OSRM Route has fields:

{
  distance: 0.0,
  duration: 0.0,
  geometry: GeoJSON object, // server can send other formats like 'polyline6 text...',
  legs: RouteLeg array [{
    distance: 0.0,
    summary: '...',
    duration: 0.0,
    steps: RouteStep array [{
      intersections: [],
      maneuver: StepManeuver {
        "bearing_before": 0.0,
        "bearing_after": 0.0,
        "location": [],
        "type": "...",
        "modifier": "..."
      },
      name: '...',
      mode: '...',
      bannerInstructions: [],
      voiceInstructions: [],
    }]
  }],
  // Mapbox API adds these:
  routeOptions: {
    baseUrl: 'https://api.mapbox.com',
    user: 'mapbox',
    profile: 'driving',
    coordinates: [],
    geometries: 'geojson', // or 'polyline6' someday
    overview: 'full',
    voice_instructions: true,
    banner_instructions: true,
    access_token: config.MAPBOX_TOKEN,
    uuid: 'mmtpa',
  },
  voiceLocale: 'en',
}

This is similar to OTP's plan response:

{
  "duration": 849,
  "startTime": 1687195200000,
  "endTime": 1687196049000,
  "walkTime": 849,
  "transitTime": 0,
  "waitingTime": 0,
  "walkDistance": 9585.53,
  "walkLimitExceeded": false,
  "generalizedCost": 1303,
  "elevationLost": 0,
  "elevationGained": 0,
  "transfers": 0,
  "fare": {
    "fare": {},
    "details": {}
  },
  "legs": [
    {
      "startTime": 1687195200000,
      "endTime": 1687196049000,
      "departureDelay": 0,
      "arrivalDelay": 0,
      "realTime": false,
      "distance": 9585.53,
      "generalizedCost": 1303,
      "pathway": false,
      "mode": "CAR",
      "transitLeg": false,
      "route": "",
      "agencyTimeZoneOffset": -14400000,
      "interlineWithPreviousLeg": false,
      "from": {
        "name": "Origin",
        "lon": -78.813325,
        "lat": 42.942817,
        "departure": 1687195200000,
        "vertexType": "NORMAL"
      },
      "to": {
        "name": "Destination",
        "lon": -78.867588,
        "lat": 42.901411,
        "arrival": 1687196049000,
        "vertexType": "NORMAL"
      },
      "legGeometry": {
        "points": "ufbeGhf``N?qNvC@zC?tCC`A?bAs@jAy@p@xBtBuARCz@?xC?xCArC?rC?bC?pBDlA@BnAJnBTrB^zAZz@f@rAXp@h@tBf@jBPp@v@rClCvKn@vB^~AxAdGZbBN~AT~BJlADlABrBAtKA|OCzE@rDPtE^|Ep@lFh@nCbA~D|@rCrAnDbCrFfArBv@pAb@p@lEtG`ArAxBfD|BdD`@f@TLd@`@RPVPPJRLTLRJTHFDd@LJDVDTDXDZBh@BN?|A?xA?ZF`A?nHEhFB~JEz]GbH?fABj@Hx@LvDt@xAf@vAf@xBjAd@T^NtI`E`CfAzBfAzAv@dAp@`Ap@`Ax@~A|ArChDz@zAlAfCdBdEP`@hDjJ`DjJ|F`SJ\\z@xCPn@|FdRNl@Jn@Fn@@t@At@Gx@Mz@GHCXSpBCVCZg@pFGn@_@zDEZuD{@mCo@WJMVcAvB@bA?X}Bi@kCm@iAWKCQEcCk@gBa@yA]SEIAm@OmBc@MC?T?nB",
        "length": 154
      },
      "steps": [
        {
          "distance": 202.36,
          "relativeDirection": "DEPART",
          "streetName": "Hewitt Avenue",
          "absoluteDirection": "EAST",
          "stayOn": false,
          "area": false,
          "bogusName": false,
          "lon": -78.813325,
          "lat": 42.942677,
          "elevation": "",
          "walkingBike": false
        },
        ...
      ],
      "rentedBike": false,
      "walkingBike": false,
      "duration": 849,
      "y1": 5,
      "y2": 65
    }
  ],
  "tooSloped": false,
  "arrivedAtDestinationWithRentedBicycle": false,
  "delay": -9,
  "timeScore": 846,
  "score": null,
  "ecoHarm": 141.5,
  "id": 1687195233490
}

Example OSRM directions response, which has an array of routes:
(see http://project-osrm.org/docs/v5.23.0/api/# for detailed documentation)

{
  "code": "Ok",
  "waypoints": [
    { // start point
      // internal, ephemeral identifier of segment for faster follow-up requests
      "hint": "YyQJjB4lCYwYA.....",
      "distance": 36.761299, // distance of snapped point from the original
      "location": [
        -83.070804,
        40.046558
      ],
      "name": ""
    },
    { // end point, no intermediate waypoints
      "hint": "DywBjBYsAYwTA.....",
      "distance": 0.691887,
      "location": [
        -83.00721,
        40.01289
      ],
      "name": "Guitner Alley"
    }
  ],
  "routes": [
    {
      "legs": [
        {
          "steps": [
            {
              "intersections": [
                { // start of step
                  "out": 0, // index of bearing of departure from intersection
                  "entry": [
                    true
                  ],
                  "location": [
                    -83.070804,
                    40.046558
                  ],
                  "bearings": [
                    349
                  ]
                },
                { // end of step
                  "out": 0,
                  "in": 2, // index of bearing of arrival to intersection
                  "entry": [
                    true,
                    true,
                    false, // this bearing (180) cannot be entered
                    true
                  ],
                  "location": [
                    -83.070878,
                    40.046998
                  ],
                  "bearings": [
                    0,
                    90,
                    180, // arrival bearing, coming from the south
                    270
                  ]
                }
              ],
              "driving_side": "right",
              "geometry": "_rlsFnw_zNWFi@HUAKA",
              "duration": 17.8,
              "distance": 56.8,
              "name": "",
              "weight": 17.8,
              "mode": "cycling",
              "maneuver": { // turning right onto the first (depart) road segment
                "bearing_after": 349,
                "location": [ // same as first intersection
                  -83.070804,
                  40.046558
                ],
                "type": "depart",
                "bearing_before": 0,
                "modifier": "right"
              }
            },
            ...
          ],
          "weight": 2142.8,
          "distance": 8312.7,
          "summary": "Kenny Road, Ackerman Road",
          "duration": 2142.8
        }
      ],
      "weight_name": "duration",
      "weight": 2142.8,
      "distance": 8312.7,
      "duration": 2142.8
    },
    { // second, alternative route option
      "legs": [
        ...
      ],
      "weight_name": "duration",
      "weight": 2154,
      "distance": 8756.7,
      "duration": 2154
    }
  ]
}
*/

function titleCase(str) {
  if (!str) {
    return '';
  }
  const words = str.toLowerCase().split(' ');
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
  }
  return words.join(' ');
}

function voiceStreetName(streetName) {
  if (streetName) {
    let name = streetName;
    name = name.replace(/\bN\b/gi, 'NORTH');
    name = name.replace(/\bS\b/gi, 'SOUTH');
    name = name.replace(/\bE\b/gi, 'EAST');
    name = name.replace(/\bW\b/gi, 'WEST');
    name = name.replace(/\bNW\b/gi, 'NORTHWEST');
    name = name.replace(/\bSW\b/gi, 'SOUTHWEST');
    name = name.replace(/\bNE\b/gi, 'NORTHEAST');
    name = name.replace(/\bSE\b/gi, 'SOUTHEAST');

    name = name.replace(/\bAVE\b/gi, 'AVENUE');
    name = name.replace(/\bBND\b/gi, 'BEND');
    name = name.replace(/\bBLVD\b/gi, 'BOULEVARD');
    name = name.replace(/\bCT\b/gi, 'COURT');
    name = name.replace(/\bDR\b/gi, 'DRIVE');
    name = name.replace(/\bLN\b/gi, 'LANE');
    name = name.replace(/\bPL\b/gi, 'PLACE');
    name = name.replace(/\bRD\b/gi, 'ROAD');
    name = name.replace(/\bST\b/gi, 'STREET');
    name = name.replace(/\bPKWY\b/gi, 'PARKWAY');

    name = name.replace(/&/g, 'AND');
    return name;
  }
  return '';
}

// See http://project-osrm.org/docs/v5.5.1/api/#stepmaneuver-object
// and ManeuverType / ManeuverDirection in RouteStep.swift. Navi will crash if
// there's no matching enum value!
const OtpDirectionToOsrmManuever = {
  DEPART: { type: 'depart', modifier: 'straight' },
  CONTINUE: { type: 'continue', modifier: 'straight' },
  HARD_LEFT: { type: 'turn', modifier: 'sharp left' },
  LEFT: { type: 'turn', modifier: 'left' },
  SLIGHTLY_LEFT: { type: 'turn', modifier: 'slight left' },
  SLIGHTLY_RIGHT: { type: 'turn', modifier: 'slight right' },
  RIGHT: { type: 'turn', modifier: 'right' },
  HARD_RIGHT: { type: 'turn', modifier: 'sharp right' },
  CIRCLE_CLOCKWISE: { type: 'turn', modifier: 'right' }, // TODO: use the roundabout values
  CIRCLE_COUNTERCLOCKWISE: { type: 'turn', modifier: 'left' },
  ELEVATOR: { type: 'continue', modifier: 'straight' },
  UTURN_LEFT: { type: 'turn', modifier: 'uturn' },
  UTURN_RIGHT: { turn: 'turn', modifier: 'uturn' },
};

function generateRouteLegSteps(planLeg, profile, nextLeg) {
  const steps = [];
  let planSteps = [...planLeg.steps];
  const plGeoJson = toGeoJSON(planLeg.legGeometry.points, 5);
  const plDistance = planLeg.distance;
  const plDuration = (planLeg.endTime - planLeg.startTime) / 1000;
  const plFrom = planLeg.from;
  const plTo = planLeg.to;
  const plMode = planLeg.mode.toLowerCase();

  // Often the leg geometry begins before the first step location,
  // which could be a turn instruction.
  // We have the first "depart" step go from the leg start to the first step
  // location.
  // In case the leg starts with a jump to the first step (from inside building
  // to sidewalk for example), the path may have no coords before the step and
  // the depart step would have a length of 0. We include the first point in
  // the leg polyline to show an explicit straight line path.
  plGeoJson.coordinates.unshift([plFrom.lon, plFrom.lat]);
  const fromGeoJsonGeom = lineSlice([plFrom.lon, plFrom.lat],
    [planLeg.steps[0].lon, planLeg.steps[0].lat], plGeoJson).geometry;
  const fromDistance = turfLength(fromGeoJsonGeom) * 1000;
  const addFirstStep = fromDistance >= 5;
  if (addFirstStep) {
    const fromDuration = (plDuration * fromDistance) / plDistance;
    const firstStep = {
      lat: plFrom.lat,
      lon: plFrom.lon,
      distance: fromDistance,
      duration: fromDuration,
      relativeDirection: 'DEPART',
      name: planLeg.steps[0].name,
      streetName: planLeg.steps[0].streetName,
    };
    planSteps.unshift(firstStep);
  }

  // Add the zero-length final step
  const lastStep = {
    lat: plTo.lat,
    lon: plTo.lon,
    distance: 0,
    duration: 0,
    name: (nextLeg && nextLeg.mode.toLowerCase() !== 'indoor')
      ? nextLeg.mode.toLowerCase()
      : 'Your Destination'
  };
  planSteps.push(lastStep);

  // Now convert all the steps
  for (let i = 0; i < planSteps.length; i++) {
    const plStep = planSteps[i];
    const isLastStep = i === planSteps.length - 1;
    let nextStep = isLastStep ? plTo : planSteps[i + 1];
    const geoJsonGeom = lineSlice([plStep.lon, plStep.lat],
      [nextStep.lon, nextStep.lat], plGeoJson).geometry;
    let destination = voiceStreetName(nextStep.streetName ?? nextStep.name);
    destination = String(destination).trim();
    let maneuverText = null;
    let directions = null;
    let modifier = 'straight';
    let type = 'continue';
    if (nextStep.relativeDirection) {
      const otpToOsrm = OtpDirectionToOsrmManuever[nextStep.relativeDirection];
      type = otpToOsrm?.type;
      modifier = otpToOsrm.modifier;
      maneuverText = nextStep.relativeDirection.replace('_', ' ');
      if (type === 'turn') {
        maneuverText = `Turn ${maneuverText}`;
      }
      directions = `${maneuverText} `;
    } else {
      directions = 'Proceed to ';
    }

    if (nextStep.featureType === 'crossing') {
      directions = 'Cross ';
      // remove "crossing" from the street name
      destination = destination.replace(/ crossing$/i, '');
    }

    if (nextStep.vertexType === 'VEHICLERENTAL') {
      let vehicleName;
      if (planLeg.rentedVehicle) {
        vehicleName = `${planLeg.providerId[0].toUpperCase() + planLeg.providerId.slice(1)} ${planLeg.vehicleType}`;
        directions += `and return the ${vehicleName}`;
      } else {
        vehicleName = `${nextLeg.providerId[0].toUpperCase() + nextLeg.providerId.slice(1)} ${nextLeg.vehicleType}`;
        directions += `and unlock the ${vehicleName}`;
      }
    } else {
      if (maneuverText) {
        directions += 'on ';
      }
      directions += destination;
    }

    if (isLastStep) {
      modifier = 'right';
      type = 'arrive';
    }

    directions = plMode === 'indoor' ? plStep.directions : titleCase(directions);

    const voiceDistanceMeters = Math.min(Math.round(30 * 0.3048), plStep.distance);
    const voiceDistanceFeet = Math.round(voiceDistanceMeters * 3.28084);
    const voiceDirections = plMode === 'indoor' ? directions : `${directions} in ${voiceDistanceFeet} feet.`;

    const step = {
      distance: plStep.distance,
      duration: (plDuration * plStep.distance) / plDistance,
      direction: plStep.absoluteDirection || plStep.direction,
      geometry: geoJsonGeom,
      name: destination,
      mode: profile === 'bus' ? 'driving' : profile,
      driving_side: 'right',
      maneuver: {
        location: [plStep.lon, plStep.lat],
        bearing_before: 0,
        bearing_after: 0,
        instruction: directions,
        modifier,
        type,
      },
      bannerInstructions: [{
        distanceAlongGeometry: Math.max(10, plStep.distance - 5),
        primary: {
          text: directions,
          components: [{
            text: directions,
            type: 'text',
          }],
          modifier,
          type,
        },
      }],
      voiceInstructions: [{
        distanceAlongGeometry: voiceDistanceMeters,
        announcement: voiceDirections,
        ssmlAnnouncement: `<speak><amazon:effect name="drc"><prosody rate="1.08">${voiceDirections}</prosody></amazon:effect></speak>`,
      }],
      weight: 1,
      intersections: [{
        location: [plStep.lon, plStep.lat],
        bearings: [0],
        entry: [true],
        out: 0,
      }],
      featureType: nextStep.featureType,
      featureId: nextStep.featureId,
    };
    if (i === 0) {
      // show departure text within first step
      destination = voiceStreetName(plStep.streetName ?? plStep.name ?? plStep.directions);
      destination = String(destination).trim();
      if (plStep.absoluteDirection != null) {
        directions = `Head ${plStep.absoluteDirection} along ${destination}`;
      } else {
        directions = plMode === 'indoor' ? directions : `Head toward ${destination}`;
      }
      directions = titleCase(directions);
      const voiceBeginDistanceFeet = Math.round(plStep.distance * 3.28084);
      let voiceBeginDirections = `${directions} for ${voiceBeginDistanceFeet} feet.`;
      step.bannerInstructions.unshift({
        distanceAlongGeometry: plStep.distance,
        primary: {
          text: directions,
          components: [{
            text: directions,
            type: 'text',
          }],
          modifier: 'straight',
          type: 'depart',
        },
      });
      step.voiceInstructions.unshift({
        distanceAlongGeometry: plStep.distance,
        announcement: voiceBeginDirections,
        ssmlAnnouncement: `<speak><amazon:effect name="drc"><prosody rate="1.08">${voiceBeginDirections}</prosody></amazon:effect></speak>`,
      });
    } else if (plStep.distance > 50) {
      // Add a second voice instruction for long steps
      const voice2DistanceMeters = plStep.distance;
      const voice2DistanceFeet = Math.round(voice2DistanceMeters * 3.28084);
      const currPath = voiceStreetName(plStep.streetName ?? plStep.name);
      const voice2Directions = `Continue on ${currPath} for ${voice2DistanceFeet} feet.`;
      step.voiceInstructions.unshift({
        distanceAlongGeometry: voice2DistanceMeters,
        announcement: voice2Directions,
        ssmlAnnouncement: `<speak><amazon:effect name="drc"><prosody rate="1.08">${voice2Directions}</prosody></amazon:effect></speak>`,
      });
    }
    steps.push(step);
  }
  return steps;
}

function intermediateStopsToLegSteps(planLeg, profile) {
  // TODO: cleanup this code line the function above.
  const steps = [];
  const plGeoJson = toGeoJSON(planLeg.legGeometry.points, 5);
  // plDistance = planLeg.distance,
  // plDuration = (planLeg.endTime - planLeg.startTime) / 1000,
  const plFrom = planLeg.from;
  const plTo = planLeg.to;
  const plNextStep = planLeg.intermediateStops[0];
  const fromGeoJsonGeom = lineSlice([plFrom.lon, plFrom.lat],
    [planLeg.intermediateStops[0].lon, planLeg.intermediateStops[0].lat], plGeoJson).geometry;
  const fromDistance = turfLength(fromGeoJsonGeom) * 1000;
  const fromDuration = (planLeg.intermediateStops[0].arrival - plFrom.departure) / 1000;// ,
  // plGeoJsonLastPt = { type: 'LineString', coordinates: [[plTo.lon, plTo.lat]] },
  // plLastDist = 0,
  // plLastDuration = 0;
  steps.push({
    distance: fromDistance,
    duration: fromDuration,
    geometry: fromGeoJsonGeom, // fromGeoJSON(fromGeoJsonGeom, 6),
    name: plFrom.name,
    mode: profile === 'bus' ? 'driving' : profile,
    driving_side: 'right',
    maneuver: {
      location: [plFrom.lon, plFrom.lat],
      bearing_before: 0,
      bearing_after: 0,
      instruction: titleCase(voiceStreetName(plNextStep.streetName || plNextStep.name)),
      modifier: 'straight',
      type: 'depart',
    },
    bannerInstructions: [{
      distanceAlongGeometry: fromDistance,
      primary: {
        text: titleCase(voiceStreetName(plNextStep.streetName || plNextStep.name)),
        components: [{
          text: titleCase(voiceStreetName(plNextStep.streetName || plNextStep.name)),
          type: 'text',
        }],
        modifier: 'straight',
        type: 'depart',
      },
    }],
    // Don't speak the (possibly dozens of) next stops, only the final?
    // voiceInstructions: [{
    //   distanceAlongGeometry: fromDistance / 2,
    //   announcement: "Next stop " + voiceStreetName(plNextStep.streetName || plNextStep.name),
    //   ssmlAnnouncement: `<speak><amazon:effect name=\"drc\"><prosody rate=\"1.08\">`
    //     + `Next stop ${voiceStreetName(plNextStep.streetName || plNextStep.name)}`
    //     + `</prosody></amazon:effect></speak>`
    // }],
    weight: 1,
    intersections: [{
      location: [plFrom.lon, plFrom.lat],
      bearings: [0],
      entry: [true],
      out: 0,
    }],
  });
  for (let i = 0; i < planLeg.intermediateStops.length; i++) {
    const plStep = planLeg.intermediateStops[i];
    let nextStep;
    if (i === 0) {
      nextStep = planLeg.intermediateStops.length > 1 ? planLeg.intermediateStops[i + 1] : plTo;
    } else if (i === planLeg.intermediateStops.length - 1) {
      nextStep = plTo;
    } else {
      nextStep = planLeg.intermediateStops[i + 1];
    }
    const geoJsonGeom = lineSlice([plStep.lon, plStep.lat],
      [nextStep.lon, nextStep.lat], plGeoJson).geometry;
    const plStepDuration = (nextStep.arrival - plStep.departure) / 1000;
    const plStepDistance = turfLength(geoJsonGeom) * 1000;
    let instructions = titleCase(`Next stop ${voiceStreetName(nextStep.streetName || nextStep.name)}`);
    if (i === planLeg.intermediateStops.length - 1) {
      instructions = `Your stop is coming up next. Please depart the bus at ${titleCase(voiceStreetName(nextStep.streetName || nextStep.name))}.`;
    }
    // instructions = voiceStreetName(nextStep.streetName || nextStep.name)
    //  + " is your stop. Please depart the bus at this stop."
    const step = {
      distance: plStepDistance,
      duration: plStepDuration,
      geometry: geoJsonGeom, // fromGeoJSON(geoJsonGeom, 6),
      name: plStep.name,
      mode: profile === 'bus' ? 'driving' : profile,
      driving_side: 'right',
      maneuver: {
        location: [plStep.lon, plStep.lat],
        bearing_before: 0,
        bearing_after: 0,
        instruction: titleCase(voiceStreetName(nextStep.streetName || nextStep.name)),
        modifier: i === 0 ? 'straight' : 'right',
        type: i === 0 ? 'depart' : 'continue',
      },
      bannerInstructions: [{
        distanceAlongGeometry: plStepDistance,
        primary: {
          text: instructions,
          components: [{
            text: instructions,
            type: 'text',
          }],
          modifier: i === 0 ? 'straight' : 'right',
          type: i === 0 ? 'depart' : 'continue',
        },
      }],
      // Don't speak the (possibly dozens of) next stops, only the final?
      // voiceInstructions: [{
      //  distanceAlongGeometry: plStepDistance / 2,
      //  announcement: instructions,
      //  ssmlAnnouncement: `<speak><amazon:effect name=\"drc\"><prosody rate=\"1.08\">` +
      //    `${instructions}</prosody></amazon:effect></speak>`
      // }],
      weight: 1,
      intersections: [{
        location: [plStep.lon, plStep.lat],
        bearings: [0],
        entry: [true],
        out: 0,
      }],
    };
    if (i === planLeg.intermediateStops.length - 1) {
      step.voiceInstructions = [{
        distanceAlongGeometry: plStepDistance,
        announcement: instructions,
        ssmlAnnouncement: `<speak><amazon:effect name="drc"><prosody rate="1.08">${instructions}</prosody></amazon:effect></speak>`,
      }];
    }
    steps.push(step);
  }

  // Add zero-length final step
  // const lastIntermediate = planLeg.intermediateStops[planLeg.intermediateStops.length - 1];
  // var toGeoJsonGeom = lineSlice([lastIntermediate.lon, lastIntermediate.lat],
  //   [plTo.lon, plTo.lat], plGeoJson),
  const toGeoJsonGeom = lineString([[plTo.lon, plTo.lat], [plTo.lon, plTo.lat]]).geometry;
  const toDistance = 0; // turfLength(toGeoJsonGeom, { units: 'kilometers' }) * 1000,
  const toDuration = 0;
  // const toDuration = (planLeg.endTime - lastIntermediate.departure) / 1000;
  // const toDuration = (plDuration * toDistance) / plDistance;
  const stopNumber = plTo.stopCode ? (`${plTo.stopCode} `) : '';
  steps.push({
    distance: toDistance,
    duration: toDuration,
    geometry: toGeoJsonGeom, // fromGeoJSON(toGeoJsonGeom, 6),
    name: voiceStreetName(plTo.name),
    mode: profile === 'bus' ? 'driving' : profile,
    driving_side: 'right',
    maneuver: {
      location: [plTo.lon, plTo.lat],
      bearing_before: 0,
      bearing_after: 0,
      instruction: titleCase(voiceStreetName(plTo.name)),
      modifier: 'right',
      type: 'arrive',
    },
    bannerInstructions: [{
      distanceAlongGeometry: toDistance,
      primary: {
        text: `${titleCase(voiceStreetName(plTo.name))} is your stop`,
        components: [{
          text: `${titleCase(voiceStreetName(plTo.name))} is your stop`,
          type: 'text',
        }],
        modifier: 'right',
        type: 'arrive',
      },
    }],
    voiceInstructions: [{
      distanceAlongGeometry: toDistance,
      announcement: `Your stop is coming up next. Please depart the bus at ${stopNumber + voiceStreetName(plTo.name)}.`,
      ssmlAnnouncement: `<speak><amazon:effect name="drc"><prosody rate="1.08">Your stop is coming up next. Please depart the bus at ${voiceStreetName(plTo.name)}.</prosody></amazon:effect></speak>`,
    }],
    weight: 1,
    intersections: [{
      location: [plTo.lon, plTo.lat],
      bearings: [0],
      entry: [true],
      out: 0,
    }],
  });
  return steps;
}

function planLegToLegSteps(planLeg, profile) {
  const plFrom = planLeg.from;
  const plTo = planLeg.to;
  const plGeoJson = toGeoJSON(planLeg.legGeometry.points, 5);

  // zero-length final step
  const plGeoJsonLastPt = lineString([[plTo.lon, plTo.lat], [plTo.lon, plTo.lat]]).geometry;
  const plLastDist = 0;
  const plLastDuration = 0;
  const steps = [
    {
      distance: planLeg.distance,
      duration: planLeg.duration,
      geometry: plGeoJson, // fromGeoJSON(plGeoJson, 6),
      name: plFrom.name,
      mode: profile === 'bus' ? 'driving' : profile,
      driving_side: 'right',
      maneuver: {
        location: [plFrom.lon, plFrom.lat],
        bearing_before: 0,
        bearing_after: 0,
        instruction: plFrom.name,
        modifier: 'straight',
        type: 'depart',
      },
      bannerInstructions: [{
        distanceAlongGeometry: planLeg.distance,
        primary: {
          text: titleCase(plFrom.name),
          components: [{
            text: titleCase(plFrom.name),
            type: 'text',
          }],
          modifier: 'straight',
          type: 'depart',
        },
      }],
      voiceInstructions: [{
        distanceAlongGeometry: planLeg.distance,
        announcement: plFrom.name,
        ssmlAnnouncement: `<speak><amazon:effect name="drc"><prosody rate="1.08">${plFrom.name}</prosody></amazon:effect></speak>`,
      }],
      weight: 1,
      intersections: [{
        location: [plFrom.lon, plFrom.lat],
        bearings: [0],
        entry: [true],
        out: 0,
      }],
    },
    {
      distance: plLastDist,
      duration: plLastDuration,
      geometry: plGeoJsonLastPt, // fromGeoJSON(plGeoJsonLastPt, 6),
      name: plTo.name,
      mode: profile === 'bus' ? 'driving' : profile,
      driving_side: 'right',
      maneuver: {
        location: [plTo.lon, plTo.lat],
        bearing_before: 0,
        bearing_after: 0,
        instruction: plTo.name,
        modifier: 'right',
        type: 'arrive',
      },
      bannerInstructions: [{
        distanceAlongGeometry: plLastDist,
        primary: {
          text: titleCase(plTo.name),
          components: [{
            text: titleCase(plTo.name),
            type: 'text',
          }],
          modifier: 'right',
          type: 'arrive',
        },
      }],
      voiceInstructions: [{
        distanceAlongGeometry: plLastDist,
        announcement: plTo.name,
        ssmlAnnouncement: `<speak><amazon:effect name="drc"><prosody rate="1.08">${plTo.name}</prosody></amazon:effect></speak>`,
      }],
      weight: 1,
      intersections: [{
        location: [plTo.lon, plTo.lat],
        bearings: [0],
        entry: [true],
        out: 0,
      }],
    },
  ];

  return steps;
}

function getModeProfile(legMode) {
  switch (legMode.toLowerCase()) {
    case 'walk':
      return 'walking';
    case 'bus':
      return 'bus';
    case 'car':
      return 'driving';
    case 'bike':
      return 'cycling';
    default:
      return 'driving';
  }
}

const emptyRoute = {
  distance: 0.0,
  duration: 0.0,
  geometry: null, // '',
  legs: [],
  /* routeOptions: {
    baseUrl: 'https://api.mapbox.com',
    user: 'mapbox',
    profile: 'driving',
    coordinates: [],
    geometries: 'polyline6',
    overview: 'full',
    voice_instructions: true,
    banner_instructions: true,
    access_token: config.MAPBOX_TOKEN,
    uuid: 'mmtpa',
  }, */
  voiceLocale: 'en',
};

function generateRouteLeg(planLeg, nextLeg) {
  const profile = getModeProfile(planLeg.mode);

  const routeLeg = {
    distance: planLeg.distance,
    duration: planLeg.duration,
    startTime: planLeg.startTime,
    endTime: planLeg.endTime,
    summary: planLeg.mode,
    steps: [],
  };

  const legGeometry = toGeoJSON(planLeg.legGeometry.points, 5);

  // Create an OSRM route only if the plan is not already in that format.
  // TODO: the "osrm" trip legs can only come from a car trip. This should
  // be done some different way so there aren't 2 different formats!
  if (planLeg.format === 'osrm') {
    routeLeg.steps = planLeg.steps.map((step) => {
      const newStep = { ...step };
      newStep.geometry = toGeoJSON(step.geometry, 5);
      return newStep;
    });
  } else {
    // TODO: document the cases where steps.length = 0 and where there's no steps or
    // intermediateStops.
    if (planLeg.steps.length > 0) {
      routeLeg.steps = generateRouteLegSteps(planLeg, profile, nextLeg);
    } else if (planLeg?.intermediateStops?.length > 0) {
      routeLeg.steps = intermediateStopsToLegSteps(planLeg, profile);
    } else {
      routeLeg.steps = planLegToLegSteps(planLeg, profile);
    }

    // Steps may be changed, so recalculate
    // TODO: Is the route leg's distance actually equal to the sum of all steps??
    routeLeg.distance = 0;
    routeLeg.steps.forEach((step) => {
      routeLeg.distance += step.distance;
    });
  }

  return { leg: routeLeg, geometry: legGeometry };
}

function generateRouteFromOTP(plan) {
  const route = JSON.parse(JSON.stringify(emptyRoute));
  const { legs } = plan;
  route.startTime = plan.startTime;
  route.endTime = plan.endTime;
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    let nextLeg;
    if (legs.length > i + 1) {
      nextLeg = legs[i + 1];
    }
    const rtleg = generateRouteLeg(leg, nextLeg);
    route.distance += rtleg.leg.distance;
    route.duration += rtleg.leg.duration;

    // const rtlegGeometry = rtleg.geometry;
    // if (!route.geometry) {
    //   route.geometry = rtlegGeometry;
    // } else {
    //   const curgeom = route.geometry;
    //   for (let j = 0; j < rtlegGeometry.coordinates.length; j++) {
    //     curgeom.coordinates.push(rtlegGeometry.coordinates[j]);
    //   }
    //   route.geometry = curgeom;
    // }
    let legToPush = {
      distance: rtleg.leg.distance,
      duration: rtleg.leg.duration,
      summary: 'Your trip',
      mode: leg.mode,
      steps: rtleg.leg.steps,
      geometry: rtleg.geometry,
      from: leg.from,
      to: leg.to,
    }
    if (leg.routeId && leg.tripId && leg.startTime) {
      legToPush.routeId = leg.routeId;
      legToPush.tripId = leg.tripId;
      legToPush.startTime = leg.startTime;
    }
    route.legs.push(legToPush);
  }
  const origin = plan.legs[0].from;
  const destination = plan.legs[plan.legs.length - 1].to;
  route.waypoints = [
    {
      type: 'start',
      coordinates: [origin.lon, origin.lat],
      wait: 0,
      time: Math.floor(route.startTime / 1000),
    },
    {
      type: 'end',
      coordinates: [destination.lon, destination.lat],
      wait: 0,
      time: Math.floor(route.endTime / 1000),
    },
  ];
  route.legs[0].from.waypoint = 0;
  route.legs[route.legs.length - 1].to.waypoint = 1;
  return route;
}

function isOTPPlan(plan) {
  return !plan.geometry;
}

const module = {

  /**
   * Creates a standardized route from the given plan (OTP or OSRM).
   * TODO: an OSRM result doesn't have have a startTime / endTime. Add the ability
   * to specify the depart time or arrive time.
   * @param {TripPlan} trip plan from tripplan.js
   */
  standardize: (plan) => {
    if (plan) {
      if (isOTPPlan(plan)) {
        return generateRouteFromOTP(plan);
      }
      // assume it's already an OSRM route, but may need to convert to GeoJSON.
      const newPlan = JSON.parse(JSON.stringify(plan));
      for (const leg of newPlan.legs) {
        if (leg.legGeometry?.points) {
          leg.geometry = toGeoJSON(leg.legGeometry.points, 5);
          delete leg.legGeometry;
          leg.steps.forEach((step) => {
            step.geometry = toGeoJSON(step.geometry, 5);
          });
        }
      }
      // newPlan.startTime = newPlan.legs[0].startTime;
      // newPlan.endTime = newPlan.legs[newPlan.legs.length - 1].endTime;
      return newPlan;
    }
    return null;
  },

};

export default module;