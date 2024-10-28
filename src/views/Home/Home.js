/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { AccessibilityInfo, NativeModules, PixelRatio, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, Vibration, View } from 'react-native';
import { Colors, Devices, Typography } from '../../styles';
import { useStore } from '../../stores/RootStore';
import BottomMenu from '../../components/BottomMenu';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSignal, faSlash } from '@fortawesome/free-solid-svg-icons';
import config from '../../config';
import Map from '../../components/Map';
import bbox from '@turf/bbox';
import buffer from '@turf/buffer';
import ScheduleTripDropdown from '../../components/ScheduleTripDropdown';
import ServiceViewer from '../../components/ServiceViewer';
import { geocoder } from '../../services/transport';

const MapboxGL = { ...NativeModules.Mapbox };
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { geolocation, useLocationEnabled } from '../../models/geolocation';
import booleanContains from '@turf/boolean-contains';
import LocationData from '../../models/location-data';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { isTablet } from 'react-native-device-info';
import { deviceMultiplier } from '../../styles/devices';
import {
  checkNotificationsPermissions,
  onMessageReceived,
  registerDevice,
} from '../../utils/notifications';
import notifee, { EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import translator from '../../models/translator';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import RateStar from '../../components/RateStar';
import feedback from '../../services/transport/feedback';
import { addEventListener } from "@react-native-community/netinfo";
import { Path, Svg } from 'react-native-svg';
import voice from '../../services/voice';
// import FastTranslator from 'fast-mlkit-translate-text';

let _mapboxReady = false;
MapboxGL.setAccessToken(config.MAP.MAPBOX_TOKEN).then(() => {
  _mapboxReady = true;
});

const pointClone = {
  'type': 'FeatureCollection',
  'features': [{
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [],
    },
    'properties': {
      circleColor: '#004990',
      circleRadius: 6,
      circleStrokeColor: '#ffffff',
      circleStrokeWidth: 4,
    },
  }],
};

const ADDITIONAL_ANDROID_PADDING = Devices.isAndroid ? 10 : 0;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 80 * deviceMultiplier,
    paddingBottom: 30,
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
  title: {
    ...Typography.h1,
  },
  titleGreeting: {
    fontStyle: 'italic',
    fontWeight: '200',
  },
  dropdown: {
    position: 'absolute',
    right: isTablet() ? 100 : 20,
    // bottom: '-50%',
    left: isTablet() ? 100 : 20,
    zIndex: 1000
  },
  mapContainer: {
    position: 'absolute',
    right: 0,
    height: 400 * deviceMultiplier,
    left: 0,
    zIndex: 80,
  },
  // map: {
  //   flex: 1,
  // },
  locationButton: {
    position: 'absolute',
    top: 40,
    left: 10 * deviceMultiplier,
    width: 40 * deviceMultiplier,
    height: 40 * deviceMultiplier,
    borderRadius: 20 * deviceMultiplier,
    paddingTop: 2,
    paddingRight: 2,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 81,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  accuracyButton: {
    position: 'absolute',
    top: 40,
    right: 10 * deviceMultiplier,
    width: 40 * deviceMultiplier,
    height: 40 * deviceMultiplier,
    borderRadius: 20 * deviceMultiplier,
    borderWidth: 4,
    borderColor: Colors.danger,
    paddingBottom: 4,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 81,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  accuracyMessage: {
    position: 'absolute',
    top: 40,
    right: 10,
    left: (10 * deviceMultiplier) + (40 * deviceMultiplier) + 10,
    backgroundColor: Colors.white,
    borderRadius: 20 * deviceMultiplier,
    paddingVertical: 10,
    paddingLeft: 20,
    paddingRight: 40,
    borderWidth: 4,
    borderColor: Colors.danger,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 80,
  },
  badSignalContainer: {
    position: 'absolute',
    top: 90,
    left: 10 * deviceMultiplier,
    width: 40 * deviceMultiplier,
    height: 40 * deviceMultiplier,
    borderRadius: 20 * deviceMultiplier,
    paddingTop: 2,
    paddingRight: 2,
    backgroundColor: Colors.white,
    borderWidth: 4,
    borderColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 81,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  badSignalBars: {
    position: 'absolute',
  },
  badSignalSlash: {
    position: 'absolute',
    fontSize: 80,
    fontWeight: 'bold',
    color: Colors.danger,
    transform: [{ rotate: '45deg' }]
  },
  servicesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 90,
  },
  footer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.danger,
    zIndex: 90,
  },
  modalTitle: {
    ...Typography.h2,
    marginBottom: 4
  },
  modalSubTitle: {
    ...Typography.h4,
    marginBottom: 20
  },
  modalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingBottom: 200
  },
  feedbackRow: {
    marginVertical: 10,
    alignItems: 'center',
  },
  feedbackRowText: {
    ...Typography.h4,
    color: Colors.primary3,
    marginBottom: 6
  },
  input: {
    borderColor: Colors.primary1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 28,
    height: 60 * deviceMultiplier,
    width: 250 * deviceMultiplier,
  },
});

