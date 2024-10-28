/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  InteractionManager,
  NativeModules,
  StyleSheet, Text, useColorScheme, View,
} from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import SlidingUpPanel from 'rn-sliding-up-panel';
import { Colors, Devices } from '../../styles';
import { useStore } from '../../stores/RootStore';
import VerticalPlanSchedule from '../../components/VerticalPlanSchedule';
import { useIsFirstRender } from '../../utils/isFirstRender';
import config from '../../config';
import Map from '../../components/Map';
import { useFocusEffect } from '@react-navigation/native';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import buffer from '@turf/buffer';

const MapboxGL = { ...NativeModules.Mapbox };
let _mapboxReady = false;
MapboxGL.setAccessToken(config.MAP.MAPBOX_TOKEN).then(() => {
  _mapboxReady = true;
});

const PANEL_TOP = Devices.screen.height - 160;
const PANEL_MIDDLE = Devices.screen.height - 450;
const PANEL_BOTTOM = (Devices.isIphone ? 91 : 71);

const dependentLocationTopClone = {
  'type': 'FeatureCollection',
  'features': [{
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [],
    },
    'properties': {
      circleColor: Colors.primary1,
      circleRadius: 6,
      circleStrokeColor: '#ffffff',
      circleStrokeWidth: 4,
    },
  }],
};

const dependentLocationBottomClone = {
  'type': 'FeatureCollection',
  'features': [{
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [],
    },
    'properties': {
      circleColor: Colors.primary1,
      circleRadius: 6,
      circleStrokeColor: '#ffffff',
      circleStrokeWidth: 4,
    },
  }],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 160,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 90,
  },
  map: {
    height: Devices.screen.height - PANEL_BOTTOM,
    width: Devices.screen.width,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 100,
  },
});

const Tracker = observer(({
  navigation,
}) => {

  const store = useStore();
  const isFirstRender = useIsFirstRender();
  const colorScheme = useColorScheme();

  const [mapReady, setMapReady] = useState(false);
  const [mapboxReady, setMapboxReady] = useState(_mapboxReady);
  const [styleReady, setStyleReady] = useState(false);
  const [allowDragging, setAllowDragging] = useState(true);
  const [updates, setUpdates] = useState();

  const _panel = useRef();
  const _slidingUpPanelValue = useRef(new Animated.Value(0)).current;

  const mounted = useRef(false);

  let ws = React.useRef(new WebSocket(`wss://ce9siadbi5.execute-api.us-east-2.amazonaws.com/staging?groups=dependent-${store.traveler?.selectedDependent?.dependent}`)).current;

  useEffect(() => {
    ws.onopen = () => {
      console.log('Connected to the server', ws.url);
    };
    ws.onclose = (e) => {
      console.log('Disconnected. Check internet or server.');
    };
    ws.onerror = (e) => {
      console.log(e.message);
    };
    ws.onmessage = (e) => {
      //TODO: double parse, really????
      let d = JSON.parse(JSON.parse(e.data));
      setUpdates(d);
      if (d.longitude && d.latitude) {
        let fc = { ...dependentLocationTopClone };
        fc.features[0].geometry.coordinates = [d.longitude, d.latitude];
        store.mapManager.updateLayer('dependentLocation', fc);
      }
    };
    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (isFirstRender) {
      _panel.current.show(PANEL_MIDDLE);
    }
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

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
    if (_mapboxReady) {
      setMapboxReady(true);
    } else {
      waitForAccessToken();
    }
  }, [mapboxReady]);

  useFocusEffect(
    React.useCallback(() => {
      store.mapManager.reset();
      InteractionManager.runAfterInteractions(() => {
        // need to run this because useFocusEffect is called before the blur of the previous screen
        setMapReady(true);
      });
    }, [])
  );

  const onPlanScroll = (isScrolling) => {
    setAllowDragging(!isScrolling);
  };

  const gotRef = (ref) => {
    if (!store.mapManager.map) {
      store.mapManager.setMap(ref);
      console.log('got ref');
    }
  };

  const handleMapStyleLoaded = () => {
    if (!styleReady) {
      setStyleReady(true);
      console.log('The map style has finished loading.');
      if (store.mapManager.map) {
        // store.mapManager.setExtentPaddings(0, 0, Devices.screen.height - 450, 0);
        store.mapManager.setExtentPaddings(0, 0, 200, 0);
        store.mapManager.addLayers();
        var geoJson = store.mapManager.updateSelectedTripLayer(store.trip.selectedPlan);
        const bbx = bbox(buffer(bboxPolygon(bbox(geoJson)), 1));
        store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);

        let fc = { ...dependentLocationTopClone };
        fc.features[0].geometry.coordinates = [-78.8132, 42.94267];
        store.mapManager.updateLayer('dependentLocation', fc);
      }
    }
  };

  const handleExitPress = () => {
    navigation.pop();
  };

  return (
    <View
      style={styles.container}
    >
      <View style={{
        ...styles.header,
        shadowOpacity: 0.25,
      }}>
        <Text>top</Text>
      </View>

      <View
        style={styles.map}
      >
        {mapboxReady && mapReady
          && (
            <Map
              ref={gotRef}
              style={{
                flex: 1,
              }}
              styleURL={colorScheme === 'dark' ? config.MAP.BASEMAPS.NIGHT : config.MAP.BASEMAPS.DAY}
              center={config.MAP.CENTER}
              zoom={config.MAP.ZOOM}
              onMapStyleLoaded={handleMapStyleLoaded}
            />
          )}
      </View>

      <SlidingUpPanel
        ref={c => (_panel.current = c)}
        animatedValue={_slidingUpPanelValue}
        draggableRange={{
          top: PANEL_TOP,
          bottom: PANEL_BOTTOM,
        }}
        snappingPoints={[PANEL_BOTTOM, PANEL_MIDDLE, PANEL_TOP]}
        allowDragging={allowDragging}
        showBackdrop={false}
        friction={0.9}
      >
        <View
          style={styles.content}
        >
          {store.trip.selectedPlan &&
            <VerticalPlanSchedule
              request={store.trip.request}
              plan={store.trip.selectedPlan}
              wheelchair={store.preferences.wheelchair}
              onScroll={onPlanScroll}
              showExit
              onExitPress={handleExitPress}
              trackingUpdates={updates}
              tracking
            />
          }
        </View>
      </SlidingUpPanel>

    </View>
  );
});

Tracker.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    addListener: PropTypes.func,
  }),
};

export default Tracker;
