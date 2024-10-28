/**
 * Immutable object that represents the complete state of a trip.
 * The reason it is immutable is so you can pass around and compare a state
 * representation each time a navigation update occurs.
 * It has to copy properties from its route, if it relied on external state
 * then it would defeat the purpose of being immutable.
 * @module tripprogress
 */

import clock from './clock';

// const LATE_BUS_TOLERANCE_MS = 5 * 60 * 1000;

/*
 Structure of a TripProgress (TODO: make this TypeScript interface):
 {
   latLng: { lat, lng }
   heading: double
   avgSpeed: double
   instSpeed: double

   tripPlan: TripPlan

   offRoute: bool
   hasBeenOnRoute: bool
   legIndex: int
   stepIndex: int
   leg: TripLeg object {
     distance: double
     duration: int
     steps: []
   }
   nextLeg: TripLeg object

   maneuverType: int
   maneuverDirection: int
   maneuverInstruction: string
   nextManeuverInstruction: string // TODO: replace with primary/secondary instruction?

   bannerInstruction: string
   nextBannerInstruction: string
   voiceInstruction: string

   tripDistanceCompleted: double
   tripDistanceRemaining: double
   tripDurationCompleted: int [seconds]
   tripDurationRemaining: int [seconds]

   legDistanceCompleted: double
   legDistanceRemaining: double
   legDurationCompleted: int [seconds]
   legDurationRemaining: int [seconds]

   stepDistanceCompleted: double
   stepDistanceRemaining: double
   stepDurationCompleted: int [seconds]
   stepDurationRemaining: int [seconds]
 }

  Structure of a Route:
  {
   // OSRM fields
   distance: float,
   duration: float,
   geometry: string (polyline6 text),
   legs: [],

   // Fields added by rerouter.js
   startedFrom: {
     routeLegIndex: int,
     legStepIndex: int,
     distAlongRoute: float,
     distAlongLeg: float,
     distAlongStep: float,
   },
   endTrimDist: float,
  }
  */

