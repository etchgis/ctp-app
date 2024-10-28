/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  InteractionManager,
  NativeModules,
  Pressable, StyleSheet, Text, TouchableOpacity, useColorScheme, View,
} from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import SlidingUpPanel from 'rn-sliding-up-panel';
import { Colors, Devices, Typography } from '../../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useStore } from '../../stores/RootStore';
import VerticalPlanSchedule from '../../components/VerticalPlanSchedule';
import { useIsFirstRender } from '../../utils/isFirstRender';
import moment from 'moment';
import 'moment/src/locale/es'
import formatters from '../../utils/formatters';
import config from '../../config';
import Map from '../../components/Map';
import { useFocusEffect } from '@react-navigation/native';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import buffer from '@turf/buffer';
import booleanIntersects from '@turf/boolean-intersects';
import Button from '../../components/Button';
import simulator from '../../services/simulator';
import TripPlan from '../../models/trip-plan';

import { JMapView, JOdpViewModule } from 'react-native-ctp-odp';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFontScale } from '../../utils/fontScaling';
import { deviceMultiplier } from '../../styles/devices';
// import { useGeolocation, useLocationEnabled } from '../../models/geolocation';
import translator from '../../models/translator';
import LocationData from '../../models/location-data';

const MapboxGL = { ...NativeModules.Mapbox };
let _mapboxReady = false;
MapboxGL.setAccessToken(config.MAP.MAPBOX_TOKEN).then(() => {
  _mapboxReady = true;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 90 * deviceMultiplier,
    paddingHorizontal: 25,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 91,
  },
  mapContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
  },
  footer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    // height: 110,
    paddingHorizontal: 25,
    paddingTop: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    zIndex: 101,
  },
  headerTop: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerBackButton: {
    position: 'absolute',
    left: 0,
    height: 30 * deviceMultiplier,
    width: 30 * deviceMultiplier,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    ...Typography.h4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 50,
    flex: 1,
  },
  headerColumn: {
    alignItems: 'center',
  },
  indoorButton: {
    position: 'absolute',
    bottom: 40 * deviceMultiplier,
    right: 10 * deviceMultiplier,
    width: 40 * deviceMultiplier,
    height: 40 * deviceMultiplier,
    borderRadius: 20 * deviceMultiplier,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 91,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.white,
    // borderTopColor: '#02597E',
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    // shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 102,
  },
});

const JMapViewForwardRef = React.forwardRef(({ width, height, visible, handleNavigationPathGenerated, handleSearchDestinationsGenerated, handleGeofencesChanged, handleVenueLoaded, handleRerouteNavigationPathGenerated, mapOptions }, ref) => {
  return (
    <JMapView
      ref={ref}
      style={{ height: height, width: width, visible: visible }}
      onMapMessage={{
        onNavigationPathGenerated: handleNavigationPathGenerated,
        onSearchDestinationsGenerated: handleSearchDestinationsGenerated,
        onGeofencesChanged: handleGeofencesChanged,
        onVenueLoaded: handleVenueLoaded,
        onRerouteNavigationPathGenerated: handleRerouteNavigationPathGenerated,
      }}
      mapOptions={mapOptions}
    />
  );
});

const JMapViewMemo = React.memo(JMapViewForwardRef);

