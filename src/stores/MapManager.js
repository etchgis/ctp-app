import { makeAutoObservable, runInAction } from 'mobx';
import { toGeoJSON } from '../utils/polyline';
import config from '../config';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import { Devices } from '../styles';

class MapManager {
  map = null;
  indoorMap = null;
  layers = [];
  visible = false;
  rootStore = null;
  userLocation = [];
  focusType = null;
  focusTarget = null;
  currentMap = 'home';
  currentIndoorMap = 'results';

  constructor(rootStore) {
    makeAutoObservable(this, { rootStore: false });
    this.rootStore = rootStore;
  }

  setMap(mapRef) {
    runInAction(() => {
      this.map = mapRef;
    });
  }

  setIndoorMap(mapRef) {
    runInAction(() => {
      this.indoorMap = mapRef;
    });
  }

  setCurrentMap(mapTarget) {
    runInAction(() => {
      this.currentMap = mapTarget;
    });
  }

  setCurrentIndoorMap(mapTarget) {
    runInAction(() => {
      this.currentIndoorMap = mapTarget;
    });
  }

  reset() {
    runInAction(() => {
      this.map = null;
      this.indoorMap = null;
      this.layers = [];
      this.visible = false;
    });
  }

  show() {
    runInAction(() => {
      this.visible = true;
    });
  }

  hide() {
    runInAction(() => {
      this.visible = false;
    });
  }

  addLayers() {
    runInAction(() => {
      if (this.layers.indexOf('selectedTripRoute') === -1 && this.map) {

        // GENERAL MAPPING
        this.map.addCircleLayer('mapCenterPoint');
        this.layers.push('mapCenterPoint');

        // LIVE TRANSIT DATA
        this.map.addLineLayer('selectedBusRoute');
        this.map.addCircleLayer('selectedBusStops');
        this.layers.push('selectedBusRoute');
        this.layers.push('selectedBusStops');

        // TRIP PLANS
        this.map.addLineLayer('selectedTripRoute');
        this.map.addLineLayer('track-live');
        this.map.addCircleLayer('tripIntermediateStops');

        this.map.addIconSymbolLayer('destination', 'destination', 0.65, 0, -20);
        this.map.addIconSymbolLayer('walk', 'mode-walk', 0.65);
        this.map.addIconSymbolLayer('roll', 'mode-roll', 0.65);
        this.map.addIconSymbolLayer('car', 'mode-car', 0.65);
        this.map.addIconSymbolLayer('bike', 'mode-bike', 0.65);
        this.map.addIconSymbolLayer('bus', 'mode-bus', 0.65);
        this.map.addIconSymbolLayer('tram', 'mode-tram', 0.65);
        this.map.addIconSymbolLayer('hail', 'mode-shuttle', 0.65);
        this.map.addIconSymbolLayer('indoor', 'mode-indoor', 0.65);
        this.map.addIconSymbolLayer('bus-live', 'bus-live', 0.65);

        this.map.addLineLayer('shuttleServiceArea');
        this.map.addLineLayer('intersections');

        this.layers.push('selectedTripRoute');
        this.layers.push('tripIntermediateStops');
        this.layers.push('tripAndroidStops');
        this.layers.push('destination');
        this.layers.push('walk');
        this.layers.push('roll');
        this.layers.push('car');
        this.layers.push('bike');
        this.layers.push('bus');
        this.layers.push('tram');
        this.layers.push('hail');
        this.layers.push('indoor');
        this.layers.push('bus-live');
        this.layers.push('track-live');

        this.layers.push('shuttleServiceArea');
        this.layers.push('intersections');

        // CAREGIVER TRACKING DEPENDENT
        this.map.addCircleLayer('dependentLocation');
        this.layers.push('dependentLocation');
      }
    });
  }

  updateStyle(styleURI) {
    runInAction(() => {
      this.map.updateStyle(styleURI);
    });
  }

  updateUserLocation(longitude, latitude) {
    if (this.map) {
      this.map.updateUserLocation([longitude, latitude]);
      runInAction(() => {
        this.userLocation = [latitude, longitude];
      });
    }
  }

  updateLayer(name, featureCollection) {
    if (this.map) {
      this.map.updateLayer(name, JSON.stringify(featureCollection));
    }
  }

  fitBounds(
    northEastLatLng,
    southWestLatLng,
    paddingLeft = 0,
    paddingTop = 0,
    paddingRight = 0,
    paddingBottom = 0,
    duration = 0.0,
  ) {
    this.map.fitBounds(
      northEastLatLng,
      southWestLatLng,
      paddingLeft,
      paddingTop,
      paddingRight,
      paddingBottom,
      duration
    );
  }

  setFocus(type, target) {
    this.focusType = type;
    this.focusTarget = target;
    if (type === 'bounds') {
      this.map.fitBounds([target[2], target[3]], [target[0], target[1]], 0, 0, 0, 0, 1000);
    }
    else if (type === 'user') {
      this.map.setUserFollowMode(target.mode, target.altitude, target.zoom, target.pitch, target.duration);
    }
    else if (!type) {
      this.map.setUserFollowMode(null);
    }
  }


  updateBounds(xmin, ymin, xmax, ymax) {
    this.map.fitBounds([xmax, ymax], [xmin, ymin], 0, 0, 0, 20, 0);
  }

  setExtentPaddings(top = 80, right = 20, bottom = 350, left = 20) {
    this.map.setContentInset([top, right, bottom, left]);
  }

