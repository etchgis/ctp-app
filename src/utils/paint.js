/* eslint-disable radix */
export const paint = {

  rgbToHex,

  hexToRgb,

  calculateTextColor: (backgroundColor) => {
    const rgb = hexToRgb(backgroundColor);
    const brightness = Math.round(((parseInt(rgb?.r || 0) * 299) +
      (parseInt(rgb?.g || 0) * 587) +
      (parseInt(rgb?.b || 0) * 114)) / 1000);
    return (brightness > 125) ? 'black' : 'white';
  },

};

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}
