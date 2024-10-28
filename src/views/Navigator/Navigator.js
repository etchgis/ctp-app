/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  InteractionManager,
  NativeModules,
  StyleSheet, useColorScheme, View,
  Alert,
  TouchableOpacity,
  Text,
  AccessibilityInfo,
} from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import SlidingUpPanel from 'rn-sliding-up-panel';
import { Colors, Devices, Typography } from '../../styles';
import { useStore } from '../../stores/RootStore';
import VerticalPlanSchedule from '../../components/VerticalPlanSchedule';
import { useIsFirstRender } from '../../utils/isFirstRender';
import config from '../../config';
import Map from '../../components/Map';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import buffer from '@turf/buffer';
import pointsWithinPolygon from '@turf/points-within-polygon';
import lineSlice from '@turf/line-slice';
import length from '@turf/length';
import navigator from '../../services/navigator';
import simulator from '../../services/simulator';
import voice from '../../services/voice';
import Banner from '../../components/Banner';
import Button from '../../components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { geolocation, useLocationEnabled } from '../../models/geolocation';
import { geocoder, rides } from '../../services/transport';
import { notifications } from '../../services/transport';
import { toGeoJSON } from '../../utils/polyline';
import { JMapView } from 'react-native-ctp-odp';
import TripPlan from '../../models/trip-plan';
import rerouter from '../../services/rerouter';
import { mobility } from '@etchgis/mobility-transport-layer';
import { generateNotification } from '../../utils/notifications';
import translator from '../../models/translator';

import Slider from '@react-native-community/slider';
import moment from 'moment';
import LocationData from '../../models/location-data';
import booleanIntersects from '@turf/boolean-intersects';
import crosswalk from '../../services/transport/crosswalk';
import { OdpContext } from '../../models/odp-context';
import lineIntersect from '@turf/line-intersect';
import { addEventListener } from "@react-native-community/netinfo";
import { deviceMultiplier } from '../../styles/devices';

const MapboxGL = { ...NativeModules.Mapbox };
let _mapboxReady = false;
MapboxGL.setAccessToken(config.MAP.MAPBOX_TOKEN).then(() => {
  _mapboxReady = true;
});

