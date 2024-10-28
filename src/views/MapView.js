/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from 'react';
import {
  Animated, Easing, NativeModules, useColorScheme,
} from 'react-native';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import Map from '../components/Map';
import config from '../config';
import { useStore } from '../stores/RootStore';
import { geolocation } from '../models/geolocation';

const MapboxGL = { ...NativeModules.Mapbox };
let _mapboxReady = false;
MapboxGL.setAccessToken(config.MAP.MAPBOX_TOKEN).then(() => {
  _mapboxReady = true;
});

const MapView = observer(({
  style,
}) => {
  const store = useStore();
  const { user } = store.authentication;
  const colorScheme = useColorScheme();

  const [mapboxReady, setMapboxReady] = useState(_mapboxReady);
  const [styleReady, setStyleReady] = useState(false);

  const animatedValueRef = useRef(new Animated.Value(1));
  const geolocationWatchId = useRef();

  const waitForAccessToken = () => {
    MapboxGL.getAccessToken().then((accessToken) => {
      if (accessToken) {
        setMapboxReady(true);
      } else {
        setTimeout(() => {
          waitForAccessToken();
        }, 0);
      }
    });
  };

  useEffect(() => {
    if (!geolocationWatchId.current) {
      geolocationWatchId.current = geolocation.subscribe(updateUserLocation, geolocation.Quality.AREA);
    }
  }, []);

  const updateUserLocation = (position, heading, speed) => {
    store.navigation.updateCurrentLocation(position, heading, speed);
  };

  useEffect(() => {
    if (_mapboxReady) {
      setMapboxReady(true);
    } else {
      waitForAccessToken();
    }
  }, [mapboxReady]);

  const updateMapStyle = (mode) => {
    if (store.mapManager.map) {
      store.mapManager.updateStyle(
        mode === 'dark'
          ? config.MAP.BASEMAPS.NIGHT
          : config.MAP.BASEMAPS.DAY,
      );
    }
  };

  useEffect(() => {
    // do this here because the map is always available and under the view stack
    const mode = user?.profile?.displayMode === 'auto'
      ? colorScheme
      : store.display.mode;
    updateMapStyle(mode);
    store.display.updateMode(mode);
  }, [colorScheme]);

  useEffect(() => {
    const mode = user?.profile?.displayMode === 'auto'
      ? colorScheme
      : store.display.mode;
    updateMapStyle(mode);
  }, [store.display.mode]);

  const showMap = () => {
    Animated.timing(animatedValueRef.current, {
      toValue: 0,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  const hideMap = () => {
    Animated.timing(animatedValueRef.current, {
      toValue: 1,
      duration: 350,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (store.mapManager.visible) {
      showMap();
    } else {
      hideMap();
    }
  }, [store.mapManager.visible]);

  const handleMapStyleLoaded = () => {
    if (!styleReady) {
      setStyleReady(true);
      console.log('The map style has finished loading.');
      if (store.mapManager.map) {
        store.mapManager.addLayers();
      }
    }
  };

  const gotRef = (ref) => {
    if (!store.mapManager.map) {
      store.mapManager.setMap(ref);
      const box = config.MAP.VIEWBOX;
      console.log('got ref');
      // store.mapManager.fitBounds([box[3], box[2]], [box[1], box[0]]);
    }
  };

  // This styleURL doesn't seem to work on the current Mapbox iOS.
  // TODO switch to local JSON styles eventually.
  return (
    <Animated.View
      style={style}
    >
      {mapboxReady
        && (
          <Map
            ref={gotRef}
            style={{
              flex: 1,
            }}
            styleURL={colorScheme === 'dark' ? config.MAP.BASEMAPS.NIGHT : config.MAP.BASEMAPS.DAY}
            center={config.MAP.CENTER}
            zoom={config.MAP.ZOOM}
            // center={[config.MAP.DEFAULT_LAT, config.MAP.DEFAULT_LON]}
            // zoom={config.MAP.DEFAULT_ZOOM}
            onMapStyleLoaded={handleMapStyleLoaded}
          />
        )}
    </Animated.View>
  );
});

MapView.propTypes = {
  style: PropTypes.object,
};

MapView.defaultProps = {
  style: {},
};

export default MapView;