const Home = observer(({
  navigation,
}) => {
  // console.log('Home render', Date.now());

  const store = useStore();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  // const gl = useGeolocation();
  const [currentLocation, setCurrentLocation] = useState(null);
  const locationEnabled = useLocationEnabled();
  const isFocused = useIsFocused();

  const [mapboxReady, setMapboxReady] = useState(_mapboxReady);
  const [styleReady, setStyleReady] = useState(false);
  const [mapCenter, setMapCenter] = useState([]);
  const [mapPanState, setMapPanState] = useState('end');
  const [firstLocation, setFirstLocation] = useState(null);
  const [mapReferencePoint, setMapReferencePoint] = useState({});
  const [useMapCenter, setUseMapCenter] = useState(false);
  const [reverseAddress, setReverseAddress] = useState(undefined);
  const [currentDropDownHeight, setCurrentDropdownHeight] = useState(0);
  const [
    hasCheckedNotificationPermissions,
    setHasCheckedNotificationPermissions,
  ] = useState(false);
  const [screenReaderOn, setScreenReaderOn] = useState(false);
  const [showFeedback, setShowFeedback] = useState(store.display.feedbackVisible);
  const [feedbackValues, setFeedbackValues] = useState([0, 0, 0]);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showBadSignal, setShowBadSignal] = useState(false);
  const [showBadGps, setShowBadGps] = useState(geolocation.accuracy === 2);
  const [showBadGpsMessage, setShowBadGpsMessage] = useState(geolocation.accuracy === 2);

  // useEffect(() => {
  //   async function test() {
  //     await FastTranslator.prepare({
  //       source: 'English',
  //       target: 'Spanish',
  //       downloadIfNeeded: true
  //     });
  //     await FastTranslator.downloadLanguageModel('Spanish');
  //     await FastTranslator.downloadLanguageModel('English');
  //     const isAvailable = await FastTranslator.isLanguageDownloaded('Spanish');
  //     console.log('TRANSLATE AVAILABLE!!!!', isAvailable);
  //     if (isAvailable) {
  //       try {
  //         let text = "This is a test";
  //         console.log('TRANSLATING!!!!', text);
  //         const translatedText = await FastTranslator.translate(text);
  //         console.log('TRANSLATED!!!!', translatedText);
  //       } catch (e) {
  //         console.log('TRANSLATE ERROR!!!!', e);
  //       }
  //     }
  //   }
  //   test();
  // }, []);

  // useEffect(() => {
  //   if (isFocused) {
  //     console.log('reset home trip');
  //     store.trip.reset();
  //   }
  // }, [isFocused]);

  // useFocusEffect(
  //   React.useCallback(() => {
  //     store.mapManager.reset();
  //     return () => {
  //       store.mapManager.reset();
  //     };
  //   }, []),
  // );

  // useFocusEffect(
  //   React.useCallback(() => {
  //     return () => {
  //       console.log('reset maps');
  //       if (store.mapManager.map) {
  //         store.mapManager.reset();
  //       }
  //     };
  //   }, []),
  // );

  // INITIALIZE AND CLEANUP
  useEffect(() => {
    if (store.preferences.navigationDirections && store.preferences.navigationDirections === 'voiceOff') {
      voice.setVolume(0);
    }
    else {
      voice.setVolume(1);
    }
  }, [])

  const geolocationWatchRef = useRef();
  const netInfoWatchRef = useRef();
  useFocusEffect(
    useCallback(() => {
      console.log('HOME subscribing to geolocation and netinfo');
      geolocationWatchRef.current = geolocation.subscribe(handleGeolocationUpdate);
      netInfoWatchRef.current = addEventListener(handleNetInfoStateChange);
      return () => {
        console.log('HOME unsubscribing from geolocation and netinfo');
        geolocationWatchRef.current && geolocationWatchRef.current.cancel();
        netInfoWatchRef.current && netInfoWatchRef.current();
      };
    }, [])
  );

  const handleGeolocationUpdate = useCallback((position, heading, speed) => {
    setCurrentLocation({ position, heading, speed });
    console.log('HOME geolocation update', geolocation.accuracy);
    if (config.SHOW_GPS_WARNING_ON_HOME) {
      setShowBadGps((prevShowBadGps) => {
        if (geolocation.accuracy === 2 && !prevShowBadGps) {
          setShowBadGpsMessage(true);
          return true;
        } else if (geolocation.accuracy === 1 && prevShowBadGps) {
          setShowBadGpsMessage(false);
          return false;
        }
        return prevShowBadGps;
      });
    }
  }, [geolocation.accuracy]);

  useEffect(() => {
    if (showBadGps) {
      voice.speak(translator.t('views.home.gpsWarning'));
    }
  }, [showBadGps]);

  const handleNetInfoStateChange = useCallback((state) => {
    const isOnline = state.isConnected || state.isInternetReachable;
    if (!isOnline && !showBadSignal) {
      setShowBadSignal(true);
    }
    else if (isOnline && showBadSignal) {
      setShowBadSignal(false);
    }
  }, [showBadSignal]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', (e) => {
      console.log('reset home trip');
      store.trip.reset();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', (e) => {
      console.log('unload map');
      store.mapManager.reset();
    });

    return unsubscribe;
  }, [navigation]);

  // MAP VIEW INITIALIZATION
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
    if (!store.mapManager.map && store.mapManager.currentMap === 'home') {
      console.log('got home ref');
      store.mapManager.setMap(ref);
    }
  };

  const handleMapStyleLoaded = () => {
    if (!styleReady) {
      setStyleReady(true);
      store.mapManager.addLayers();
      console.log('The map style has finished loading.');
    }
  };

  useEffect(() => {
    const center = LocationData.BuffaloCenter,
      coordinates = center.features[0].geometry.coordinates;
    const bbx = bbox(buffer(center, 1.60934));
    setMapReferencePoint({ lng: coordinates[0], lat: coordinates[1] });
    if (store.mapManager.map) {
      store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);
    }
  }, []);

  // MAP INTERACTION
  useEffect(() => {
    if (mapReferencePoint.lng && mapReferencePoint.lat) {
      getAddress(mapReferencePoint);
    }
  }, [mapReferencePoint]);

  const getAddress = (point) => {
    geocoder.reverse({ lng: point.lng, lat: point.lat })
      .then(result => {
        let address = result.length ? result[0] : undefined;
        if (address && !address.alias) {
          let txt = address.title;
          if (address.description) {
            txt += `, ${address.description}`;
          }
          address.text = txt;
        }
        setReverseAddress(address);
      })
      .catch(e => {
        console.log('error reverse geocoding', e);
      });
  };

  useEffect(() => {
    if (mapPanState === 'end') {
      if (mapCenter.length > 0) {
        let fc = { ...pointClone };
        fc.features[0].geometry.coordinates = [mapCenter[1], mapCenter[0]];
        store.mapManager.updateLayer('mapCenterPoint', fc);
        setMapReferencePoint({ lng: mapCenter[1], lat: mapCenter[0] });
      }
    }
  }, [mapPanState]);

  const handleFollowUserPress = () => {
    if (locationEnabled && currentLocation?.position) {
      setUseMapCenter(false);
      let fc = { ...pointClone };
      fc.features[0].geometry.coordinates = [0, 0];
      store.mapManager.updateLayer('mapCenterPoint', fc);
      const coords = [currentLocation.position.lng, currentLocation.position.lat];
      fc.features[0].geometry.coordinates = coords;
      if (booleanContains(LocationData.NftaServiceArea.features[0], fc.features[0])) {
        console.log('location ENABLED - user IS in ntfa service area');
        setMapReferencePoint(currentLocation.position);
        const bbx = bbox(buffer(fc, 1.60934));
        store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);
      }
      else {
        console.log('location ENABLED, user IS NOT in ntfa service area');
        const center = LocationData.BuffaloCenter,
          coordinates = center.features[0].geometry.coordinates;
        const bbx = bbox(buffer(center, 1.60934));
        setMapReferencePoint({ lng: coordinates[0], lat: coordinates[1] });
        store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);
      }
    }
  };

  const handleMapCenterChange = (latLng) => {
    setMapCenter([
      latLng[1] > 0 ? latLng[1] : latLng[0],
      latLng[1] > 0 ? latLng[0] : latLng[1],
    ]);
  };

  const handleMapPan = (e) => {
    setUseMapCenter(true);
    setMapPanState(e.state);
  };

  // GEOLOCATION
  useEffect(() => {
    console.log('location enabled changed to', locationEnabled);
  }, [locationEnabled]);

  /* if location enabled
      if in buffalo
        pan to location
        update map reference point
      if not in buffalo
        pan to buffalo center
        update map referecne point
    if not sharing location
      pan to buffalo center
      update map reference point
  */
  useEffect(() => {
    if (firstLocation) {
      console.log('first location');
      let fc = { ...pointClone };
      const coords = [currentLocation?.position.lng, currentLocation?.position.lat];
      fc.features[0].geometry.coordinates = coords;
      if (booleanContains(LocationData.NftaServiceArea.features[0], fc.features[0])) {
        console.log('location ENABLED - user IS in ntfa service area');
        setMapReferencePoint(currentLocation?.position);
        const bbx = bbox(buffer(fc, 1.60934));
        store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);
      }
      else {
        console.log('location ENABLED, user IS NOT in ntfa service area');
        const center = LocationData.BuffaloCenter,
          coordinates = center.features[0].geometry.coordinates;
        const bbx = bbox(buffer(center, 1.60934));
        setMapReferencePoint({ lng: coordinates[0], lat: coordinates[1] });
        store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);
      }
    }
  }, [firstLocation]);

  useEffect(() => {
    console.log('store.mapManager.currentMap', store.mapManager.currentMap);
    if (locationEnabled && currentLocation?.position && store.mapManager.currentMap === 'home') {
      if (!firstLocation) {
        setFirstLocation(currentLocation);
      }
      console.log('UPDATE USER LOCATION');
      store.mapManager.updateUserLocation(currentLocation.position.lng, currentLocation.position.lat);
    }
  }, [currentLocation, locationEnabled, mapCenter]);

  // SERVICE VIEWER
  const handleServiceRefresh = (service) => {
    updateLiveVehiclesOnMap(service);
  };

  const updateLiveVehiclesOnMap = (service) => {
    console.log('updated vehicles', service?.vehicles?.length);
    let fc = {
      type: 'FeatureCollection',
      features: [],
    };
    const vehicles = service.vehicles;
    if (vehicles && vehicles.length > 0) {
      for (let i = 0; i < vehicles.length; i++) {
        let vehicle = vehicles[i];
        fc.features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: vehicle.coordinates,
          },
        });
      }
    }
    store.mapManager.updateLayer('bus-live', fc);
  };

  const handleServiceSelected = (service, feed) => {
    if (service.service && service.route) {
      updateRouteOnMap(feed);
      updateStopsOnMap(feed);
      updateLiveVehiclesOnMap(feed);
    }
    if (service.service && service.mode === 'shuttle') {
      updateShuttleRegionOnMap(service);
    }
  };

  const updateRouteOnMap = (route) => {
    let fc = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          lineColor: `#${route.color || '000000'}`,
          lineWidth: 4,
          lineOpacity: 1,
          lineJoin: 'round',
        },
        geometry: route.geometry,
      }],
    };
    store.mapManager.updateLayer('selectedBusRoute', fc);
    // const bbx = bbox(fc);
    const bbx = bbox(buffer(fc, 1.60934));
    store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);
  };

  const updateStopsOnMap = (service) => {
    let fc = {
      type: 'FeatureCollection',
      features: [],
    };
    for (var i = 0; i < service.stops.length; i++) {
      const stop = service.stops[i];
      fc.features.push({
        type: 'Feature',
        properties: {
          circleColor: '#ffffff',
          circleRadius: 4,
          circleStrokeColor: `#${service.color || '000000'}`,
          circleStrokeWidth: 4,
          id: stop.stopId,
          name: stop.name,
        },
        geometry: stop.geometry,
      });
    }
    store.mapManager.updateLayer('selectedBusStops', fc);
  };

  const updateShuttleRegionOnMap = (service) => {
    if (service.name === 'NFTA Community Shuttle') {
      let fc = { ...LocationData.NftaCommunityShuttle };
      fc.features[0].properties.lineColor = `#${service?.color || '000000'}`;
      store.mapManager.updateLayer('shuttleServiceArea', fc);
    }
  };

  const handleStopPress = (stop) => {
    if (stop && stop.geometry) {
      let fc = {
        'type': 'FeatureCollection',
        'features': [{
          type: 'Feature',
          geometry: stop.geometry,
        }],
      };
      const bbx = bbox(buffer(fc, 0.0804672));
      store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);
    }
  };

  const handleHailPress = (service) => {
    // TODO collect driver id
    // if (reverseAddress) {
    let coords = [reverseAddress?.point.lng, reverseAddress?.point.lat];
    if (currentLocation && currentLocation.position) {
      coords = [currentLocation.position.lng, currentLocation.position.lat];
    }
    geocoder.reverse({ lng: coords[0], lat: coords[1] })
      .then(result => {
        let address = result.length ? result[0] : undefined;
        if (address && !address.alias) {
          let txt = address.title;
          if (address.description) {
            txt += `, ${address.description}`;
          }
          address.text = txt;
        }
        console.log('HAIL TO :', address);
        store.trip.create();
        store.schedule.selectTrip(null);
        store.trip.addMode('hail');
        store.trip.addMode('walk');
        store.trip.updateOrigin(address);
        store.hail.setService(service);
        store.mapManager.setCurrentIndoorMap('hail');
        navigation.push('schedule.hail');
      })
      .catch(e => {
        console.log('error reverse geocoding', e);
      });
    // }
  };

  const handleBackPress = () => {
    let fc = {
      'type': 'FeatureCollection',
      'features': [],
    };
    store.mapManager.updateLayer('selectedBusRoute', fc);
    store.mapManager.updateLayer('selectedBusStops', fc);
    store.mapManager.updateLayer('bus-live', fc);
    store.mapManager.updateLayer('track-live', fc);
    store.mapManager.updateLayer('shuttleServiceArea', fc);

    fc = { ...pointClone };
    const coords = [mapReferencePoint.lng, mapReferencePoint.lat];
    fc.features[0].geometry.coordinates = coords;
    const bbx = bbox(buffer(fc, 1.60934));
    store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);
    console.log('back button', mapReferencePoint);
  };

  // NOTIFICATIONS
  useEffect(() => {
    if (hasCheckedNotificationPermissions && store.authentication.loggedIn) {
      checkNotificationsPermissions(async deviceToken => {
        const accessToken = await store.authentication.fetchAccessToken();
        store.profile.updateProperty('deviceId', deviceToken);
        await registerDevice(deviceToken, accessToken);
      });
      setHasCheckedNotificationPermissions(true);
    }
  }, [hasCheckedNotificationPermissions]);

  useEffect(() => {
    return messaging().onMessage(onMessageReceived);
  }, []);

  useEffect(() => {
    // Notifications event handlers and its subscriptions.
    const unsubscribe = notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.DISMISSED) {
        console.log('User dismissed a notification', detail.notification);
      } else if (type === EventType.PRESS) {
        console.log('User pressed a notification', detail.notification);
      } else if (type === EventType.ACTION_PRESS) {
        console.log(
          'User pressed an action on a notification',
          detail.notification,
          detail.pressAction,
        );
      } else if (type === EventType.DELIVERED) {
        console.log('User delivered a notification', detail.notification);
      } else if (type === EventType.DRAWER_CLOSED) {
        console.log('User closed the notification drawer');
      } else if (type === EventType.DRAWER_OPENED) {
        console.log('User opened the notification drawer');
      } else if (type === EventType.TRIGGER_NOTIFICATION) {
        console.log('User triggered a notification', detail.notification);
      }
    });

    return unsubscribe;
  }, []);

  // Subscribe to events
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log('User dismissed notification', detail.notification);
          break;
        case EventType.PRESS:
          console.log('User pressed notification', detail.notification);
          break;
      }
    });

    return unsubscribe;
  }, []);

  // FEEDBACK
  const handleFeedbackSubmitPress = async () => {
    let ratings = config.FEEDBACK.stars.reduce((obj, item, i) => Object.assign(obj, { [item]: feedbackValues[i] }), {});
    const accessToken = await store.authentication.fetchAccessToken();
    feedback.add(feedbackComment, 'afterTrip', null, null, null, ratings, store.display.feedbackTrip, accessToken);
    setFeedbackComment('');
    setFeedbackValues([0, 0, 0]);
    store.display.hideFeedback();
    setShowFeedback(false);
  }

  // OVERRIDDEN STYLES
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then((screenReaderEnabled) => {
        setScreenReaderOn(screenReaderEnabled);
      });
  }, []);

  const handleDropdownOnLayout = (e) => {
    if (currentDropDownHeight !== e.nativeEvent.layout.height) {
      setCurrentDropdownHeight(e.nativeEvent.layout.height);
    }
  };

  const headerStyle = () => {
    return {
      ...styles.header,
      height: styles.header.height + insets.top + ADDITIONAL_ANDROID_PADDING,
      paddingTop: insets.top + ADDITIONAL_ANDROID_PADDING,
      shadowOpacity: screenReaderOn ? 0 : 0.25,
    };
  };

  const mapContainerStyle = () => {
    return {
      ...styles.mapContainer,
      top: styles.header.height + insets.top + ADDITIONAL_ANDROID_PADDING,
    };
  };

  const mapStyle = () => {
    return {
      height: screenReaderOn ? '0%' : '100%',
    };
  };

  const servicesContainerStyle = () => {
    const top =
      screenReaderOn ?
        styles.header.height + insets.top + 38 :
        styles.header.height + insets.top + styles.mapContainer.height;
    return {
      ...styles.servicesContainer,
      top: top + ADDITIONAL_ANDROID_PADDING,
      bottom: styles.footer.bottom + insets.bottom + 45 + ADDITIONAL_ANDROID_PADDING,
      shadowOpacity: screenReaderOn ? 0 : 0.25,
    };
  };

  const footerStyle = () => {
    return {
      ...styles.footer,
      bottom: styles.footer.bottom + insets.bottom,
    };
  };

  const dropdownStyle = () => {
    return {
      ...styles.dropdown,
      bottom: -currentDropDownHeight / 2,
    };
  };

  return (

    <>

      <View style={styles.container}>

        <View style={mapContainerStyle()}>

          {locationEnabled &&
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleFollowUserPress}
              accessibilityLabel={translator.t('views.home.followUser')}
              accessibilityLanguage={store.preferences.language || 'en'}
            >
              <FontAwesomeIcon
                icon="location-arrow"
                size={24 * deviceMultiplier}
                color={!useMapCenter ? Colors.primary1 : Colors.medium}
              />
            </TouchableOpacity>
          }

          {showBadGps &&
            <TouchableOpacity
              style={styles.accuracyButton}
              onPress={() => {
                setShowBadGpsMessage(!showBadGpsMessage);
              }}
              accessibilityLabel={translator.t('views.home.followUser')}
              accessibilityLanguage={store.preferences.language || 'en'}
            >
              {!showBadGpsMessage &&
                <FontAwesomeIcon
                  icon="triangle-exclamation"
                  size={24 * deviceMultiplier}
                  color={Colors.danger}
                />
              }
              {showBadGpsMessage &&
                <FontAwesomeIcon
                  icon="xmark"
                  style={{
                    marginTop: 4
                  }}
                  size={24 * deviceMultiplier}
                  color={Colors.danger}
                />
              }
            </TouchableOpacity>
          }

          {showBadGps && showBadGpsMessage &&
            <View
              style={styles.accuracyMessage}
            >
              <Text
                style={{
                  ...Typography.h4,
                  color: Colors.danger,
                }}
              >{translator.t('views.home.gpsWarning')}</Text>
            </View>
          }

          {showBadSignal && (
            <View style={styles.badSignalContainer}>
              <FontAwesomeIcon
                style={styles.badSignalBars}
                icon={faSignal}
                size={24}
                color={Colors.primary1}
              />
              <Svg width={30} height={30} viewBox='0 0 40 32'>
                <Path fill={Colors.danger} stroke={Colors.danger} strokeWidth={2} d='M 0.31347466,0.56972016C 0.82596566,-0.08026842 1.7696991,-0.19901633 2.4196877,0.31347466L 39.419038,29.312965c 0.649988,0.512491 0.768736,1.456225 0.256245,2.106213 -0.512491,0.649989 -1.456224,0.768737 -2.106213,0.256246L 0.56972016,2.6759332C -0.08026842,2.1634422 -0.19901633,1.2197087 0.31347466,0.56972016Z' />
              </Svg>
            </View>
          )}

          <View
            style={mapStyle()}
            accessible={false}
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
                  onMapStyleLoaded={handleMapStyleLoaded}
                  onMapCenterChange={handleMapCenterChange}
                  onPan={handleMapPan}
                />
              )}
          </View>

        </View>

        <View style={servicesContainerStyle()}>
          <ServiceViewer
            authenticated={store.authentication.loggedIn}
            location={mapReferencePoint}
            onServiceSelected={handleServiceSelected}
            onSelectedServiceRefresh={handleServiceRefresh}
            onBackPress={handleBackPress}
            onStopPress={handleStopPress}
            onHailPress={handleHailPress}
          />
        </View>

        <View
          style={headerStyle()}
        >

          <Text
            style={styles.title}
            maxFontSizeMultiplier={1}
            accessibilityLabel={`${translator.t('views.home.greeting')} ${store.authentication.loggedIn ? store?.profile?.firstName : translator.t('views.home.guestGreeting')}`}
            accessibilityLanguage={store.preferences.language || 'en'}
          >
            <Text
              style={styles.titleGreeting}
            >{translator.t('views.home.greeting')}{' '}</Text>
            {store.authentication.loggedIn &&
              <Text style={{ fontWeight: 'bold' }}>{store?.profile?.firstName}</Text>
            }
            {!store.authentication.loggedIn &&
              <Text>{translator.t('views.home.greetingGuest')}</Text>
            }
          </Text>

          <View style={dropdownStyle()}>
            <ScheduleTripDropdown
              onLayout={handleDropdownOnLayout}
              loggedIn={store.authentication.loggedIn}
              favoriteTrips={store.favorites.trips}
              onScheduleTripPress={() => {
                store.mapManager.setCurrentMap('results');
                navigation.push('schedule.plan');
              }}
              onFavoriteTripPress={(trip) => {
                store.trip.create();
                store.trip.setRequest(trip);
                store.schedule.selectTrip(null);
                store.mapManager.setCurrentMap('results');
                navigation.push('schedule.plan');
              }}
            />
          </View>

        </View>

        <View style={footerStyle()}>
          <BottomMenu
            navigation={navigation}
            loggedIn={store.authentication.loggedIn}
          />
        </View>

      </View>

      <Modal
        show={showFeedback}
        height={isTablet() ? 510 : 600}
      >
        <Text
          style={styles.modalTitle}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{translator.t('views.home.feedback.modalTitle')}</Text>
        <Text
          style={styles.modalSubTitle}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{translator.t('views.home.feedback.modalSubTitle')}</Text>
        <View>
          <ScrollView
            keyboardShouldPersistTaps="always"
          >
            <View
              style={styles.modalContainer}
            >

              {config.FEEDBACK.stars.map((s, i) => {
                return (
                  <View
                    key={i}
                    style={styles.feedbackRow}
                  >
                    <Text
                      style={styles.feedbackRowText}
                    >{translator.t(`views.account.feedback.stars.${s}`)}</Text>
                    <RateStar
                      fontSize={24}
                      rating={feedbackValues[i]}
                      onRatingChange={(value) => {
                        const nextFeedbackValues = feedbackValues.map((f, j) => {
                          if (j === i) {
                            return value;
                          } else {
                            return f;
                          }
                        });
                        setFeedbackValues(nextFeedbackValues);
                      }}
                    />
                  </View>
                )
              })}

              <TextInput
                style={styles.input}
                placeholder={translator.t('views.account.feedback.inputPlaceholder')}
                multiline
                numberOfLines={10}
                value={feedbackComment}
                onChangeText={(text) => setFeedbackComment(text)}
              />

              <Button
                label={translator.t('global.submitLabel')}
                width={250}
                buttonStyle={{
                  marginTop: 30
                }}
                onPress={handleFeedbackSubmitPress}
              />
              <Button
                label={translator.t('global.cancelLabel')}
                width={250}
                buttonStyle={{
                  backgroundColor: Colors.white,
                  borderColor: Colors.white,
                }}
                labelStyle={{
                  color: Colors.primary1,
                }}
                onPress={() => {
                  store.display.hideFeedback();
                  setShowFeedback(false);
                }}
              />

            </View>
          </ScrollView>
        </View>

      </Modal>

    </>
  );
});

Home.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default Home;