export default class TripProgress {
  /**
    * Initialize for tracking a single specific OSRM route.
    * @param {Object} trip - Trip { plan, request } object
    * @param {Object} route - OSRM route
    * @param {Object} routeProgress - RouteProgress object
    */
  constructor(tripPlan, route, routeProgress, startTime) {
    const { lastPoint } = routeProgress;
    this.latLng = {
      lng: lastPoint.coordinates[0],
      lat: lastPoint.coordinates[1],
    };
    this.heading = lastPoint.properties.heading;
    this.instSpeed = lastPoint.properties.speed;

    // TODO: calc average speed?
    // this.avgSpeed = ;

    this.tripPlan = tripPlan;
    this.offRoute = routeProgress.offRoute;
    this.hasBeenOnRoute = routeProgress.hasBeenOnRoute;

    if (route && !this.offRoute) {
      // Adjust for the fact that the current route being navigated may be
      // a section of the full trip plan.
      const { startedFrom } = route;
      this.legIndex = startedFrom.routeLegIndex;
      this.stepIndex = routeProgress.stepIndex + startedFrom.legStepIndex;
      this.leg = tripPlan.legs[this.legIndex];
      if (tripPlan.legs.length > this.legIndex + 1) {
        this.nextLeg = tripPlan.legs[this.legIndex + 1];
      } else {
        this.nextLeg = null;
      }
      // this.step = route.legs[0].steps[routeProgress.stepIndex];
      // this.nextStep = route.legs[0].steps[routeProgress.stepIndex + 1];

      let waypointLegIndex = this.legIndex;
      let waypointLeg = tripPlan.legs[waypointLegIndex];
      while (waypointLeg && !(waypointLeg.to.waypoint || waypointLeg.to.waypoint === 0)) {
        waypointLegIndex += 1;
        waypointLeg = tripPlan.legs[waypointLegIndex];
      }
      if (waypointLeg) {
        this.nextWaypoint = tripPlan.waypoints[waypointLeg.to.waypoint];
      }

      this.maneuverType = routeProgress.maneuverType;
      this.maneuverDirection = routeProgress.maneuverDirection;
      this.maneuverInstruction = routeProgress.maneuverInstruction;
      // this.nextManeuverInstruction = routeProgress.nextManeuverInstruction;

      this.bannerInstruction = routeProgress.bannerInstruction;
      this.voiceInstruction = routeProgress.voiceInstruction;

      this.currentInstruction = routeProgress.currentInstruction;
      this.upcomingInstruction = routeProgress.upcomingInstruction;

      this.tripDistanceCompleted = routeProgress.distanceCompleted + startedFrom.distAlongRoute;
      this.tripDistanceRemaining = routeProgress.distanceRemaining + route.endTrimDist;
      this.tripDurationCompleted = Math.floor((clock.now() - startTime) / 1000);
      // calc total duration with remaining legs as well
      // for (let i = this.legIndex + 1; i < tripPlan.legs.length; i++) {
      //   this.durationRemaining += tripPlan.legs[i].duration;
      // }
      this.tripDurationRemaining = routeProgress.durationRemaining
        + Math.floor((tripPlan.endTime - this.leg.endTime) / 1000);

      this.legDistanceCompleted = routeProgress.distanceCompleted + startedFrom.distAlongLeg;
      this.legDistanceRemaining = routeProgress.distanceRemaining;
      // TODO?
      // this.legDurationCompleted = ;
      this.legDurationRemaining = routeProgress.durationRemaining;

      let totalSecsLeft = 0;
      for (let i = this.legIndex; i < this.tripPlan.legs.length; i++) {
        const leg = this.tripPlan.legs[i];
        const secsLeftOnLeg = i === this.legIndex ? this.legDurationRemaining : leg.duration;
        const now = Date.now();
        totalSecsLeft += secsLeftOnLeg;
        leg.secsToEnd = totalSecsLeft;
        leg.eta = now + leg.secsToEnd * 1000;
        // console.log('jon:  ', i, leg.eta);
        // console.log('LEG', leg.mode);
        // if (leg.mode === 'BUS') {
        //   let busArriveTime = leg.from.departure,
        //     atRisk = now > busArriveTime - LATE_BUS_TOLERANCE_MS;
        //   // console.log('AT RISK 1', atRisk);
        //   const busTimeRemaining = busArriveTime - now;
        //   let userTimeRemaining = busArriveTime - tripPlan.startTime;
        //   if (this.legDurationRemaining) {
        //     userTimeRemaining = this.legDurationRemaining * 1000;
        //   }
        //   let secsBehindBus = Math.floor((userTimeRemaining - busTimeRemaining) / 1000);
        //   if (secsBehindBus > 30) {
        //     atRisk = true;
        //   }
        //   // console.log('times', now, busArriveTime, busTimeRemaining, userTimeRemaining, secsBehindBus);
        //   console.log('TRIP PROGRESS AT RISK', atRisk);
        //   // let busArriveTime = leg.startTime;
        //   // leg.atRisk = now > busArriveTime - LATE_BUS_TOLERANCE_MS;
        //   // console.log('times', now, busArriveTime)
        //   // const busTimeRemaining = busArriveTime - now;
        //   // let userTimeRemaining = busArriveTime - tripPlan.startTime;
        //   // if (routeProgress.durationRemaining) {
        //   //   userTimeRemaining = this.legDurationRemaining * 1000;
        //   // }
        //   // let secsBehindBus = Math.floor((userTimeRemaining - busTimeRemaining) / 1000);
        //   // if (secsBehindBus > 30) {
        //   //   leg.atRisk = true;
        //   // }
        //   // console.log('AT RISK', leg.atRisk);
        // }
      }

      this.stepDistanceCompleted = routeProgress.stepDistanceCompleted;
      if (routeProgress.startIndex === 0) {
        this.stepDistanceCompleted += startedFrom.distAlongStep;
      }
      this.stepDistanceRemaining = routeProgress.stepDistanceRemaining;
      this.stepDurationCompleted = routeProgress.stepDurationCompleted;
      this.stepDurationRemaining = routeProgress.stepDurationRemaining;
      this.atCrossing = routeProgress.atCrossing;
    }
  }
}