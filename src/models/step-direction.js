/**
 * OSRM maneuever directions ("modifier").
 * See http://project-osrm.org/docs/v5.23.0/api/#stepmaneuver-object
 * @module stepdirection
 */

const directions = {

  error: { id: -1, text: null },
  none: { id: 0, text: 'none' },

  // indicates reversal of direction
  uturn: { id: 1, text: 'uturn' },

  // a sharp right turn
  sharpRight: { id: 2, text: 'sharp right' },

  // a normal turn to the right
  right: { id: 3, text: 'right' },

  // a slight turn to the right
  slightRight: { id: 4, text: 'slight right' },

  // no relevant change in direction
  straight: { id: 5, text: 'straight' },

  // a slight turn to the left
  slightLeft: { id: 6, text: 'slight left' },

  // a normal turn to the left
  left: { id: 7, text: 'left' },

  // a sharp turn to the left
  sharpLeft: { id: 8, text: 'sharp left' },

};

directions.byId = {};
directions.byText = {};
Object.keys(directions).forEach((key) => {
  const direction = directions[key];
  directions.byId[direction.id] = direction;
  directions.byText[direction.text] = direction;
});

export default directions;