const Selected = observer(({
  navigation,
}) => {

  console.log('SELECTED: render');

  const store = useStore();
  const insets = useSafeAreaInsets();
  const isFirstRender = useIsFirstRender();
  const colorScheme = useColorScheme();
  const currentFontScale = useFontScale();
  // const gl = useGeolocation();
  // const locationEnabled = useLocationEnabled();

  const [mapboxReady, setMapboxReady] = useState(_mapboxReady);
  const [styleReady, setStyleReady] = useState(false);
  const [allowDragging, setAllowDragging] = useState(true);
  const [shadowOpacity, setShadowOpacity] = useState(0.25);
  const [indoorDestinations, setIndoorDestinations] = useState([]);
  const [venueLoaded, setVenueLoaded] = useState(false);
  const [indoorReady, setIndoorReady] = useState(false);
  const [venues, setVenues] = useState([]);

  const _panel = useRef();
  const _slidingUpPanelValue = useRef(new Animated.Value(0)).current;

  // const [displayIndoor, setDisplayIndoor] = useState(false);
  const [showIndoor, setShowIndoor] = useState(false);
  const indoorMapRef = useRef();

  const FOOTER_HEIGHT =
    (store.authentication.loggedIn ? 110 : 68) * deviceMultiplier + insets.bottom;

  const VERTICAL_TRIP_PLAN_OFFSET = FOOTER_HEIGHT + (110 * Math.min(1.5, currentFontScale));

  const [screenReaderOn, setScreenReaderOn] = useState(false);

  // BEGIN INITIALIZE
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then((screenReaderEnabled) => {
        setScreenReaderOn(screenReaderEnabled);
        if (screenReaderEnabled) {
          setAllowDragging(false);
          InteractionManager.runAfterInteractions(() => {
            _panel.current && _panel.current.show({ toValue: getDraggableRange().top, velocity: 1000 });
          });
        }
      });
  }, []);

  // useEffect(() => {
  //   console.log('SHOULD SHOW SCREEN', !!_panel.current);
  //   if (screenReaderOn && _panel.current && store.mapManager.map) {
  //     console.log('SHOW SCREEN');
  //     _panel.current.show();
  //   }
  // }, [screenReaderOn, store.mapManager.currentMap, store.mapManager.currentMap, _panel.current]);

  // Get caregivers now in case they plan on pressing GO
  useEffect(() => {
    fetchCaregivers();
  }, []);

  const fetchCaregivers = () => {
    store.authentication.fetchAccessToken()
      .then(async (accessToken) => {
        await store.traveler.getCaregivers(accessToken);
      })
      .catch((e) => {
        console.log('fetchCaregivers access token error', e);
      });
  };
  // END INITIALIZE

  // BEGIN SLIDING PANEL, VERTICAL PLAN SCHEDULE
  useEffect(() => {
    _slidingUpPanelValue.addListener(onAnimatedValueChange);
    return () => {
      _slidingUpPanelValue.removeAllListeners();
    };
  }, []);

  const onAnimatedValueChange = useCallback((e) => {
    const range = getDraggableRange();
    const min = range.top,
      max = range.bottom,
      a = 0,
      b = 0.25;
    let z = (b - a) * ((e.value - min) / (max - min)) + a;
    setShadowOpacity(z || 0);
  }, []);

  const onPlanScroll = (isScrolling) => {
    if (!screenReaderOn) {
      setAllowDragging(!isScrolling);
    }
  };

  const getDraggableRange = () => {
    const top = Devices.screen.height - styles.header.height - insets.top,
      bottom = VERTICAL_TRIP_PLAN_OFFSET;
    return {
      top,
      bottom,
    };
  };

  const getSnappingPoints = () => {
    return [
      Devices.screen.height - 450,
    ];
  };
  // END SLIDING PANEL, VERTICAL PLAN SCHEDULE

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', (e) => {
      console.log('unload map');
      store.mapManager.reset();
    });

    return unsubscribe;
  }, [navigation]);

  // BEGIN MAP
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

  const gotRef = (ref) => {
    if (!store.mapManager.map && store.mapManager.currentMap === 'selected') {
      console.log('SELECTED: set map ref');
      store.mapManager.setMap(ref);
    }
  };

  const handleMapStyleLoaded = () => {
    if (!styleReady) {
      setStyleReady(true);
    }
  };

  useEffect(() => {
    if (styleReady && store.mapManager.map && store.mapManager.currentMap === 'selected') {
      if (Devices.isIphone) {
        store.mapManager.setExtentPaddings(20, 20, 100, 20);
      }
      store.mapManager.addLayers();
      let outdoorPlan = { ...store.trip.selectedPlan };
      if (outdoorPlan.legs) {
        outdoorPlan.legs = outdoorPlan.legs.filter(l => l.mode.toLowerCase() !== 'indoor');
      }
      var geoJson = store.mapManager.updateSelectedTripLayer(outdoorPlan, store.preferences.wheelchair);
      // console.log('geoJson', geoJson);
      const bbx = bbox(buffer(bboxPolygon(bbox(geoJson)), 1));
      store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);

      // let crosswalks = [];
      // for(let i = 0; i < LocationData.Intersections.features.length; i++) {
      //   if(booleanIntersects(LocationData.Intersections.features[i], geoJson)) {
      //     crosswalks.push(LocationData.Intersections.features[i]);
      //   }
      // }
      // console.log('crosswalk', crosswalks);
    }
  }, [styleReady, store.mapManager.map]);
  // END MAP

  // BEGIN INDOOR MAP
  const getNavigationPathStyle = () => {
    return {
      shouldFocus: true,
      style: {
        stroke: '#0000FF',
        alpha: 0.75,
        strokeWidth: 3,
      },
      destinationIcon: {
        iconSource: require('../../../assets/images/destination.png'),
        iconWidth: 32,
        iconHeight: 43,
        iconOffsetX: 0,
        iconOffsetY: -16,
      },
    };
  };

  const getHeight = () => {
    const h = Devices.screen.height,
      hh = styles.header.height + insets.top;
    return screenReaderOn ? 0 : (h - hh - VERTICAL_TRIP_PLAN_OFFSET);
  };

  useEffect(() => {
    return () => {
      console.log('SELECTED: cleanup');
      indoorMapRef.current = null;
    }
  }, []);

  const gotIndoorRef = (ref) => {
    if (!indoorMapRef.current && store.mapManager.currentIndoorMap === 'selected') {
      indoorMapRef.current = ref;
      console.log('SELECTED: got indoor ref');

      const o_vid = store.trip.request.origin.venueId;
      const d_vid = store.trip.request.destination.venueId;

      const v = [];
      if (o_vid) v.push({ id: o_vid, leg: 'origin' });
      if (d_vid) v.push({ id: d_vid, leg: 'destination' });
      console.log(v);

      // just use the first one
      if (v.length > 0) {
        setVenues([v[0]]);
        setIndoorReady(true);
      }
      else {
        store.display.hideSpinner();
      }
    }
  };

  // const gotIndoorRef = (ref) => {
  //   if (!indoorMapRef.current && store.mapManager.currentIndoorMap === 'selected') {
  //     indoorMapRef.current = ref;
  //     console.log('SELECTED: got indoor ref');

  //     const o_vid = store.trip.request.origin.venueId;
  //     const d_vid = store.trip.request.destination.venueId;

  //     if (o_vid || d_vid) {
  //       setDisplayIndoor(true);
  //       setTimeout(() => {
  //         const venueId = o_vid || d_vid;
  //         const venue = config.INDOOR.VENUES.find(v => v.id === venueId);
  //         let credentials = { ...venue.credentials };
  //         credentials.venueId = venueId;
  //         console.log('SELECTED: set venue');
  //         indoorMapRef.current.setMapVenue(credentials, config.INDOOR.OPTIONS);
  //       }, 10);
  //     }
  //     else {
  //       console.log('SELECTED: no venue id');
  //       store.display.hideSpinner();
  //     }
  //   }
  // };

  useEffect(() => {
    if (indoorMapRef.current && indoorReady && venues.length > 0) {
      // const o_vid = store.trip.request.origin.venueId;
      // const d_vid = store.trip.request.destination.venueId;
      console.log('venues', venues, venues.length);

      // if (o_vid || d_vid) {
      // setTimeout(() => {
      // const venueId = o_vid || d_vid;
      const venueId = venues[0].id;
      const venue = config.INDOOR.VENUES.find(v => v.id === venueId);
      let credentials = { ...venue.credentials };
      credentials.venueId = venueId;
      console.log('SELECTED: set venue', venueId);
      indoorMapRef.current.setMapVenue(credentials, config.INDOOR.OPTIONS);


      // }, 10);
      // }
    }
  }, [indoorMapRef, indoorReady, venues]);

  // const handleVenueLoaded = (venueId) => {
  //   console.log('SELECTED: venue loaded', venueId);
  //   setVenueLoaded(true);
  // }

  const handleVenueLoaded = useCallback((venueId) => {
    console.log('SELECTED: venue loaded', venueId);
    setVenueLoaded(true);
  }, [venueLoaded]);

  // const handleSearchDestinationsGenerated = (destinations) => {
  //   if (indoorMapRef.current && store.mapManager.currentIndoorMap === 'selected') {
  //     console.log('SELECTED: onSearchDestinationsGenerated');
  //     setIndoorDestinations(destinations);
  //   }
  // };

  const handleSearchDestinationsGenerated = useCallback((destinations) => {
    if (indoorMapRef.current && store.mapManager.currentIndoorMap === 'selected') {
      console.log('SELECTD: handleSearchDestinationsGenerated');
      setIndoorDestinations(destinations);
    }
  }, []);

  useEffect(() => {
    if (indoorDestinations.length > 0 && indoorMapRef.current && venueLoaded && store.mapManager.currentIndoorMap === 'selected') {
      const indoorLegs = store.trip.selectedPlan.legs.filter(l => l.mode.toLowerCase() === 'indoor');
      if (indoorLegs.length > 0) {
        console.log('SELECTED: get path', indoorLegs[0].from.waypointId, indoorLegs[0].to.waypointId);
        indoorMapRef.current.wayfindBetweenWaypoints(indoorLegs[0].from.waypointId, indoorLegs[0].to.waypointId);
      }
    }
  }, [indoorDestinations, venueLoaded]);

  const handleNavigationPathGenerated = useCallback((pathId, instructions, start, end, path, geojson) => {
    if (indoorMapRef.current && pathId && store.mapManager.currentIndoorMap === 'selected') {
      console.log('SELECTED: handleNavigationPathGenerated');
      indoorMapRef.current.drawNavigationPath(pathId, getNavigationPathStyle());
      store.display.hideSpinner();
    }
  }, []);

  const handleToggleIndoorPress = () => {
    setShowIndoor(!showIndoor);
  };

  useEffect(() => {
    if (indoorMapRef.current && showIndoor) {
      setTimeout(() => {

        // indoorMapRef.current.centerMapOnPoint({
        //   point: [42.905519, -78.868386],
        //   zoom: 1,
        //   rotation: 0,
        //   animationDuration: 1500,
        //   format: 'LAT_LONG',
        // });
      }, 10);
    }
  }, [showIndoor]);
  // END INDOOR MAP

  // BEGIN TRIP ACTIONS
  const scheduleTripPress = () => {
    store.display.showSpinner();
    store.authentication.fetchAccessToken()
      .then((accessToken) => {
        store.schedule.add(store.trip.selectedPlan, store.trip.request, accessToken)
          .then((newTrip) => {
            store.display.hideSpinner();
            store.trip.reset();
            store.mapManager.setCurrentMap('home');
            store.mapManager.setCurrentIndoorMap(null);
            navigation.reset({
              index: 0,
              routes: [{ name: 'schedule' }],
            });
          })
          .catch((e) => {
            console.log('schedule trip error', e);
            store.display.hideSpinner();
          });
      })
      .catch((e) => {
        console.log(e);
        store.display.hideSpinner();
      });
  };

  const cancelTripPress = () => {
    Alert.alert(
      translator.t('views.scheduleTrip.selected.alerts.cancel.title'),
      translator.t('views.scheduleTrip.selected.alerts.cancel.message'),
      [
        {
          text: translator.t('views.scheduleTrip.selected.alerts.cancel.buttons.no'),
          style: 'cancel',
          onPress: () => {
            console.log('keep trip');
          },
        },
        {
          text: translator.t('views.scheduleTrip.selected.alerts.cancel.buttons.yes'),
          onPress: () => {
            console.log('cancel trip');
            cancelTrip();
          },
        },
      ]
    );
  };

  const cancelTrip = () => {
    store.display.showSpinner();
    store.authentication.fetchAccessToken()
      .then((accessToken) => {
        store.schedule.cancel(store.schedule.selectedTrip.id, accessToken)
          .then(() => {
            store.trip.reset();
            store.schedule.selectTrip(null);
            store.display.hideSpinner();
            store.mapManager.setCurrentMap('home');
            store.mapManager.setCurrentIndoorMap(null);
            navigation.pop();
          })
          .catch((e) => {
            console.log(e);
            store.display.hideSpinner();
          });
      })
      .catch((e) => {
        console.log(e);
        store.display.hideSpinner();
      });
  };

  const startTripPress = () => {
    store.mapManager.setCurrentMap('navigator');
    store.mapManager.setCurrentIndoorMap('navigator');
    simulator.setTripPlan(new TripPlan(store.trip.selectedPlan));
    store.display.showSpinner(0.5);
    navigation.push('navigator');
  }
  // END TRIP ACTIONS

  // BEGIN OVERRIDE STYLES
  const headerStyle = () => {
    return {
      ...styles.header,
      height: styles.header.height + insets.top,
      paddingTop: insets.top,
      shadowOpacity: shadowOpacity,
    };
  };

  const mapContainerStyle = () => {
    return {
      ...styles.mapContainer,
      top: styles.header.height + insets.top,
      bottom: VERTICAL_TRIP_PLAN_OFFSET,
    };
  };

  const mapStyle = () => {
    return {
      height: (showIndoor || screenReaderOn) ? 0 : '100%',
    };
  };

  const footerStyle = () => {
    return {
      ...styles.footer,
      height: FOOTER_HEIGHT,
      borderTopColor: shadowOpacity !== 0.25 ? Colors.primary1 : Colors.white,
    };
  };

  const contentStyle = () => {
    return {
      ...styles.content,
      shadowOpacity: shadowOpacity,
      borderTopColor: shadowOpacity === 0 ? Colors.primary1 : Colors.white,
    };
  };
  // END OVERRIDE STYLES

  return (

    <View style={styles.container}>

      <View style={headerStyle()}>

        <View style={styles.headerTop}>
          <Pressable
            style={styles.headerBackButton}
            onPress={() => {
              store.mapManager.setCurrentIndoorMap('results');
              navigation.pop();
            }}
            accessibilityLabel={translator.t('global.backLabelDefault')}
            accessibilityLanguage={store.preferences.language || 'en'}
          >
            <FontAwesomeIcon
              icon="chevron-left"
              size={18 * deviceMultiplier} />
          </Pressable>

          <Text
            maxFontSizeMultiplier={1.5}
            style={styles.headerLabel}
          >{formatters.datetime.format(moment(store.trip.request.whenTime), 'ddd, MMM D, YYYY', store.preferences.language)}</Text>

        </View>

        <View
          style={styles.headerRow}
        >

          <View
            style={styles.headerColumn}
            accessible={true}
            accessibilityLabel={
              translator.t('global.leave') +
              ' ' +
              formatters.datetime.format(moment(store.trip.selectedPlan?.startTime), 'h:mm A', store.preferences.language)
            }
            accessibilityLanguage={store.preferences.language || 'en'}
          >

            <Text
              maxFontSizeMultiplier={1.5}
              style={styles.headerLabel}
            >{translator.t('global.leave')}</Text>
            <Text
              maxFontSizeMultiplier={1.5}
              style={styles.headerLabel}
            >
              {formatters.datetime.format(moment(store.trip.selectedPlan?.startTime), 'h:mm A', store.preferences.language)}
            </Text>

          </View>

          <View>
            <FontAwesomeIcon
              color={Colors.primary1}
              icon="right-long"
              size={18 * deviceMultiplier}
            />
          </View>

          <View
            style={styles.headerColumn}
            accessible={true}
            accessibilityLabel={
              translator.t('global.arrive') +
              ' ' +
              formatters.datetime.format(moment(store.trip.selectedPlan?.endTime), 'h:mm A', store.preferences.language)
            }
            accessibilityLanguage={store.preferences.language || 'en'}
          >
            <Text
              maxFontSizeMultiplier={1.5}
              style={styles.headerLabel}
            >{translator.t('global.arrive')}</Text>
            <Text
              maxFontSizeMultiplier={1.5}
              style={styles.headerLabel}
            >
              {formatters.datetime.format(moment(store.trip.selectedPlan?.endTime), 'h:mm A', store.preferences.language)}
            </Text>
          </View>

        </View>

      </View>

      <View style={mapContainerStyle()}>

        {venues.length > 0 &&
          <TouchableOpacity
            style={styles.indoorButton}
            onPress={handleToggleIndoorPress}
          >
            <FontAwesomeIcon
              icon="building"
              size={24}
              color={showIndoor ? Colors.primary1 : Colors.medium}
            />
          </TouchableOpacity>
        }

        <View style={mapStyle()}>

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
                onMapStyleLoaded={handleMapStyleLoaded}
              />
            )}

        </View>

        {config.INCLUDE_INDOOR &&
          <>
            <JMapViewMemo
              ref={gotIndoorRef}
              width={Devices.screen.width}
              height={getHeight()}
              visible={showIndoor}
              handleVenueLoaded={handleVenueLoaded}
              handleNavigationPathGenerated={handleNavigationPathGenerated}
              handleSearchDestinationsGenerated={handleSearchDestinationsGenerated}
              mapOptions={config.INDOOR.OPTIONS}
            />
            {/* <JMapView
              ref={gotIndoorRef}
              style={{ width: Devices.screen.width, height: getHeight(), visible: showIndoor }}
              onMapMessage={{
                onNavigationPathGenerated: handleNavigationPathGenerated,
                onSearchDestinationsGenerated: handleSearchDestinationsGenerated,
                onVenueLoaded: handleVenueLoaded
              }}
              mapOptions={config.INDOOR.OPTIONS}
            /> */}
          </>
        }

      </View>

      <SlidingUpPanel
        ref={c => (_panel.current = c)}
        animatedValue={_slidingUpPanelValue}
        draggableRange={getDraggableRange()}
        snappingPoints={getSnappingPoints()}
        allowDragging={allowDragging}
        showBackdrop={false}
        friction={0.9}
      >

        <View style={contentStyle()}>

          {store.trip.selectedPlan &&
            <VerticalPlanSchedule
              request={store.trip.request}
              plan={store.trip.selectedPlan}
              wheelchair={store.preferences.wheelchair}
              screenReading={screenReaderOn}
              onScroll={onPlanScroll}
              showGo={store.authentication.loggedIn && !!store.schedule.selectedTrip}
              onGoPress={startTripPress}
            />
          }

        </View>

      </SlidingUpPanel>

      <View style={footerStyle()}>

        {store.authentication.loggedIn && !store.schedule.selectedTrip &&
          <Button
            label={translator.t('views.scheduleTrip.selected.scheduleLabel')}
            onPress={scheduleTripPress}
          />
        }
        {store.schedule.selectedTrip &&
          <Button
            label={translator.t('views.scheduleTrip.selected.cancelLabel')}
            onPress={cancelTripPress}
          />
        }
        <Button
          label={translator.t('views.scheduleTrip.selected.backLabel')}
          buttonStyle={{
            backgroundColor: Colors.white,
            borderColor: Colors.white,
          }}
          labelStyle={{
            color: Colors.primary1,
          }}
          onPress={() => {
            store.mapManager.setCurrentIndoorMap('results');
            navigation.pop();
          }}
        />

      </View>

    </View>

  );
});

Selected.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    addListener: PropTypes.func,
  }),
};

export default Selected;
