import React from 'react';
import {
  View, requireNativeComponent, Platform, findNodeHandle, NativeModules, UIManager,
} from 'react-native';
import PropTypes from 'prop-types';
import config from '../config';

const NATIVE_MAP_MODULE = 'MBLMapView';

const MBLMapView = requireNativeComponent(NATIVE_MAP_MODULE, Map, {
  nativeOnly: { onAndroidCallback: true }, // TODO: is this needed?
});

class Map extends React.Component {
  constructor(props) {
    super(props);
    this._onPress = this._onPress.bind(this);
    this._onPan = this._onPan.bind(this);
    this._onMapCenterChange = this._onMapCenterChange.bind(this);
    this._onUserTrackingChange = this._onUserTrackingChange.bind(this);
    this._onReverseGeocodeChange = this._onReverseGeocodeChange.bind(this);
    this._onMapStyleLoaded = this._onMapStyleLoaded.bind(this);
  }

  shouldComponentUpdate() {
    // we're going with an imperative rather than declarative map
    // never re-render the map
    return false;
  }

  setUserFollowMode(mode, zoom = -1, altitude = 0, pitch = -1, animDuration = 1000) {
    this._runNativeCommand('setUserFollowMode', [mode, zoom, altitude, pitch, animDuration]);
  }

  setContentInset(neSwCoordinates) {
    this._runNativeCommand('setContentInset', [neSwCoordinates[0], neSwCoordinates[1], neSwCoordinates[2], neSwCoordinates[3]]);
  }

  setReverseGeocodeCoordinate(x, y) {
    this._runNativeCommand('setReverseGeocodeCoordinate', [x, y]);
  }

  jsIsReady() {
    this._runNativeCommand('jsIsReady', []);
  }

  updateUserLocation(location) {
    this._runNativeCommand('updateUserLocation', [location[1], location[0]]);
  }

  fitBounds(
    northEastCoordinates,
    southWestCoordinates,
    paddingLeft = 0,
    paddingTop = 0,
    paddingRight = 0,
    paddingBottom = 0,
    duration = 0.0,
  ) {
    this._runNativeCommand(
      'fitBounds',
      [
        northEastCoordinates[1], northEastCoordinates[0],
        southWestCoordinates[1], southWestCoordinates[0],
        paddingLeft, paddingTop, paddingRight, paddingBottom, duration,
      ],
    );
  }

  togglePreciseUserLocation(turnOn) {
    this._runNativeCommand('togglePreciseUserLocation', [turnOn]);
  }

  _runNativeCommand(name, args = []) {
    const node = findNodeHandle(this._nativeRef);
    if (node == null) {
      return; // This can be null sometimes, most likely during rerender.
    }
    if (Platform.OS === 'android') {
      // Apparently as of react-native 0.58, you can't access view manager directly from
      // the UIManager object anymore. https://stackoverflow.com/questions/54857121/

      // TODO: can we use the same code as iOS now??
      const viewManagerConfig = NativeModules.UIManager.getViewManagerConfig
        ? NativeModules.UIManager.getViewManagerConfig(NATIVE_MAP_MODULE)
        : NativeModules.UIManager[NATIVE_MAP_MODULE];
      const command = viewManagerConfig.Commands[name];
      NativeModules.UIManager.dispatchViewManagerCommand(node, command, args);
    } else {
      // NativeModules.MBLMapView[name](node, ...args);
      const command = UIManager[NATIVE_MAP_MODULE].Commands[name];
      UIManager.dispatchViewManagerCommand(node, command, args);
    }
  }

  _setNativeRef(nativeRef) {
    this._nativeRef = nativeRef;
  }

  addSymbolLayer(id, imagePath, size) {
    this._runNativeCommand('addSymbolLayer', [id, imagePath, size]);
  }

