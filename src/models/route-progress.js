/**
 * Class for tracking progress along a single leg Route object.
 * The progress is updated as you feed in GPS coordinates. You can then
 * retrieve the current step and other progress information.
 * @module routeprogress
 */

import lineSlice from '@turf/line-slice';
import turfLength from '@turf/length';
import nearestPointOnLine from '@turf/nearest-point-on-line';

import LocationData from './location-data';
import stepmaneuvers from './step-maneuver';
import stepdirections from './step-direction';
import config from '../config';
// import FastTranslator from 'fast-mlkit-translate-text';

/*
 Structure of a RouteProgress (TODO: make this a TypeScript interface):
 {
   route: Route [OSRM directions]
   offRoute: bool
   hasBeenOnRoute: bool
   distanceCompleted: double
   distanceRemaining: double
   durationCompleted: int [seconds]
   durationRemaining: int [seconds]

   stepIndex: int
   stepDistanceCompleted: double
   stepDistanceRemaining: double
   stepDurationCompleted: int
   stepDurationRemaining: int

   maneuverType: int
   maneuverDirection: int
   maneuverInstruction: string
   nextManeuverInstruction: string

   bannerInstruction: string
   voiceInstruction: string

   lastPoint: GeoJSON
 }
 */

/**
  * Returns the instruction that is currently active based on progress along the step, if any.
  * @param {*} instructionList - A `bannerInstructions` or `voiceInstructions` property for a step.
  * @param {*} distFromManeuver - Distance from end of the step's path, where next maneuver happens.
  */
function getNextInstruction(instructionList, distFromManeuver) {
  // Format of both types of instructions is like:
  // [ { distanceAlongGeometry: N, ... }, {distanceAlongGeometry: N, ...} ],
  // distanceAlongGeometry by Mapbox: "A float indicating how far from the upcoming
  // maneuver the voice [or banner] instruction should begin in meters."

  // search backward because a later instruction could override an earlier one.
  for (let i = instructionList.length - 1; i >= 0; i--) {
    const instruction = instructionList[i];
    if (distFromManeuver <= instruction.distanceAlongGeometry) {
      return instruction;
    }
  }
  return null;
}

export default class RouteProgress {
  /**
    * Initialize for tracking a single specific OSRM route.
    * @param {Object} route - OSRM route
    */
  constructor(route) {
    this.route = route;
    this.offRoute = false;
    this.hasBeenOnRoute = false;
    this.distanceCompleted = 0;
    this.distanceRemaining = route.distance;
    this.durationCompleted = 0;
    this.durationRemaining = route.duration;

    const step = route.legs[0].steps[0];
    this.stepIndex = 0;
    this.stepDistanceCompleted = 0;
    this.stepDistanceRemaining = step.distance;
    this.stepDurationCompleted = 0;
    this.stepDurationRemaining = step.duration;

    this.maneuverType = stepmaneuvers.none;
    this.maneuverDirection = stepdirections.none;
    this.maneuverInstruction = null;
    // TODO: replace this with primary / secondary maneuver instruction feature?
    this.nextManeuverInstruction = null;

    this.bannerInstruction = null;
    this.voiceInstruction = null;

    this.currentInstruction = null;
    this.upcomingInstruction = null;

    this.lastPoint = null;

    this.deviatedTicks = 0;

    this.useMlTranslations = config.USE_ML_TRANSLATION_KIT;
  }

