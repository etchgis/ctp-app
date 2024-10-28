/**
 * OSRM maneuevers.
 * See http://project-osrm.org/docs/v5.23.0/api/#stepmaneuver-object
 * @module stepmaneuver
 */

const maneuvers = {

  error: { id: -1, text: null },
  none: { id: 0, text: 'none' },

  // a basic turn into direction of the `modifier`
  turn: { id: 1, text: 'turn' },

  // no turn is taken/possible, but the road name changes. The road can take a turn itself,
  // following `modifier`.
  newName: { id: 2, text: 'new name' },

  // indicates the departure of the leg
  depart: { id: 3, text: 'depart' },

  // indicates the destination of the leg
  arrive: { id: 4, text: 'arrive' },

  // merge onto a street (e.g. getting on the highway from a ramp, the `modifier` specifies
  // the direction of the merge)
  merge: { id: 5, text: 'merge' },

  // Deprecated. Replaced by `on_ramp` and `off_ramp`
  ramp: { id: 6, text: 'ramp' },

  // take a ramp to enter a highway (direction given by `modifier`)
  onRamp: { id: 7, text: 'on ramp' },

  // take a ramp to exit a highway (direction given by `modifier`)
  offRamp: { id: 8, text: 'off ramp' },

  // take the left/right side at a fork depending on `modifier`
  fork: { id: 9, text: 'fork' },

  // road ends in a T intersection turn in direction of `modifier`
  endOfRoad: { id: 10, text: 'end of road' },

  // Deprecated. replaced by lanes on all intersection entries
  useLane: { id: 11, text: 'use lane' },

  // Turn in direction of `modifier` to stay on the same road
  continue: { id: 12, text: 'continue' },

  // traverse roundabout, if the route leaves the roundabout there will be an additional
  // property `exit` for exit counting. The `modifier` specifies the direction of entering
  // the roundabout.
  roundabout: { id: 13, text: 'roundabout' },

  // a traffic circle. While very similar to a larger version of a roundabout, it does not
  // necessarily follow roundabout rules for right of way. It can offer `rotary_name` and/or
  // `rotary_pronunciation` parameters (located in the RouteStep object) in addition to the
  // exit parameter (located on the StepManeuver object).
  rotary: { id: 14, text: 'rotary' },

  // Describes a turn at a small roundabout that should be treated as normal turn.
  // The `modifier` indicates the turn direction. Example instruction: At the roundabout turn left.
  roundaboutTurn: { id: 15, text: 'roundabout turn' },

  // not an actual turn but a change in the driving conditions. For example the travel mode
  // or classes.
  // If the road takes a turn itself, the `modifier` describes the direction
  notification: { id: 16, text: 'notification' },

  // Describes a maneuver exiting a roundabout (usually preceeded by a `roundabout` instruction)
  exitRoundabout: { id: 17, text: 'exit roundabout' },

  // Describes the maneuver exiting a rotary (large named roundabout)
  exitRotary: { id: 18, text: 'exit rotary' },

  // Arrive at intermediate waypoint (Mapbox Directions API v4 extension)
  passWaypoint: { id: 19, text: 'waypoint' },
};

maneuvers.byId = {};
maneuvers.byText = {};
Object.keys(maneuvers).forEach((key) => {
  const maneuver = maneuvers[key];
  maneuvers.byId[maneuver.id] = maneuver;
  maneuvers.byText[maneuver.text] = maneuver;
});

export default maneuvers;