  addIconSymbolLayer(
    id,
    iconPath,
    size = 1,
    iconOffsetX = 0,
    iconOffsetY = 0,
    showText = false,
    textOffsetX = 0,
    textOffsetY = 0,
    allowCollision = true,
    relativeToMap = false,
  ) {
    this._runNativeCommand('addIconSymbolLayer', [id, iconPath, size, iconOffsetX, iconOffsetY, showText, textOffsetX, textOffsetY, allowCollision, relativeToMap]);
  }

  addLineLayer(id) {
    this._runNativeCommand('addLineLayer', [id]);
  }

  addCircleLayer(id, minZoom = 0) {
    this._runNativeCommand('addCircleLayer', [id, minZoom]);
  }

  updateLayer(id, geoJsonString) {
    this._runNativeCommand('updateLayer', [id, geoJsonString]);
  }

  showLayer(id) {
    // this._runNativeCommand('showLayer', [id]);
  }

  hideLayer(id) {
    this._runNativeCommand('hideLayer', [id]);
  }

  callMapCenterUpdate() {
    this._runNativeCommand('callMapCenterUpdate');
  }

  updateStyle(styleURI) {
    this._runNativeCommand('updateStyle', [styleURI]);
  }

  _onPress(e) {
    const { onPress } = this.props;
    if (onPress) {
      onPress(e.nativeEvent.payload);
    }
  }

  _onPan(e) {
    const { onPan } = this.props;
    if (onPan) {
      onPan(e.nativeEvent.payload);
    }
  }

  _onMapCenterChange(e) {
    const { onMapCenterChange } = this.props;
    if (onMapCenterChange) {
      onMapCenterChange(e.nativeEvent.LatLng);
    }
  }

  _onUserTrackingChange(e) {
    const { onUserTrackingChange } = this.props;
    if (onUserTrackingChange) {
      onUserTrackingChange(e.nativeEvent.Mode);
    }
  }

  _onReverseGeocodeChange(e) {
    const { onReverseGeocodeChange } = this.props;
    if (onReverseGeocodeChange) {
      onReverseGeocodeChange(e.nativeEvent.LatLng);
    }
  }

  _onMapStyleLoaded() {
    const { onMapStyleLoaded } = this.props;
    if (onMapStyleLoaded) {
      onMapStyleLoaded();
    }
  }

  /*
  _getCenter() {
    const { center } = this.props;
    return center;
  }

  _getZoom() {
    const { zoom } = this.props;
    return zoom;
  }
  */

  render() {
    const props = {
      ...this.props,
      // center: this._getCenter(),
      // zoom: this._getZoom(),
    };
    const callbacks = {
      ref: (nativeRef) => this._setNativeRef(nativeRef),
      onPress: this._onPress,
      onPan: this._onPan,
      onMapCenterChange: this._onMapCenterChange,
      onUserTrackingChange: this._onUserTrackingChange,
      onReverseGeocodeChange: this._onReverseGeocodeChange,
      onMapStyleLoaded: this._onMapStyleLoaded,
    };

    return (
      <View
        style={{ flex: 1 }}
        pointerEvents="box-none"
        accessible={false}
      >
        <MBLMapView
          style={{ flex: 1 }}
          {...props}
          {...callbacks}
        />
      </View>
    );
  }
}

Map.propTypes = {
  // center: PropTypes.arrayOf(PropTypes.number),
  // zoom: PropTypes.number,
  styleURL: PropTypes.string,
  onPress: PropTypes.func,
  onPan: PropTypes.func,
  onMapStyleLoaded: PropTypes.func,
  onMapCenterChange: PropTypes.func,
  onUserTrackingChange: PropTypes.func,
  onReverseGeocodeChange: PropTypes.func,
};

Map.defaultProps = {
  // center: null,
  // zoom: null,
  // styleURL: 'mapbox://styles/mapbox/light-v9',
  styleURL: config.MAP.BASEMAPS.DAY,
  onPress: null,
  onPan: null,
  onMapStyleLoaded: null,
  onMapCenterChange: null,
  onUserTrackingChange: null,
  onReverseGeocodeChange: null,
};

export default Map;