const VERTICAL_TRIP_PLAN_OFFSET = 108;
const LATE_BUS_TOLERANCE_MS = 5 * 60 * 1000;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary3,
  },
  mapContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
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
  locationButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    paddingTop: 2,
    paddingRight: 2,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
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
    top: 60,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
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
    top: 60,
    right: 10,
    left: 10,
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
  indoorButton: {
    position: 'absolute',
    bottom: 40,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  hailButton: {
    position: 'absolute',
    bottom: 100,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  hailContent: {
    position: 'absolute',
    // bottom: 20,
    alignSelf: 'center',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10000,
  },
  modal: {
    position: 'absolute',
    top: 10,
    right: 70,
    left: 70,
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 10,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  closeModalButton: {
    position: 'absolute',
    top: -6,
    right: -6,
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

const Navigator = observer(({
  navigation,
}) => {

  console.log('NAVIGATOR: render', Date.now());

  const store = useStore();
  const isFirstRender = useIsFirstRender();
  const colorScheme = useColorScheme();
  // const gl = useGeolocation();
  // const [currentLocation, setCurrentLocation] = useState(null);
  const locationEnabled = useLocationEnabled();
  const isFocused = useIsFocused();

  const [mapReady, setMapReady] = useState(false);
  const [mapboxReady, setMapboxReady] = useState(_mapboxReady);
  const [styleReady, setStyleReady] = useState(false);
  const [navigationReady, setNavigationReady] = useState(false);
  const [allowDragging, setAllowDragging] = useState(true);

  const [legIndex, setLegIndex] = useState(0);
  const [tripStatus, setTripStatus] = useState('started');
  const [tripProgress, setTripProgress] = useState(null);
  const [tripLegRemaining, setTripLegRemaining] = useState(null);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [rerouting, setRerouting] = useState(false);
  const [vehicleUpdates, setVehicleUpdates] = useState([]);
  const [offerNewTrip, setOfferNewTrip] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [closeToSummon, setCloseToSummon] = useState(true);
  const [hasHail, setHasHail] = useState(false);
  const [showHail, setShowHail] = useState(false);
  const [summonedRide, setSummonedRide] = useState(store.hail.ride);
  const [followMode, setFollowMode] = useState('user');
  const [indoorLocation, setIndoorLocation] = useState(null);
  // const [useOdp, setUseOdp] = useState(false);
  const [updateVenue, setUpdateVenue] = useState(false);
  const [showBadSignal, setShowBadSignal] = useState(false);

  const didInitialZooms = useRef(0);
  const zoomedAtTime = useRef(0);
  // voice.setVolume(voiceVolume);

  const tripUpdatesRef = useRef({ currentLegIndex: 0, transit: [] });
  const tripProgressRef = useRef();

  const intervalRef = useRef();

  const [inCrosswalk, setInCrosswalk] = useState(false);
  const [crosswalkPressed, setCrosswalkPressed] = useState(false);
  const crosswalksRef = useRef([]);
  const inCrosswalkRef = useRef(false);
  const crosswalkPressedRef = useRef(false);
  const crosswalkIntervalRef = useRef();

  const _panel = useRef();
  const _slidingUpPanelValue = useRef(new Animated.Value(0)).current;
  const [hailContainerBottom, setHailContainerBottom] = useState(20);

  const mounted = useRef(false);

  const insets = useSafeAreaInsets();

  let ws = React.useRef(new WebSocket(`wss://ce9siadbi5.execute-api.us-east-2.amazonaws.com/staging?groups=dependent-${store.authentication.user?.id}`)).current;

  const [indoorDestinations, setIndoorDestinations] = useState([]);
  const [venueLoaded, setVenueLoaded] = useState(false);
  const [hasIndoor, setHasIndoor] = useState(false);
  const [showIndoor, setShowIndoor] = useState(false);
  const [inGeofence, setInGeofence] = useState(false);
  const [showIndoorMessage, setShowIndoorMessage] = useState(false);
  const [showOutdoorMessage, setShowOutdoorMessage] = useState(false);
  const [startsOutdoor, setStartsOutdoor] = useState(true);
  const indoorMapRef = useRef(null);
  // const indoorModuleMapRef = useRef(null);
  const [venues, setVenues] = useState([]);
  const [indoorReady, setIndoorReady] = useState(false);

  const [showBadGps, setShowBadGps] = useState(geolocation.accuracy === 2);
  const [showBadGpsMessage, setShowBadGpsMessage] = useState(geolocation.accuracy === 2);

  // const [isUnloading, setIsUnloading] = useState(false);

  const geolocationWatchRef = useRef();
  const navWatchRef = useRef();
  const navCrosswalkRef = useRef();
  const navRouteWatchRef = useRef();
  const rerouteWatchRef = useRef();

  const [screenReaderOn, setScreenReaderOn] = useState(false);

  const { addNavigationUpdateListener, removeNavigationUpdateListener } = useContext(OdpContext);

  useEffect(() => {
    // Subscribe to the navigation update event
    addNavigationUpdateListener(handleOdpNavigationUpdate);

    // Unsubscribe when component unmounts
    return () => {
      removeNavigationUpdateListener(handleOdpNavigationUpdate);
    };
  }, []);

  // BEGIN INIITIALIZE
  const netInfoWatchRef = useRef();
  useFocusEffect(
    useCallback(() => {
      netInfoWatchRef.current = addEventListener(handleNetInfoStateChange);
      return () => {
        netInfoWatchRef.current && netInfoWatchRef.current();
      };
    }, [])
  );

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
    AccessibilityInfo.isScreenReaderEnabled()
      .then((screenReaderEnabled) => {
        setScreenReaderOn(screenReaderEnabled);
        if (screenReaderEnabled) {
          setAllowDragging(false);
          InteractionManager.runAfterInteractions(() => {
            _panel.current && _panel.current.show({ toValue: getDraggableRange().top - 230, velocity: 1000 });
          });
        }
      });
  }, []);
  // END INIITIALIZE

  // BEGIN SLIDING PANEL, VERTICAL PLAN SCHEDULE
  useEffect(() => {
    _slidingUpPanelValue.addListener(onAnimatedValueChange);

    return () => {
      _slidingUpPanelValue.removeAllListeners();
    };
  }, []);

  const onAnimatedValueChange = useCallback((e) => {
    setHailContainerBottom(e.value - VERTICAL_TRIP_PLAN_OFFSET);
  }, []);

  const onPlanScroll = (isScrolling) => {
    // if (!screenReaderOn) {
    setAllowDragging(!isScrolling);
    // }
  };

  const getDraggableRange = () => {
    const top = Devices.screen.height - insets.top,
      bottom = VERTICAL_TRIP_PLAN_OFFSET;
    return {
      top,
      bottom,
    };
  };

  const getSnappingPoints = () => {
    return [
      Devices.screen.height / 2,
      VERTICAL_TRIP_PLAN_OFFSET,
    ];
  };
  // END SLIDING PANEL, VERTICAL PLAN SCHEDULE

  // BEGIN WEBSOCKET
  useEffect(() => {
    // if (isFirstRender) {
    _panel.current.show(VERTICAL_TRIP_PLAN_OFFSET);

    console.log(ws.url);

    ws.onopen = () => {
      console.log('Connected to the server', ws.url);
    };
    ws.onclose = (e) => {
      console.log('Disconnected. Check internet or server.', e);
    };
    ws.onerror = (e) => {
      console.log(e.message);
    };
    ws.onmessage = (e) => {
      console.log(e.data);
    };
    if (store.schedule?.selectedTrip) {
      sendNotification('dependentDepart', store.schedule?.selectedTrip?.id, 'none', 'none');
    }
    // }
    mounted.current = true;
    return () => {
      mounted.current = false;

      if (store.schedule.selectedTrip && ws.readyState === WebSocket.OPEN) {
        const payload = {
          group: `dependent-${store.authentication.user?.id}`,
          tripId: store.schedule?.selectedTrip?.id,
          navigating: false,
        };
        ws.send(JSON.stringify(payload));
        setTimeout(() => {
          ws.close();
        }, 1000);
      }
      else {
        ws.close();
      }
      if (simulator.isRunning) {
        simulator.stop();
      }
      navigator.stop();
      store.schedule.reset();
    };
  }, []);
  // END WEBSOCKET

  // BEGIN NAVIGATION
  useEffect(() => {
    console.log('NAVIGATOR subscribing to geolocation ');
    geolocationWatchRef.current = geolocation.subscribe(handleGeolocationUpdate);
    navWatchRef.current = navigator.subscribe(handleNavigationProgress);
    navCrosswalkRef.current = navigator.subscribe(handleCrosswalkUpdate);
    navRouteWatchRef.current = navigator.onRouteChanged(handleRouteUpdate);
    rerouteWatchRef.current = rerouter.subscribe(handleRerouteUpdate);

    if (store.preferences.navigationDirections && store.preferences.navigationDirections === 'voiceOff') {
      voice.setVolume(0);
    }
    else {
      voice.setVolume(1);
    }

    if (store.trip.selectedPlan && store.trip.selectedPlan.legs) {
      const hailLegs = store.trip.selectedPlan.legs.filter(l => l.mode === 'HAIL');
      if (hailLegs.length > 0) {
        setHasHail(true);
      }
    }

    return () => {
      console.log('NAVIGATOR unsubscribing from geolocation');
      geolocationWatchRef.current && geolocationWatchRef.current.cancel();
      navWatchRef.current && navWatchRef.current.cancel();
      navCrosswalkRef.current && navCrosswalkRef.current.cancel();
      navRouteWatchRef.current && navRouteWatchRef.current.cancel();
      rerouteWatchRef.current && rerouteWatchRef.current.cancel();
    };
  }, []);

  const handleGeolocationUpdate = useCallback(() => {
    // console.log('NAVIGATOR geolocation update', geolocation.accuracy);
    const timeInNavigation = navigator.isRunning() ? Date.now() - navigator.startTime : 0;
    if (timeInNavigation >= config.POOR_ACCURACY_DELAY_MS) {
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
      voice.speak(translator.t('views.home.gpsWarning'), true);
    }
  }, [showBadGps]);

  useEffect(() => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        //query live vehicles here
        const currLegIndex = legIndex;
        let services = getTripServices();
        let activeServices = services.filter(s => s.legIndex >= currLegIndex);
        let promises = [];
        for (let i = 0; i < activeServices.length; i++) {
          const service = activeServices[i];
          // console.log('GETTING VEHICLES', service);
          promises.push(mobility.skids.trips.get(service.serviceId, service.tripId, 'COMPLETE_TRIP'));
        }
        Promise.allSettled(promises)
          .then(results => {
            let vehicles = [];
            // console.log('RESULTS', results[0].value.vehicles);
            for (let i = 0; i < results.length; i++) {
              if (results[i].status === 'fulfilled') {
                const vs = results[i].value.vehicles;
                const service = activeServices[i];
                for (let j = 0; j < vs.length; j++) {
                  const v = vs[j];
                  v.mode = service.mode;
                  v.userLegIndex = service.legIndex;
                }
                vehicles.push(...vs);
              }
            }
            // TODO: check existing before setting
            updateLiveVehiclesOnMap(vehicles);
            setVehicleUpdates(vehicles);
          })
          .catch(e => {
            console.log('interval', e);
          });
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const updateLiveVehiclesOnMap = (vehicles) => {
    let fc = {
      type: 'FeatureCollection',
      features: [],
    };
    let routeFc = {
      type: 'FeatureCollection',
      features: [],
    };
    if (vehicles && vehicles.length > 0) {
      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        const coordinates = vehicle.location ? vehicle.location.coordinates : vehicle.coordinates;
        fc.features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates,
          },
        });
        if (vehicle.route?.legs) {
          const leg = vehicle.route.legs[vehicle.legIndex];
          if (leg?.polyline) {
            const geometry = toGeoJSON(leg.polyline);
            routeFc.features.push({
              type: 'Feature',
              geometry: geometry,
              properties: {
                lineColor: '#4444ff',
                lineOpacity: 1,
                lineWidth: 4,
                lineJoin: 'round',
              },
            });
          }
        }
      }
    }
    store.mapManager.updateLayer('bus-live', fc);
    store.mapManager.updateLayer('track-live', routeFc);
  };

  const getTripServices = () => {
    let services = [];
    if (store.trip.selectedPlan && store.trip.selectedPlan.legs) {
      for (let i = 0; i < store.trip.selectedPlan.legs.length; i++) {
        const leg = store.trip.selectedPlan.legs[i];
        // TODO: why doesn't this carry over from the trip plan?
        if (leg.mode === 'HAIL') {
          leg.tripId = 'HDS:A1';
        }
        if ((leg.mode === 'BUS' || leg.mode === 'HAIL') && leg.tripId) {
          let service = config.SERVICE_IDS.find(s => s.agency === leg.agencyName && s.mode === leg.mode);
          if (service) {
            let trip = leg.tripId,
              tripId = trip.split(':')[1];
            services.push({
              serviceId: service.serviceId,
              tripId: tripId,
              mode: leg.mode,
              legIndex: i,
            });
          }
        }
      }
    }
    return services;
  };

  const handleRerouteUpdate = useCallback((isRerouting) => {
    setRerouting(isRerouting);
  }, []);

  const handleOdpNavigationUpdate = useCallback((e) => {
    if (indoorMapRef.current) {
      indoorMapRef.current.setUserPosition(e.lat, e.long, e.bearing, 100);
    }
  }, [indoorLocation]);

  const handleNavigationProgress = useCallback((progress) => {
    // const tripPlan = store.trip.selectedPlan;
    const tripPlan = navigator.getTripPlan();
    if (progress && tripPlan) {
      tripProgressRef.current = progress;
      if (Number.isInteger(progress?.legIndex) && progress?.legIndex !== legIndex) {
        setLegIndex(progress?.legIndex);
      }
      let updates = {
        transit: [],
        currentLegIndex: legIndex
      };
      let triggerUpdate = false;
      for (let i = 0; i < tripPlan.legs.length; i++) {
        const leg = tripPlan.legs[i];
        if (leg.mode === 'BUS' || leg.mode === 'TRAM') {
          const now = moment().valueOf();

          // mobility.skids.trips.get()
          let busArriveTime = leg.startTime,
            atRisk = now > busArriveTime - LATE_BUS_TOLERANCE_MS;

          const busTimeRemaining = busArriveTime - now;
          let userTimeRemaining = busArriveTime - tripPlan.startTime;
          if (progress) {
            userTimeRemaining = progress.legDurationRemaining * 1000;
          }
          let secsBehindBus = Math.floor((userTimeRemaining - busTimeRemaining) / 1000);
          if (secsBehindBus > 30) {
            atRisk = true;
          }
          updates.transit.push({
            legIndex: i,
            atRisk
          });
        }
      }

      const foundAtRisk = updates.transit.find(t => t.atRisk);
      // console.log('foundAtRisk', updates);
      if (foundAtRisk) {
        triggerUpdate = true;
      }

      // console.log(JSON.stringify(updates));

      // console.log('TRIP', tripLegRemaining, progress?.legDurationRemaining);
      // if (tripLegRemaining === null && progress?.legDurationRemaining) {
      //   console.log('SET TRIP REMAINING', progress?.legDurationRemaining);
      //   setTripLegRemaining(progress?.legDurationRemaining);
      //   setTripProgress(progress);
      // }
      // else if (tripLegRemaining !== null &&
      //   Math.abs(tripLegRemaining - progress.legDurationRemaining) > 5) {
      //   console.log('UPDATE BANNER');
      //   setTripProgress(progress);
      // }

      tripUpdatesRef.current = updates;

      // console.log(updates.currentLegIndex, tripUpdates?.currentLegIndex, '-', updates.transit.length, tripUpdates?.transit?.length);
      // if (updates.currentLegIndex !== tripUpdates.currentLegIndex ||
      //   updates.transit.length !== tripUpdates.transit.length) {
      //   triggerUpdate = true;
      // }
      // for (let i = 0; i < updates.transit.length; i++) {
      //   if (updates.transit[i] && tripUpdates.transit[i] &&
      //     updates.transit[i].atRisk !== tripUpdates.transit[i].atRisk) {
      //     console.log('TRIGGER UPDATE');
      //   }
      // }
      // setTripUpdates(updates);
      // for (let i = 0; i < updates.transit.length; i++) {
      //   if (updates?.transit[i] && tripUpdates?.transit[i]
      //     && updates?.transit[i]?.atRisk !== tripUpdates?.transit[i]?.atRisk
      //   ) {
      //     triggerUpdate = true;
      //     break;
      //   }
      // }
      if (triggerUpdate) {
        console.log('triggerUpdate', triggerUpdate);
        // setTripUpdates(updates);
        let showOfferNewTrip = false;;
        for (var i = 0; i < updates.transit.length; i++) {
          if (updates.transit[i].atRisk && legIndex < updates.transit[i].legIndex) {
            showOfferNewTrip = true;
            break;
          }
        }
      }
      let showOfferNewTrip = false;
      for (var i = 0; i < updates.transit.length; i++) {
        if (updates.transit[i].atRisk && legIndex < updates.transit[i].legIndex) {
          showOfferNewTrip = true;
          break;
        }
      }
      if (showOfferNewTrip && showOfferNewTrip !== offerNewTrip) {
        setOfferNewTrip(showOfferNewTrip);
      }

      if (ws.readyState === WebSocket.OPEN) {
        const payload = {
          group: `dependent-${store.authentication.user?.id}`,
          tripId: store.schedule?.selectedTrip?.id,
          longitude: progress?.latLng?.lng,
          latitude: progress?.latLng?.lat,
          legIndex: progress?.legIndex,
          stepIndex: progress?.stepIndex,
          navigating: true,
          status: tripStatus,
        };
        ws.send(JSON.stringify(payload));
      }

      if (progress.legIndex === progress.tripPlan.legs.length - 1 &&
        progress.stepIndex === progress.tripPlan.legs[legIndex].steps.length - 2) {
        if (tripStatus === 'inProgress') {
          setTripStatus('ended');
          sendNotification('dependentArrive', store.schedule?.selectedTrip?.id, 'none', 'none');
        }
      }

      if (tripStatus === 'started') {
        setTripStatus('inProgress');
      }

      if (progress?.voiceInstruction && config.AUTO_SIMULATE && config.SIMULATE_LOCATION && config.SHOW_LOCAL_NOTIFICATIONS) {
        generateNotification('Your Trip', progress.voiceInstruction.announcement);
      }

      // check current and future legs for hail
      let hailLeg = null;
      for (let i = progress.legIndex; i < progress.tripPlan.legs.length; i++) {
        const leg = progress.tripPlan.legs[i];
        if (leg.mode === 'HAIL') {
          hailLeg = leg;
          break;
        }
      }
      if (hailLeg) {
        const distance = geolocation.getDistanceKm(hailLeg.from.lon, hailLeg.from.lat);
        setCloseToSummon((prevCloseToSummon) => {
          console.log("Previous closeToSummon value inside functional update:", prevCloseToSummon);
          if (distance <= 0.1 && prevCloseToSummon === false) {
            console.log("Setting closeToSummon to true");
            return true;
          }
          else if (distance > 0.1 && prevCloseToSummon === true) {
            console.log("Setting closeToSummon to false");
            return false;
          }
          return prevCloseToSummon;
        });
        // if (distance <= 0.1 && closeToSummonRef.current === false) {
        //   setCloseToSummon(true);
        //   closeToSummonRef.current = true;
        // }
        // else if (distance > 0.1 && closeToSummonRef.current === true) {
        //   setCloseToSummon(false);
        //   closeToSummonRef.current = false;
        // }
      }
    }

    // Adjust the view as the user navigates.
    // TODO: make this mode-dependent, so walking is more zoomed out than driving,
    // and riding in a vehicle is more zoomed out than either.
    // TODO: make this speed-dependent so map is closer when going slower (around curves etc.)
    const zooms = didInitialZooms.current;
    const time = zoomedAtTime.current;
    if (progress && store.mapManager.map) {
      if (zooms === 1
        && progress.tripDistanceCompleted > 5
        && Date.now() - time > 6000) {
        store.mapManager.setFocus('user', {
          mode: 'course',
          pitch: 45,
          altitude: 250,
          zoom: 15,
          duration: 3500,
        });
        didInitialZooms.current = 2;
      } else if (zooms === 0 /* && progress.tripDistanceCompleted > 0.03 */) {
        store.mapManager.setFocus('user', {
          mode: 'course',
          pitch: 0,
          altitude: 1000,
          zoom: 14,
          duration: 3500,
        });
        didInitialZooms.current = 1;
        zoomedAtTime.current = Date.now();
      }
    }

    if (progress?.nextLeg?.mode === 'INDOOR' && !updateVenue && progress?.stepDistanceCompleted > 30) {
      setUpdateVenue(true);
    }
  }, [legIndex, offerNewTrip, summonedRide, tripLegRemaining, updateVenue, hasHail]);

  const currentCrosswalksRef = useRef([]);

  const handleCrosswalkUpdate = useCallback((progress) => {
    const tripPlan = navigator.getTripPlan();
    if (progress && tripPlan) {
      const currentLeg = progress?.tripPlan?.legs[progress?.legIndex];

      if (crosswalksRef.current && crosswalksRef.current.length >= 2 && progress?.latLng?.lng && progress?.latLng?.lat && currentLeg?.mode === 'WALK') {
        const pt = { type: 'Feature', geometry: { type: 'Point', coordinates: [progress.latLng.lng, progress.latLng.lat] } };
        const polys = { type: 'FeatureCollection', features: crosswalksRef.current };
        const pip = pointsWithinPolygon(pt, polys);

        if (currentCrosswalksRef.current.length === 0) {
          for (let i = 0; i < crosswalksRef.current.length; i++) {
            if (booleanIntersects(pt, crosswalksRef.current[i]) && i < crosswalksRef.current.length - 1) {
              const currentCrosswalk = crosswalksRef.current[i];
              const nextCrosswalk = crosswalksRef.current[i + 1];
              if (currentCrosswalk.properties.id === nextCrosswalk.properties.id) {
                console.log('IN CROSSWALK');
                currentCrosswalksRef.current = [currentCrosswalk, nextCrosswalk];
                inCrosswalkRef.current = true;
                setInCrosswalk(true);
                voice.speak('The crosswalk button now available for you to press');
                break;
              }
            }
          }
        }
        if (currentCrosswalksRef.current.length > 0) {
          if (!booleanIntersects(pt, currentCrosswalksRef.current[0])) {
            console.log('LEFT CROSSWALK');
            inCrosswalkRef.current = false;
            setInCrosswalk(false);
            currentCrosswalksRef.current = [];
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    // Define a function to reset the interval
    const resetInterval = () => {
      // Clear the existing interval
      console.log('RESET INTERVAL');
      clearInterval(crosswalkIntervalRef.current);

      // Set the interval again if crosswalkPressedRef.current is true
      if (crosswalkPressedRef.current) {
        crosswalkIntervalRef.current = setInterval(() => {
          crosswalkPressedRef.current = false;
          setCrosswalkPressed(false);
          console.log('RESET');
        }, 5000);
      }
    };

    // Call the resetInterval function whenever crosswalkPressedRef.current changes
    resetInterval();

    // Cleanup the interval when the component unmounts
    return () => {
      clearInterval(crosswalkIntervalRef.current);
    };
  }, [crosswalkPressedRef.current]);

  const handleRouteUpdate = useCallback((route) => {
    const ntp = navigator.getTripPlan();
    const geoJson = store.mapManager.updateSelectedTripLayer(ntp);

    // if (ws.readyState === WebSocket.OPEN) {
    //   const payload = {
    //     group: `dependent-${store.authentication.user?.id}`,
    //     tripId: store.schedule?.selectedTrip?.id,
    //     trip: ntp,
    //     navigating: true,
    //     status: 'rerouting',
    //   };
    //   ws.send(JSON.stringify(payload));
    // }

    let c = [];
    for (let i = 0; i < LocationData.Intersections.features.length; i++) {
      if (booleanIntersects(LocationData.Intersections.features[i], geoJson)) {
        c.push(LocationData.Intersections.features[i]);
      }
    }
    // console.log('CROSSWALKS', c.length);

    let lineIntersections = [];
    let legFeature = collapseFeatureCollection(geoJson);
    let legStart = { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: legFeature.geometry.coordinates[0] } };
    for (let i = 0; i < c.length; i++) {
      let pol = lineIntersect(legFeature, c[i]);
      for (let j = 0; j < pol.features.length; j++) {
        pol.features[j].properties = c[i].properties;
        lineIntersections.push(pol.features[j]);
      }
    }
    // console.log(lineIntersections);
    let orderedIntersections = determineIntersectionOrder(legFeature, legStart, lineIntersections);
    // console.log('ORDERED', orderedIntersections);

    // map and reduce to the geofences
    let gc = [];
    for (var i = 0; i < orderedIntersections.length; i++) {
      const oi = orderedIntersections[i];
      const foundGc = gc.find(g => g.properties.id === oi.properties.id && g.properties.location === oi.properties.location);
      const founcC = c.find(c => c.properties.id === oi.properties.id && c.properties.location === oi.properties.location);
      if (!foundGc && founcC) {
        gc.push(founcC);
      }
    }
    // console.log('GC', gc);
    crosswalksRef.current = gc;
    // setCrosswalks(c);
  }, []);

  const collapseFeatureCollection = (featureCollection) => {
    let combinedCoordinates = [];

    // Iterate over each feature in the feature collection
    featureCollection.features.forEach(feature => {
      // Check if the feature is a LineString
      if (feature.geometry.type === 'LineString') {
        // If it is, concatenate its coordinates to the combined coordinates array
        combinedCoordinates = combinedCoordinates.concat(feature.geometry.coordinates);
      }
    });

    // Create a new LineString feature with the combined coordinates
    const combinedLineString = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: combinedCoordinates
      },
      properties: {} // You can optionally add properties here
    };
    return combinedLineString;
  }

  // Function to determine the intersection order along the line string
  const determineIntersectionOrder = (lineString, startPoint, intersectionPoints) => {
    // Calculate the distance of each intersection point along the line string
    const distances = intersectionPoints.map(intersectionPoint => {
      // For each intersection point, calculate its distance along the line string
      const distance = calculateLineDistance(lineString, startPoint, intersectionPoint);
      return { point: intersectionPoint, distance };
    });

    // Sort the intersection points based on their distances along the line string
    distances.sort((a, b) => a.distance - b.distance);

    // Return the ordered intersection points
    return distances.map(entry => entry.point);
  }

  // Function to calculate the distance of a point along a line string
  const calculateLineDistance = (line, start, stop) => {
    // Calculate the distance of the point along the line string
    var sliced = lineSlice(start, stop, line);
    return length(sliced, 'kilometers');
  }

  useEffect(() => {
    if (offerNewTrip) {
      Alert.alert(
        translator.t('views.navigator.alerts.offerNewTripPress.title'),
        translator.t('views.navigator.alerts.offerNewTripPress.message'),
        [
          {
            text: translator.t('views.navigator.alerts.offerNewTripPress.buttons.cancel'),
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          {
            text: translator.t('views.navigator.alerts.offerNewTripPress.buttons.getNewTrip'),
            onPress: getNewTrip,
            style: 'destructive'
          },
        ]
      )
    }
  }, [offerNewTrip]);

  const getNewTrip = () => {
    // setIsUnloading(true);
    if (simulator.isMoving) {
      simulator.stopMoving();
      navigator.stop();
    }
    // if (indoorModuleMapRef.current) {
    //   indoorModuleMapRef.current?.stopOdp();
    // }
    // TODO: set location to current location, time to now
    const request = store.trip.request;
    console.log(request);
    geolocation.getPoint().then((position) => {
      geocoder.reverse({ lng: position.lng, lat: position.lat })
        .then(result => {
          let address = result.length ? result[0] : undefined;
          if (address && !address.alias) {
            let txt = address.title;
            if (address.description) {
              txt += `, ${address.description}`;
            }
            address.text = txt;
          }
          store.trip.updateOrigin(address);
          store.trip.updateWhen(new Date());
          navigation.reset({
            index: 0,
            routes: [{ name: 'schedule.results' }],
          });
        })
        .catch(e => {
          console.log('error reverse geocoding', e);
          navigation.reset({
            index: 0,
            routes: [{ name: 'schedule.plan' }],
          });
        });
    });
  }
  // END NAVIGATION

  // BEGIN SHUTTLE
  useEffect(() => {
    if (followMode === 'vehicle') {
      zoomToVehicle();
    }
  }, [vehicleUpdates]);

  const summon = () => {
    const userId = store.authentication.user?.id;
    const organizationId = config.ORGANIZATION;
    const datetime = Date.now();
    const direction = 'leave';
    let dropoff = null;
    let driverId = null;
    let passengers = 1;
    console.log('creating ride...');
    store.trip.selectedPlan?.legs?.forEach((leg) => {
      if (leg.mode === 'HAIL') {
        const to = leg.to;
        if (to.name === 'Destination') {
          // get the final destination from the request
          const request = store.trip.request;
          // console.log(request);
          dropoff = {
            address: request.destination.title,
            coordinates: [request.destination.point.lng, request.destination.point.lat],
          };
        } else {
          // get the destination from the leg
          dropoff = {
            address: to.name,
            coordinates: [to.lon, to.lat],
          };
        }
      }
    });
    // gl.geolocator.getPoint().then((position) => {
    geolocation.getPoint().then((position) => {
      const pickup = {
        address: 'Current Location',
        coordinates: [position.lng, position.lat],
      };
      // console.log(pickup);
      // console.log(dropoff);
      store.authentication.fetchAccessToken()
        .then((accessToken) => {
          rides.request(userId, organizationId, datetime, direction, pickup, dropoff, driverId, passengers, accessToken)
            .then((result) => {
              // console.log(result);
              store.hail.setRide(result);
              setSummonedRide(result);
            })
            .catch((e) => {
              console.log(e);
            });
        });
    });
  };

  const onSummonPress = () => {
    Alert.alert(
      translator.t('views.navigator.alerts.summonPress.title'),
      translator.t('views.navigator.alerts.summonPress.message'),
      [
        {
          text: translator.t('views.navigator.alerts.summonPress.buttons.cancel'),
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: translator.t('views.navigator.alerts.summonPress.buttons.summon'),
          onPress: summon
        },
      ]
    );
  };

  const onCancelSummonPress = () => {
    Alert.alert(
      translator.t('views.navigator.alerts.cancelSummonPress.title'),
      translator.t('views.navigator.alerts.cancelSummonPress.message'),
      [
        {
          text: translator.t('views.navigator.alerts.cancelSummonPress.buttons.no'),
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: translator.t('views.navigator.alerts.cancelSummonPress.buttons.proceed'),
          onPress: handleConfirmCancel,
        },
      ]
    );
  };

  const handleConfirmCancel = () => {
    if (store.hail.ride) {
      store.authentication.fetchAccessToken()
        .then((accessToken) => {
          rides.cancel(store.hail.ride.id, config.ORGANIZATION, accessToken)
            .then((result) => {
              // console.log(result);
              store.hail.reset();
              store.trip.reset();
              handleExitPress();
            })
            .catch((e) => {
              console.log(e);
            });
        });
    }
  };
  // END SHUTTLE

  // BEGIN CROSSWALK
  const handleCrosswalkPress = () => {
    // console.log(currentCrosswalksRef.current);
    if (currentCrosswalksRef.current.length === 2) {
      let i1 = currentCrosswalksRef.current[0],
        i2 = currentCrosswalksRef.current[1];
      if (i1.properties.location.substring(0, 1) === i2.properties.location.substring(0, 1)) {
        store.authentication.fetchAccessToken()
          .then((accessToken) => {
            crosswalk.request(i1.properties.id, 'ns', accessToken);
          })
          .catch((e) => {
            console.log(e);
          })
      }
      else {
        store.authentication.fetchAccessToken()
          .then((accessToken) => {
            crosswalk.request(i1.properties.id, 'we', accessToken)
              .catch((e) => {
                console.log(e);
              })
          });
      }
      crosswalkPressedRef.current = true;
      setCrosswalkPressed(true);
      voice.speak('Crosswalk has been requested.  You may try again in 5 seconds.');
    }
  }
  // END CROSSWALK

  // BEGIN NOTIFICATIONS
  useEffect(() => {
    const tripId = store.schedule.selectedTrip?.id;
    const plan = store.trip.selectedPlan;
    if (tripId && plan && legIndex > 0) {
      sendNotification('dependentModeChange', tripId, plan.legs[legIndex - 1].mode, plan.legs[legIndex].mode);
    }
  }, [legIndex]);

  const sendNotification = async (type, tripId, fromMode, toMode) => {
    const accessToken = await store.authentication.fetchAccessToken();
    notifications.queue(type, tripId, fromMode.toLowerCase(), toMode.toLowerCase(), accessToken);
  };
  // END NOTIFICATIONS 

  // BEGIN MAP 
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', (e) => {
      console.log('unload map');
      store.mapManager.reset();
    });

    return unsubscribe;
  }, [navigation]);

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

  useFocusEffect(
    React.useCallback(() => {
      store.mapManager.reset();
      InteractionManager.runAfterInteractions(() => {
        // need to run this because useFocusEffect is called before the blur of the previous screen
        setMapReady(true);
      });
    }, [])
  );

  useEffect(() => {
    if (_mapboxReady) {
      setMapboxReady(true);
    } else {
      waitForAccessToken();
    }
  }, [mapboxReady]);

  const gotRef = useCallback((ref) => {
    // console.log(`Map ref updated at ${Date.now()}`)
    if (!store.mapManager.map && store.mapManager.currentMap === 'navigator') {
      console.log('SELECTED: set map ref');
      store.mapManager.setMap(ref);
    }
  }, [store.mapManager.map, store.mapManager.currentMap]);

  const handleMapStyleLoaded = () => {
    if (!styleReady) {
      setStyleReady(true);
    }
  };

  useEffect(() => {
    if (styleReady && store.mapManager.map && store.mapManager.currentMap === 'navigator') {
      if (Devices.isIphone) {
        store.mapManager.setExtentPaddings(0, 0, 200, 0);
      }
      store.mapManager.addLayers();
      var geoJson = store.mapManager.updateSelectedTripLayer(store.trip.selectedPlan, store.preferences.wheelchair);
      const bbx = bbox(buffer(bboxPolygon(bbox(geoJson)), 1));
      store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);

      // store.mapManager.updateLayer('intersections', LocationData.Intersections);

      let c = [];
      for (let i = 0; i < LocationData.Intersections.features.length; i++) {
        if (booleanIntersects(LocationData.Intersections.features[i], geoJson)) {
          c.push(LocationData.Intersections.features[i]);
        }
      }
      // console.log('CROSSWALKS', c.length);
      crosswalksRef.current = c;
      // setCrosswalks(c);

      if (simulator.isRunning) {
        // need to let the simulated GPS run for at least 1 point to avoid getting
        // rerouted as soon as the navigation service starts.
        console.log('starting simulated movement');
        simulator.startMoving();
        setTimeout(() => {
          if (mounted.current) {
            navigator.start(new TripPlan(store.trip.selectedPlan), store.preferences.language);
          }
        }, 1000);
      } else {
        // gl.geolocator.resume();
        // geolocation.resume();
        navigator.start(new TripPlan(store.trip.selectedPlan));
      }
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
    return screenReaderOn ?
      0 :
      Devices.screen.height - (VERTICAL_TRIP_PLAN_OFFSET + insets.bottom);
  };

  useEffect(() => {
    return () => {
      console.log('NAVIGATOR: cleanup');
      indoorMapRef.current = null;
    }
  }, []);

  const onGotIndoorRef = useCallback((ref) => {
    if (!indoorMapRef.current) {
      indoorMapRef.current = ref;
      console.log('NAVIGATOR: got indoor ref');

      if (store.trip.request.origin || store.trip.request.destination) {
        const o_vid = store.trip.request.origin.venueId;
        const d_vid = store.trip.request.destination.venueId;
        console.log('NAVIGATOR: INDOOR PLACES', o_vid, d_vid);

        const v = [];
        if (o_vid) v.push({ id: o_vid, leg: 'origin' });
        if (d_vid) v.push({ id: d_vid, leg: 'destination' });

        if (v.length > 0) {
          setHasIndoor(true);
          setStartsOutdoor(d_vid ? true : o_vid ? false : false);
          setShowIndoor(o_vid ? true : d_vid ? false : false);
          setVenues(v);
          setIndoorReady(true);
          // setTimeout(() => {
          //   const venueId = o_vid || d_vid;
          //   const venue = config.INDOOR.VENUES.find(v => v.id === venueId);
          //   let credentials = { ...venue.credentials };
          //   credentials.venueId = venueId;
          //   console.log('NAVIGATOR: set venue');
          //   indoorMapRef.current.setMapVenue(credentials, config.INDOOR.OPTIONS);
          //   console.log('venue set');
          // }, 10);
        }
        else {
          setNavigationReady(true);
          store.display.hideSpinner();
        }
      }
    }
  }, []);

  useEffect(() => {
    if (indoorMapRef.current && indoorReady && venues.length > 0) {
      // setTimeout(() => {
      // const venueId = o_vid || d_vid;
      const venueId = venues[0].id;
      const venue = config.INDOOR.VENUES.find(v => v.id === venueId);
      let credentials = { ...venue.credentials };
      credentials.venueId = venueId;
      console.log('NAVIGATOR: set venue', venueId);
      indoorMapRef.current.setMapVenue(credentials, config.INDOOR.OPTIONS);
      // }, 10);
    }
  }, [indoorMapRef, indoorReady, venues]);

  const handleVenueLoaded = useCallback((venueId) => {
    console.log('NAVIGATOR: venue loaded', venueId);
    setVenueLoaded(true);
  }, [venueLoaded]);

  useEffect(() => {
    if (indoorMapRef.current && venues.length > 1 && store.mapManager.currentIndoorMap === 'navigator') {
      const venueId = venues[1].id;
      const venue = config.INDOOR.VENUES.find(v => v.id === venueId);
      let credentials = { ...venue.credentials };
      credentials.venueId = venueId;
      console.log('NAVIGATOR: set NEW venue', venueId);
      indoorMapRef.current.setMapVenue(credentials, config.INDOOR.OPTIONS);
    }
  }, [updateVenue]);

  const handleSearchDestinationsGenerated = useCallback((destinations) => {
    console.log('NAVIGATOR: handleSearchDestinationsGenerated');
    if (indoorMapRef.current && store.mapManager.currentIndoorMap === 'navigator') {
      setIndoorDestinations(destinations);
    }
  }, []);

  useEffect(() => {
    if (indoorDestinations.length > 0 && indoorMapRef.current && venueLoaded && store.mapManager.currentIndoorMap === 'navigator' && venues.length > 0) {
      const indoorLegs = store.trip.selectedPlan.legs.filter(l => l.mode.toLowerCase() === 'indoor');
      console.log('NAVIGATOR: indoorLegs', store.trip.selectedPlan.legs);
      if (indoorLegs.length > 0) {
        const venueIndex = updateVenue && venues.length === 2 ? 1 : 0;
        console.log('NAVIGATOR: get path', indoorLegs[venueIndex].from.waypointId, indoorLegs[venueIndex].to.waypointId);
        indoorMapRef.current.wayfindBetweenWaypoints(indoorLegs[venueIndex].from.waypointId, indoorLegs[venueIndex].to.waypointId);
      }
    }
  }, [indoorDestinations, venueLoaded]);

  const handleNavigationPathGenerated = useCallback((pathId, instructions, start, end, path, geojson) => {
    console.log('NAVIGATOR: handleNavigationPathGenerated');
    if (indoorMapRef.current && pathId && store.mapManager.currentIndoorMap === 'navigator') {
      // setTimeout(() => {
      //   console.log('START ODP');
      //   indoorModuleMapRef.current?.startOdp(config.INDOOR.ODP_CREDENTIALS.key, config.INDOOR.ODP_CREDENTIALS.host);
      // }, 5000);
      indoorMapRef.current.drawNavigationPath(pathId, getNavigationPathStyle());
      // indoorMapRef.current.setMapViewToPath({ margin: 0.25 });
      setNavigationReady(true);
      store.display.hideSpinner();
    }
  }, [venues]);

  const handleRerouteNavigationPathGenerated = useCallback((pathId, instructions, start, end, path, geojson) => {
    console.log('NAVIGATOR: handleRerouteNavigationPathGenerated');
    if (indoorMapRef.current && pathId && store.mapManager.currentIndoorMap === 'navigator') {
      indoorMapRef.current.drawNavigationPath(pathId, getNavigationPathStyle());
      const ntp = navigator.getTripPlan();
      if (ntp.legs[0].mode === 'INDOOR') {
        console.log('prepending reroute indoor leg');
        ntp.legs.unshift(ntp.legs[0]);
      }
      if (ntp.legs[ntp.legs.length - 1].mode === 'INDOOR') {
        console.log('appending reroute indoor leg');
        ntp.legs.push(ntp.legs[ntp.legs.length - 1]);
      }
      navigator.updateTripPlan(ntp);
      //TODO: get proper leg for indoor to indoor
    }
  }, []);

  const prevInGeofenceRef = useRef(null);

  const handleGeofencesChanged = useCallback((entered, geofences) => {
    console.log('NAVIGATOR: handleGeofencesChanged', entered);
    const prevEntered = prevInGeofenceRef.current;

    // Check if the state has changed
    if (entered !== prevEntered) {
      prevInGeofenceRef.current = entered;

      if (indoorMapRef.current && store.mapManager.currentIndoorMap === 'navigator') {
        setInGeofence(entered);

        // if (indoorModuleMapRef.current) {
        //   if (entered) {
        //     simulator.adjustSpeed(2);
        //   }
        //   else {
        //     simulator.adjustSpeed(20);
        //   }
        // }
      }
    }
  }, []);

  useEffect(() => {
    // console.log('SET FOLLOW BLUE DOT');
    if (config.INCLUDE_INDOOR && indoorMapRef.current) {
      indoorMapRef.current.setFollowBlueDot(inGeofence, inGeofence, 1);
    }
    // console.log('!inGeofence && indoorMapRef.current', indoorMapRef.current, inGeofence);
    // if (!inGeofence && indoorMapRef.current) {
    //   indoorMapRef.current.setMapViewToPath({animationDuration: 0});
    // }
    if (startsOutdoor && !showIndoorMessage && inGeofence) {
      setShowIndoorMessage(true);
    }
    if (!startsOutdoor && !showOutdoorMessage && inGeofence) {
      setShowOutdoorMessage(true);
    }
  }, [inGeofence]);

  useEffect(() => {
    if (indoorMapRef.current && showIndoor) {
      setTimeout(() => {
        //   indoorMapRef.current.centerMapOnPoint({
        //     point: [42.905519, -78.868386],
        //     zoom: 1,
        //     rotation: 0,
        //     animationDuration: 1500,
        //     format: 'LAT_LONG',
        //   });
        console.log('NAVIGATOR: setMapViewToPath');
        indoorMapRef.current.setMapViewToPath({ margin: 0.25 });
      }, 1000);
    }
  }, [showIndoor]);
  // END INDOOR MAP

  // BEGIN MAP ACTIONS
  const handleFollowUserPress = () => {
    store.mapManager.setFocus('user', {
      mode: 'course',
      pitch: 45,
      altitude: 850,
      zoom: 17,
      duration: 3500,
    });
  };

  const handleToggleHailPress = () => {
    // if (stop && stop.geometry) {
    //   let fc = {
    //     'type': 'FeatureCollection',
    //     'features': [{
    //       type: 'Feature',
    //       geometry: stop.geometry,
    //     }],
    //   };
    //   const bbx = bbox(buffer(fc, 0.0804672));
    //   store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);
    // }

    // OR

    // store.mapManager.setFocus('user', {
    //   mode: 'course',
    //   pitch: 45,
    //   altitude: 850,
    //   zoom: 15,
    //   duration: 3500,
    // });

    // setShowHail(!showHail);
    // if indoor then switch to outdoor to track the shuttle
    // if (!showHail) {
    //   setShowIndoor(false);
    // }
  };

  const handleFollowUser = () => {
    setFollowMode('user');
    store.mapManager.setFocus('user', {
      mode: 'course',
      pitch: 0,
      altitude: 2000,
      zoom: 17,
      duration: 200,
    });
  };

  const handleFollowVehicle = () => {
    setFollowMode('vehicle');
    setShowIndoor(false);
    store.mapManager.setFocus(null);
    zoomToVehicle();
  };

  const handleToggleIndoorPress = () => {
    setShowIndoor(!showIndoor);
    // if tracking shuttle then switch to tracking user
    // if (showHail) {
    //   setShowHail(false);
    // }
    if (followMode === 'vehicle') {
      setFollowMode('user');
    }
  };

  const handleExitPress = () => {
    console.log('exit');
    store.mapManager.setCurrentMap('home');
    // setIsUnloading(true);
    if (simulator.isMoving) {
      simulator.stopMoving();
      navigator.stop();
    }
    // if (indoorModuleMapRef.current) {
    //   indoorModuleMapRef.current?.stopOdp();
    // }
    store.display.showFeedback(store.trip.selectedPlan);
    store.trip.reset();
    navigation.reset({
      index: 0,
      routes: [{ name: 'home' }],
    });
  };

  const zoomToVehicle = async () => {
    if (vehicleUpdates && vehicleUpdates.length > 0) {
      const vehicle = vehicleUpdates[0];
      const coordinates = vehicle.location ? vehicle.location.coordinates : vehicle.coordinates;
      // const userPos = await gl.geolocator.getPoint();
      const userPos = await geolocation.getPoint();
      if (stop && stop.geometry) {
        if (coordinates && userPos) {
          const minLng = Math.min(coordinates[0], userPos.lng);
          const maxLng = Math.max(coordinates[0], userPos.lng);
          const minLat = Math.min(coordinates[1], userPos.lat);
          const maxLat = Math.max(coordinates[1], userPos.lat);
          const boundingBox = [minLng, minLat, maxLng, maxLat];
          store.mapManager.setFocus('bounds', boundingBox);
        }
      } else {
        console.error('Either coordinates or user position is not available');
      }
    }
  };
  // END MAP ACTIONS

  // BEGIN OVERRIDE STYLES
  const containerStyle = () => {
    return {
      ...styles.container,
      paddingTop: insets.top,
    };
  };

  const mapContainerStyle = () => {
    return {
      ...styles.mapContainer,
      top: bannerHeight + insets.top,
      bottom: VERTICAL_TRIP_PLAN_OFFSET,
    };
  };

  const mapStyle = () => {
    return {
      height: (showIndoor || screenReaderOn) ? 0 : '100%',
    };
  };

  const hailContainerStyle = () => {
    return {
      ...styles.hailContent,
      bottom: hailContainerBottom + 20,
    };
  };

  const hailButtonStyle = () => {
    return {
      ...styles.hailButton,
      bottom: hasIndoor ? 100 : 40,
    };
  };

  const bannerHeightChange = (height) => {
    setBannerHeight(height);
  };
  // END OVERRIDE STYLES

  return (
    <View style={containerStyle()}>

      <Banner
        // tripProgress={tripProgress}
        onHeightChange={bannerHeightChange}
      />

      <View style={mapContainerStyle()}>

        {config.SIMULATE_LOCATION &&
          <Slider
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              left: 60,
              zIndex: 1000,
              backgroundColor: Colors.white,
              borderRadius: 15,
            }}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={2}
            minimumTrackTintColor={Colors.primary1}
            maximumTrackTintColor={Colors.secondary2}
            thumbTintColor={Colors.primary1}
            onSlidingComplete={(value) => {
              simulator.adjustSpeed(value);
            }}
          />
        }

        {!screenReaderOn &&
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleFollowUserPress}
          >
            <FontAwesomeIcon
              icon="location-arrow"
              size={24}
              color={Colors.primary1}
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

        {hasHail && !screenReaderOn &&
          <>
            {followMode === 'vehicle' &&
              <TouchableOpacity
                style={hailButtonStyle()}
                onPress={handleFollowUser}
              >
                <FontAwesomeIcon
                  icon="location-dot"
                  size={24}
                  color={Colors.primary1}
                />
              </TouchableOpacity>
            }
            {followMode === 'user' &&
              <TouchableOpacity
                style={hailButtonStyle()}
                onPress={handleFollowVehicle}
              >
                <FontAwesomeIcon
                  icon="shuttle-van"
                  size={24}
                  color={Colors.primary1}
                />
              </TouchableOpacity>
            }
          </>
        }

        {hasIndoor && !screenReaderOn &&
          <>
            {showIndoor &&
              <TouchableOpacity
                style={styles.indoorButton}
                onPress={handleToggleIndoorPress}
              >
                <FontAwesomeIcon
                  icon="building-circle-arrow-right"
                  size={24}
                  color={Colors.primary1}
                />
              </TouchableOpacity>
            }
            {!showIndoor &&
              <TouchableOpacity
                style={styles.indoorButton}
                onPress={handleToggleIndoorPress}
              >
                <FontAwesomeIcon
                  icon="building"
                  size={24}
                  color={Colors.primary1}
                />
              </TouchableOpacity>
            }
          </>
        }

        {hasHail && !screenReaderOn &&
          <View
            style={hailContainerStyle()}>
            {(!summonedRide && closeToSummon) &&
              <Button
                label={translator.t('views.navigator.summonShuttleLabel')}
                width={250}
                buttonStyle={{
                  backgroundColor: Colors.success,
                  borderColor: Colors.success,
                }}
                labelStyle={{
                  fontWeight: 'bold',
                }}
                onPress={onSummonPress}
              />
            }
            {!!summonedRide &&
              <Button
                label={translator.t('views.navigator.cancelShuttleLabel')}
                width={250}
                buttonStyle={{
                  backgroundColor: Colors.danger,
                  borderColor: Colors.danger,
                }}
                labelStyle={{
                  fontWeight: 'bold',
                }}
                onPress={onCancelSummonPress}
              />
            }
          </View>
        }

        {crosswalksRef.current.length > 0 &&
          <View
            style={hailContainerStyle()}>
            {inCrosswalk && !crosswalkPressed &&
              <Button
                label={translator.t('views.navigator.requestCrosswalk')}
                width={320}
                buttonStyle={{
                  backgroundColor: Colors.success,
                  borderColor: Colors.success,
                }}
                labelStyle={{
                  fontWeight: 'bold',
                }}
                onPress={handleCrosswalkPress}
              />
            }
            {inCrosswalk && crosswalkPressed &&
              <Button
                label={translator.t('views.navigator.crosswalkRequested')}
                width={320}
                buttonStyle={{
                  backgroundColor: Colors.warning,
                  borderColor: Colors.warning,
                }}
                labelStyle={{
                  color: Colors.danger,
                  fontWeight: 'bold',
                }}
              />
            }
          </View>
        }

        {showIndoorMessage &&
          <View style={styles.modal}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => {
                setShowIndoorMessage(false);
              }}
            >
              <FontAwesomeIcon
                icon="circle-xmark"
                size={24}
                color={Colors.primary1}
              />
            </TouchableOpacity>
            <Text>{translator.t('views.navigator.near')}</Text>
            <Text>{''}</Text>
            <Text>{translator.t('views.navigator.indoorMessage')}</Text>
          </View>
        }

        {showOutdoorMessage &&
          <View style={styles.modal}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => {
                setShowOutdoorMessage(false);
              }}
            >
              <FontAwesomeIcon
                icon="circle-xmark"
                size={24}
                color={Colors.primary1}
              />
            </TouchableOpacity>
            <Text>{translator.t('views.navigator.outdoorMessage')}</Text>
          </View>
        }

        <View style={mapStyle()}>

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

        {/* {config.INCLUDE_INDOOR &&
          <JOdpViewModuleMemo
            ref={onGotIndoorModuleRef}
            odpEventHandlers={{
              onReady: handleOdpReady,
              onKeyValidation: handleOdpKeyValidation,
              onNavigationUpdate: handleOdpNavigationUpdate,
              onFacilityUpdate: handleOdpFacilityUpdate,
            }}
          />
        } */}
        {config.INCLUDE_INDOOR &&
          // <JMapView
          //   ref={onGotIndoorRef}
          //   style={{ width: Devices.screen.width, height: getHeight(), visible: showIndoor }}
          //   onMapMessage={jMapViewMapMessageHandlers}
          //   // onMapMessage={{
          //   //   onNavigationPathGenerated: handleNavigationPathGenerated,
          //   //   onSearchDestinationsGenerated: handleSearchDestinationsGenerated,
          //   //   onGeofencesChanged: handleGeofencesChanged,
          //   //   onVenueLoaded: handleVenueLoaded,
          //   //   onRerouteNavigationPathGenerated: handleRerouteNavigationPathGenerated,
          //   // }}
          //   mapOptions={config.INDOOR.OPTIONS}
          // />
          <JMapViewMemo
            ref={onGotIndoorRef}
            width={Devices.screen.width}
            height={getHeight()}
            visible={showIndoor}
            handleVenueLoaded={handleVenueLoaded}
            handleNavigationPathGenerated={handleNavigationPathGenerated}
            handleSearchDestinationsGenerated={handleSearchDestinationsGenerated}
            handleGeofencesChanged={handleGeofencesChanged}
            handleRerouteNavigationPathGenerated={handleRerouteNavigationPathGenerated}
            mapOptions={config.INDOOR.OPTIONS}
          />
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
        containerStyle={{
          zIndex: 1000,
        }}
      >
        <View
          style={styles.content}
        >
          {store.trip.selectedPlan &&
            <VerticalPlanSchedule
              request={store.trip.request}
              plan={store.trip.selectedPlan}
              wheelchair={store.preferences.wheelchair}
              screenReading={screenReaderOn}
              onScroll={onPlanScroll}
              onExitPress={handleExitPress}
              vehicleUpdates={vehicleUpdates}
              tripUpdates={tripUpdatesRef}
              navigating
            />
          }
        </View>
      </SlidingUpPanel>

    </View>
  );
});

Navigator.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    addListener: PropTypes.func,
  }),
};

export default Navigator;