  updateSelectedTripLayer(tripPlan, hasWheelchair = false) {
    if (this.layers.indexOf('selectedTripRoute') > -1) {
      var tripRoute = generateRoute(tripPlan);
      var tripModeBreaks = generateModeIconSymbols(tripPlan, hasWheelchair);
      var tripIntermediateStops = generateIntermediateStops(tripPlan);
      this.map.updateLayer('selectedTripRoute', JSON.stringify(tripRoute));
      this.map.updateLayer('tripIntermediateStops', JSON.stringify(tripIntermediateStops));
      for (var lyr in tripModeBreaks) {
          this.map.updateLayer(lyr, JSON.stringify(tripModeBreaks[lyr]));
      }
      return tripRoute;
    }
  }
}

export default MapManager;

const generateRoute = (tripPlan) => {
  var route = {
    'type': 'FeatureCollection',
    'features': [],
  };
  for (var i = 0; i < tripPlan.legs.length; i++) {
    var leg = tripPlan.legs[i];
    var properties = {
      lineColor: getModeColor(leg.mode),
      lineWidth: 4,
      lineOpacity: 1,
      lineJoin: 'round',
    };
    if (leg.mode.toLowerCase() === 'walk') {
      properties.lineDashPattern = [1, 0.5];
    }
    let legGeometry;
    if (leg.legGeometry && leg.legGeometry.points) {
      legGeometry = toGeoJSON(leg.legGeometry.points);
    }
    else if (leg.geometry && leg.geometry.type && leg.geometry.coordinates) {
      legGeometry = leg.geometry;
    }
    // var legGeometry = toGeoJSON(leg.legGeometry.points);
    if (legGeometry.coordinates.length === 0) {
      legGeometry.coordinates.push([leg.from.lon, leg.from.lat]);
    }
    route.features.push({
      'type': 'Feature',
      'geometry': legGeometry,
      'properties': properties,
    });
  }
  return route;
};

const generateIntermediateStops = (tripPlan) => {
  var intermediateStops = {
    'type': 'FeatureCollection',
    'features': [],
  };
  for (var i = 0; i < tripPlan.legs.length; i++) {
    var leg = tripPlan.legs[i],
      color = getModeColor(leg.mode);
    let legGeometry;
    if (leg.legGeometry && leg.legGeometry.points) {
      legGeometry = toGeoJSON(leg.legGeometry.points);
    }
    else if (leg.geometry && leg.geometry.type && leg.geometry.coordinates) {
      legGeometry = leg.geometry;
    }

    if (leg.intermediateStops && leg.intermediateStops.length > 0) {
      for (var j = 0; j < leg.intermediateStops.length; j++) {
        var iStop = leg.intermediateStops[j];
        var pt = {
          'type': 'Point',
          'coordinates': [iStop.lon, iStop.lat],
        };
        var snapped = nearestPointOnLine(legGeometry, pt);
        var stopProperties = {
          circleColor: '#ffffff',
          circleRadius: 3,
          circleStrokeColor: color === '#FFFFFF' ? '#70BFDA' : color,
          circleStrokeWidth: 3,
        };
        intermediateStops.features.push({
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [snapped.geometry.coordinates[0], snapped.geometry.coordinates[1]],
          },
          'properties': stopProperties,
        });
      }
    }
  }
  return intermediateStops;
};

const generateModeIconSymbols = (tripPlan, hasWheelchair) => {
  var lyrs = {
    'walk': { 'type': 'FeatureCollection', 'features': [] },
    'roll': { 'type': 'FeatureCollection', 'features': [] },
    'car': { 'type': 'FeatureCollection', 'features': [] },
    'bike': { 'type': 'FeatureCollection', 'features': [] },
    'bus': { 'type': 'FeatureCollection', 'features': [] },
    'tram': { 'type': 'FeatureCollection', 'features': [] },
    'hail': { 'type': 'FeatureCollection', 'features': [] },
    'indoor': { 'type': 'FeatureCollection', 'features': [] },
    'destination': { 'type': 'FeatureCollection', 'features': [] },
  };
  for (var i = 0; i < tripPlan.legs.length; i++) {
    var leg = tripPlan.legs[i],
      color = getModeColor(leg.mode),
      mode = leg.mode,
      ftr = leg.from;
    switch (mode.toLowerCase()) {
      case 'walk':
        // don't show a walk icon if we're going less than 1/10 mi
        if (leg.distance > 161) {
          if (hasWheelchair) {
            lyrs.roll.features.push({ 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [ftr.lon, ftr.lat] }  });
          }
          else {
            lyrs.walk.features.push({ 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [ftr.lon, ftr.lat] }  });
          }
        }
        break;
      case 'car':
        lyrs.car.features.push({ 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [ftr.lon, ftr.lat] }  });
        break;
      case 'bike':
        lyrs.bike.features.push({ 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [ftr.lon, ftr.lat] }  });
        break;
      case 'bicycle':
        lyrs.bike.features.push({ 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [ftr.lon, ftr.lat] }  });
        break;
      case 'bus':
        lyrs.bus.features.push({ 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [ftr.lon, ftr.lat] }  });
        break;
      case 'tram':
        lyrs.tram.features.push({ 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [ftr.lon, ftr.lat] }  });
        break;
      case 'hail':
        lyrs.hail.features.push({ 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [ftr.lon, ftr.lat] }  });
        break;
      case 'indoor':
        lyrs.indoor.features.push({ 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [ftr.lon, ftr.lat] }  });
        break;
      default:
        break;
    }
  }
  var lastLeg = tripPlan.legs[tripPlan.legs.length - 1];
  lyrs.destination.features.push({ 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [lastLeg.to.lon, lastLeg.to.lat] }  });
  return lyrs;
};

const getModeColor = (mode) => {
  let color = '#616161';
  const found = config.MODES.find(m => m.mode.toLowerCase() === mode.toLowerCase());
  return found.color || color;
};