  /**
    * Apply the given user motion to the navigational progress.
    * @param {lat,lng} latLng
    * @param {double} heading
    * @param {double} speed
    */
  update(latLng, heading, speed, language = 'en') {
    const currentPoint = {
      type: 'Point',
      properties: {
        heading,
        speed,
      },
      coordinates: [latLng.lng, latLng.lat],
    };
    this.lastPoint = currentPoint;

    let closestStepIndex;
    let closestStepPoint;
    let closestDistToRoute = Number.MAX_VALUE;

    const leg = this.route.legs[0];
    leg.steps.forEach((step, stepIndex) => {
      const geojson = step.geometry;
      const stepPt = nearestPointOnLine(geojson, currentPoint);
      const dist = stepPt.properties.dist * 1000;
      if (dist < closestDistToRoute) {
        closestDistToRoute = dist;
        closestStepIndex = stepIndex;
        closestStepPoint = stepPt;
      }
    });

    // In a tight space we may have rerouted to the wrong path, so be more lenient
    // about allowing user to be off-route until they've followed the route for a bit.
    const hasBeenFollowing = this.distanceCompleted > 100;
    const deviationDistance = hasBeenFollowing ? config.DEVIATED_OFFROUTE_METERS : 10;
    const minDeviationTicks = hasBeenFollowing ? 10 : 3;
    if (closestDistToRoute >= deviationDistance) {
      this.deviatedTicks++;
    } else {
      this.deviatedTicks = 0;
    }

    // check if we need to re-route the user.
    if ((closestDistToRoute > config.IMMEDIATELY_OFFROUTE_METERS || this.deviatedTicks >= minDeviationTicks) && leg.mode !== 'INDOOR') {
      // if the user hasn't touched the route yet, they're at the start, give the user
      // space to get on the route, don't immediately re-route them.
      if (this.hasBeenOnRoute || closestDistToRoute > config.PRE_ROUTE_START_METERS) {
        this.offRoute = true;
        // const coords = {
        //   lat: closestStepPoint.geometry.coordinates[1],
        //   lng: closestStepPoint.geometry.coordinates[0],
        // };
        // console.log(`user is ${closestDistToRoute} meters from: ${JSON.stringify(coords)} (at ${JSON.stringify(latLng)})`);
        return;
      }
    } else {
      this.hasBeenOnRoute = true;
    }

    this.offRoute = false;

    let distAfterStep = 0;
    let durAfterStep = 0;
    for (let i = closestStepIndex + 1; i < leg.steps.length; i++) {
      const si = leg.steps[i];
      distAfterStep += si.distance;
      durAfterStep += si.duration;
    }

    const step = leg.steps[closestStepIndex];
    const upcomingStep = leg.steps[closestStepIndex + 1];
    const stepCoords = step.geometry.coordinates;
    const lastStepPoint = stepCoords[stepCoords.length - 1];
    // step.distance and turfLength of geometry are not exactly the same,
    // so make sure the difference error is in completed dist rather than remaining.
    const distRemaining = turfLength(
      lineSlice(closestStepPoint, lastStepPoint, step.geometry),
    ) * 1000;
    const durRemaining = Math.floor(step.duration * (distRemaining / step.distance));

    this.stepIndex = closestStepIndex;
    this.stepDistanceRemaining = distRemaining;
    this.stepDistanceCompleted = step.distance - distRemaining;
    this.stepDurationRemaining = durRemaining;
    this.stepDurationCompleted = step.duration - durRemaining;

    this.distanceRemaining = distRemaining + distAfterStep;
    this.distanceCompleted = this.route.distance - this.distanceRemaining;
    this.durationRemaining = durRemaining + durAfterStep;
    this.durationCompleted = this.route.duration - this.durationRemaining;

    let currentModifier = step?.bannerInstructions?.[0]?.primary?.modifier;
    if (currentModifier) {
      currentModifier = currentModifier.charAt(0).toUpperCase() + currentModifier.slice(1);
    }

    let currentText = step?.bannerInstructions?.[0]?.primary?.text;
    if (currentText.toLowerCase().includes('turn')
      || currentText.toLowerCase().includes('your')
      || currentText.toLowerCase().includes('proceed')
      || currentText.toLowerCase().includes('next stop')
      || currentText.toLowerCase().includes('arrive at')
      || currentText.toLowerCase().includes('arrive in')
      || currentText.toLowerCase() === 'bus'
      || currentText.toLowerCase().includes('continue on')
      || step?.bannerInstructions?.[0]?.primary?.type === 'depart') {
      this.currentInstruction = currentText;
    } else {
      if (currentText.indexOf('Cross ') === 0) {
        this.currentInstruction = `${currentModifier} to ${currentText}`;
      } else {
        this.currentInstruction = `${currentModifier} on ${currentText}`;
      }
    }

    // let spanishAvailable = false;
    // try {
    //   spanishAvailable = await FastTranslator.isLanguageDownloaded('Spanish');
    //   if (this.useMlTranslations && language === 'es' && spanishAvailable && this.currentInstruction) {
    //     console.log('TRANSLATING:', this.currentInstruction);
    //     const translatedText = await FastTranslator.translate(this.currentInstruction);
    //     this.currentInstruction = translatedText;
    //   }
    // } catch (error) {
    //   console.log('TRANSLATE ERROR!!!!', error);
    // }

    if (upcomingStep?.bannerInstructions) {
      let upcomingModifier = upcomingStep?.bannerInstructions?.[0]?.primary?.modifier;
      if (upcomingModifier) {
        upcomingModifier = upcomingModifier.charAt(0).toUpperCase() + upcomingModifier.slice(1);
        const upcomingText = upcomingStep?.bannerInstructions?.[0]?.primary?.text;
        if (upcomingText.toLowerCase().includes('turn')
          || upcomingText.toLowerCase().includes('your')
          || upcomingText.toLowerCase().includes('next stop')
          || upcomingText.toLowerCase().includes('proceed')
          || upcomingText.toLowerCase().includes('arrive at')
          || upcomingText.toLowerCase().includes('arrive in')
          || upcomingText.toLowerCase().includes('continue on')) {
          this.upcomingInstruction = upcomingText;
        } else {
          if (upcomingText.indexOf('Cross ') === 0) {
            this.upcomingInstruction = `${upcomingModifier} to ${upcomingText}`;
          } else {
            this.upcomingInstruction = `${upcomingModifier} on ${upcomingText}`;
          }
        }
      }
    } else {
      this.upcomingInstruction = null;
    }

    // try {
    //   if (this.useMlTranslations && language === 'es' && spanishAvailable && this.upcomingInstruction) {
    //     const translatedText = await FastTranslator.translate(this.upcomingInstruction);
    //     this.upcomingInstruction = translatedText;
    //   }
    // } catch (error) {
    //   console.log('TRANSLATE ERROR!!!!', error);
    // }

    // const { maneuver } = upcomingStep;
    const maneuver = upcomingStep?.maneuver;
    this.maneuverType = stepmaneuvers.none;
    this.maneuverDirection = stepdirections.none;
    this.maneuverInstruction = null;
    if (maneuver) {
      const type = stepmaneuvers.byText[maneuver?.type];
      if (type) {
        this.maneuverType = type.id;
      }
      const dir = stepdirections.byText[maneuver.modifier];
      if (dir) {
        this.maneuverDirection = dir.id;
      }
      this.maneuverInstruction = maneuver.instruction;
    }

    // TODO: delete the nextManeuverInstruction field?
    // this.nextManeuverInstruction = null;
    // if (nextStep?.maneuver) {
    //   this.nextManeuverInstruction = nextStep.maneuver.instruction;
    // }

    // console.log(`${this.stepDistanceRemaining}m to ${JSON.stringify(step.voiceInstructions)}`);

    this.bannerInstruction = step.bannerInstructions
      ? getNextInstruction(step.bannerInstructions, this.stepDistanceRemaining) : null;
    this.voiceInstruction = step.voiceInstructions
      ? getNextInstruction(step.voiceInstructions, this.stepDistanceRemaining) : null;

    // try {
    //   if (this.useMlTranslations && language === 'es' && spanishAvailable && this.voiceInstruction && this.voiceInstruction.announcement) {
    //     const translatedText = await FastTranslator.translate(this.voiceInstruction.announcement);
    //     this.voiceInstruction.announcement = translatedText;
    //   }
    // } catch (error) {
    //   console.log('TRANSLATE ERROR!!!!', error);
    // }

    // this.atCrossing = null;
    // if (leg?.mode === 'WALK') {
    //   const nextCrossingStep = step?.featureType === 'crossing'
    //     ? step
    //     : (upcomingStep?.featureType === 'crossing' ? upcomingStep : null);
    //   if (nextCrossingStep) {
    //     if (nextCrossingStep === step || this.stepDistanceRemaining <= 6) {
    //       const crossing = LocationData.Crossings.find((c) => c.wayId === nextCrossingStep.featureId);
    //       if (crossing) {
    //         this.atCrossing = crossing;
    //       }
    //     }
    //   }
    // }
  }
}