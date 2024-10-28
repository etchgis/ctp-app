/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  PixelRatio,
  Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Colors, Devices, Typography } from '../../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useStore } from '../../stores/RootStore';
import { useIsFirstRender } from '../../utils/isFirstRender';
import formatters from '../../utils/formatters';
import moment from 'moment';
import { Path, Svg } from 'react-native-svg';
import config from '../../config';
import Button from '../../components/Button';
import { JMapView } from 'react-native-ctp-odp';
import { fromGeoJSON } from '../../utils/polyline';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFontScale } from '../../utils/fontScaling';
import { deviceMultiplier } from '../../styles/devices';
import translator from '../../models/translator';
import { set } from 'lodash';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingTop: 65,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    marginHorizontal: 10,
  },
  headerBackButton: {
    position: 'absolute',
    left: 0,
  },
  headerLabel: {
    ...Typography.h4,
  },
  content: {
    flex: 1,
  },
  scrollViewContentContainerStyle: {
    paddingTop: 10,
    paddingBottom: 50,
    paddingHorizontal: 10,
  },
  card: {
    // height: 96,
    width: '100%',
    backgroundColor: Colors.white,
    borderColor: Colors.light,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 22,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  detail: {
    ...Typography.h6
  },
  dateTimeDirection: {
    ...Typography.h6,
    marginBottom: 2,
  },
  detailDateTimeLabel: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  dateTimeHourMinute: {
    ...Typography.h3,
    marginRight: 2,
    color: Colors.primary1,
  },
  dateTimeMeridiem: {
    ...Typography.h4,
    color: Colors.primary1,
  },
  noResultsContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    ...Typography.h4,
    color: Colors.danger,
    marginBottom: 20,
    textAlign: 'center',
  },
  calloutLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    ...Typography.h6,
    fontWeight: 'bold',
    color: Colors.primary2,
    textAlign: 'right',
  },
  transitBubble: {
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 1,
  },
  transitLabel: {
    ...Typography.h6,
  }
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

const Results = observer(({
  navigation,
}) => {

  const store = useStore();
  const isFirstRender = useIsFirstRender();
  const insets = useSafeAreaInsets();
  const currentFontScale = useFontScale();

  const [refreshing, setRefreshing] = useState(false);
  const [plans, setPlans] = useState([]);
  const [indoorDestinations, setIndoorDestinations] = useState([]);
  const [venueLoaded, setVenueLoaded] = useState(false);
  const [indoorLeg, setIndoorLeg] = useState();
  const [indoorReady, setIndoorReady] = useState(false);
  const [venues, setVenues] = useState([]);

  const indoorMapRef = useRef();

  // const [isFocused, setIsFocused] = useState(true);

  const ratio = PixelRatio.getFontScale();

  // useFocusEffect(
  //   React.useCallback(() => {
  //     setIsFocused(true);
  //     return () => {
  //       setIsFocused(false);
  //     };
  //   }, [])
  // );

  useEffect(() => {
    console.log('TRIP RESULTS: get plans');
    getPlans();
  }, []);

  const filterMultipleShuttles = (plans) => {
    return plans.filter(p => {
      let shuttleCount = p.legs.filter(l => l.mode === 'HAIL').length;
      return shuttleCount <= 1;
    });
  }

  const getPlans = () => {
    setRefreshing(true);
    store.trip.generatePlans()
      .then(() => {
        const o_vid = store.trip.request.origin.venueId;
        const d_vid = store.trip.request.destination.venueId;

        const v = [];
        if (o_vid) v.push({ id: o_vid, leg: 'origin' });
        if (d_vid) v.push({ id: d_vid, leg: 'destination' });
        setVenues(v);

        if ((!o_vid && !d_vid) || !config.INCLUDE_INDOOR) {
          setPlans(filterMultipleShuttles(store.trip.plans));
          setRefreshing(false);
        }
      })
      .catch(e => {
        setRefreshing(false);
        console.log('results catch', e);
      });
  }

  // INDOOR MAP
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

  useEffect(() => {
    return () => {
      console.log('TRIP RESULTS: cleanup');
      indoorMapRef.current = null;
    }
  }, []);

  const gotIndoorRef = (ref) => {
    if (!indoorMapRef.current && store.mapManager.currentIndoorMap === 'results') {
      indoorMapRef.current = ref;
      console.log('TRIP RESULTS: got indoor ref');
      setIndoorReady(true);
    }
  };

  useEffect(() => {
    if (indoorMapRef.current && indoorReady && venues.length > 0) {
      // const o_vid = store.trip.request.origin.venueId;
      // const d_vid = store.trip.request.destination.venueId;
      // console.log('venues', venues);

      // if (o_vid || d_vid) {
      // setTimeout(() => {
      // const venueId = o_vid || d_vid;
      const venueId = venues[0].id;
      const venue = config.INDOOR.VENUES.find(v => v.id === venueId);
      let credentials = { ...venue.credentials };
      credentials.venueId = venueId;
      console.log('TRIP RESULTS: set venue', venueId, credentials);

      indoorMapRef.current.setMapVenue(credentials, config.INDOOR.OPTIONS);
      // setTimeout(() => {
        // indoorMapRef.current.setMapVenue(credentials, config.INDOOR.OPTIONS);
      // }, 5000);


      // }, 10);
      // }
    }
  }, [indoorMapRef, indoorReady, venues]);

  const handleVenueLoaded = useCallback((venueId) => {
    console.log('TRIP RESULTS: venue loaded', venueId);
    setVenueLoaded(true);
  }, [venueLoaded]);

  const handleSearchDestinationsGenerated = useCallback((destinations) => {
    if (indoorMapRef.current && store.mapManager.currentIndoorMap === 'results') {
      console.log('TRIP RESULTS: search destinations generated');
      setIndoorDestinations(destinations);
    }
  }, []);

  useEffect(() => {
    // console.log(indoorDestinations.length, indoorMapRef.current, venueLoaded, store.mapManager.currentIndoorMap);
    if (indoorDestinations.length > 0 && indoorMapRef.current && venueLoaded && store.mapManager.currentIndoorMap === 'results' && venues.length > 0) {
      const currentVenue = venues[0];
      let startWaypointId, endWaypointId;
      if (currentVenue.leg === 'origin') {
        const venue = config.INDOOR.VENUES.find(v => v.id === currentVenue.id);
        let locationId = store.trip.request.origin.locationId,
          found = indoorDestinations.find(i => i.id === locationId);
        if (found) {
          startWaypointId = found.waypoints[0].id;
          endWaypointId =
            store.preferences.wheelchair ?
              venue.entrances.accessible.id :
              venue.entrances.standard.id;
        }
      }
      if (currentVenue.leg === 'destination') {
        const venue = config.INDOOR.VENUES.find(v => v.id === currentVenue.id);
        let locationId = store.trip.request.destination.locationId,
          found = indoorDestinations.find(i => i.id === locationId);
        if (found) {
          startWaypointId =
            store.preferences.wheelchair ?
              venue.entrances.accessible.id :
              venue.entrances.standard.id;
          endWaypointId = found.waypoints[0].id;
        }
      }
      if (startWaypointId && endWaypointId) {
        console.log('TRIP RESULTS: get wayfinding path', startWaypointId, endWaypointId);
        indoorMapRef.current.wayfindBetweenWaypoints(startWaypointId, endWaypointId);
      }

      // const originVenueId = store.trip.request.origin.venueId;
      // const destinationVenueId = store.trip.request.destination.venueId;
      // if (originVenueId || destinationVenueId) {
      //   const venue = config.INDOOR.VENUES.find(v => v.id === (originVenueId || destinationVenueId));
      //   let originWaypointId, destinationWaypointId;
      //   if (originVenueId) {
      //     let locationId = store.trip.request.origin.locationId,
      //       found = indoorDestinations.find(i => i.id === locationId);
      //     if (found) {
      //       originWaypointId = found.waypoints[0].id;
      //       destinationWaypointId =
      //         store.preferences.wheelchair ?
      //           venue.entrances.accessible.id :
      //           venue.entrances.standard.id;
      //     }
      //   }
      //   if (destinationVenueId) {
      //     let locationId = store.trip.request.destination.locationId,
      //       found = indoorDestinations.find(i => i.id === locationId);
      //     if (found) {
      //       originWaypointId =
      //         store.preferences.wheelchair ?
      //           venue.entrances.accessible.id :
      //           venue.entrances.standard.id;
      //       destinationWaypointId = found.waypoints[0].id;
      //     }
      //   }
      //   if (originWaypointId && destinationWaypointId) {
      //     console.log('RESULTS: get path', originWaypointId, destinationWaypointId);
      //     indoorMapRef.current.wayfindBetweenWaypoints(originWaypointId, destinationWaypointId);
      //   }
      // }
    }
  }, [indoorDestinations, venueLoaded]);

  const handleNavigationPathGenerated = useCallback((pathId, instructions, start, end, path, geojson) => {
    if (indoorMapRef.current && pathId && store.mapManager.currentIndoorMap === 'results') {
      console.log('TRIP RESULTS: navigation path generated');
      let _indoorLeg = { ...geojson };
      _indoorLeg.mode = 'INDOOR';
      let lg = fromGeoJSON(_indoorLeg.legGeometry);
      delete _indoorLeg.legGeometry;
      _indoorLeg.legGeometry = { points: null };
      _indoorLeg.legGeometry.points = lg;

      const currentVenue = venues[0];
      let originVenueId, destinationVenueId;

      _indoorLeg.venueId = currentVenue.id;
      if (currentVenue.leg === 'origin') {
        _indoorLeg.from = {
          name: store.trip.request.origin.title,
          lon: _indoorLeg.steps[0].lon,
          lat: _indoorLeg.steps[0].lat,
          waypointId: start.id,
        };
        _indoorLeg.to = {
          name: 'Exit',
          lon: _indoorLeg.steps[_indoorLeg.steps.length - 1].lon,
          lat: _indoorLeg.steps[_indoorLeg.steps.length - 1].lat,
          waypointId: end.id,
        };
      }
      else if (currentVenue.leg === 'destination') {
        _indoorLeg.from = {
          name: 'Entrance',
          lon: _indoorLeg.steps[0].lon,
          lat: _indoorLeg.steps[0].lat,
          waypointId: start.id,
        };
        _indoorLeg.to = {
          name: store.trip.request.destination.title,
          lon: _indoorLeg.steps[_indoorLeg.steps.length - 1].lon,
          lat: _indoorLeg.steps[_indoorLeg.steps.length - 1].lat,
          waypointId: end.id,
        };
      }

      // const originVenueId = store.trip.request.origin.venueId;
      // const destinationVenueId = store.trip.request.destination.venueId;
      // _indoorLeg.venueId = originVenueId || destinationVenueId;
      // _indoorLeg.from = {
      //   name: originVenueId ? store.trip.request.origin.title : 'Entrance',
      //   lon: _indoorLeg.steps[0].lon,
      //   lat: _indoorLeg.steps[0].lat,
      //   waypointId: start.id,
      // };
      // _indoorLeg.to = {
      //   name: destinationVenueId ? store.trip.request.destination.title : 'Exit',
      //   lon: _indoorLeg.steps[_indoorLeg.steps.length - 1].lon,
      //   lat: _indoorLeg.steps[_indoorLeg.steps.length - 1].lat,
      //   waypointId: end.id,
      // };
      setIndoorLeg(_indoorLeg);
      indoorMapRef.current.drawNavigationPath(pathId, getNavigationPathStyle());
    }
  }, [venues]);

  useEffect(() => {
    if (indoorLeg && store.mapManager.currentIndoorMap === 'results') {
      console.log('TRIP RESULTS: got indoor plan');

      const currentVenue = venues[0];
      if (currentVenue.leg === 'origin') {
        store.trip.prependIndoorToPlans(indoorLeg);
      }
      if (currentVenue.leg === 'destination') {
        store.trip.appendIndoorToPlans(indoorLeg);
      }
      setVenues(venues.slice(1));
      if (venues.length === 1) {
        setPlans(filterMultipleShuttles(store.trip.plans));
        setRefreshing(false);
      }
    }
  }, [indoorLeg]);

  const cardStyle = () => {
    return {
      ...styles.card,
      paddingTop: 20 * currentFontScale,
    };
  };

  const legsArrayToModesResult = (legs, id) => {
    return (
      legs
        .map((l, j) => {
          const join =
            <FontAwesomeIcon
              icon="angle-right"
              size={10 * currentFontScale}
              style={{ marginHorizontal: 10 }}
            />;
          let mode = config.MODES.find(m1 => m1.id.toLowerCase() === l.mode.toLowerCase());
          if (mode && mode.id.toLowerCase() === 'walk' && store.preferences.wheelchair) {
            mode = config.WHEELCHAIR;
          }
          const svg =
            <Svg
              viewBox={mode ? mode.svg.viewBox : config.MODES[0].svg.viewBox}
              width={(15 * deviceMultiplier) * currentFontScale}
              height={(15 * deviceMultiplier) * currentFontScale}
            >
              <Path
                d={mode ? mode.svg.path : config.MODES[0].svg.path}
                fill={Colors.black}
                opacity={0.7}
              />
            </Svg>;
          return (
            <View
              key={id * j}
              style={{
                ...styles.row,
                marginBottom: 2,
              }}
            >
              {svg}
              {l.mode === 'BUS' && l.routeShortName &&
                <View
                  style={{
                    ...styles.transitBubble,
                    backgroundColor: l.routeColor || Colors.primary1,
                    borderColor: l.routeColor || Colors.primary1,
                  }}
                >
                  <Text
                    style={{
                      ...styles.transitLabel,
                      color: l.routeTextColor || Colors.white
                    }}
                  >{l.routeShortName}</Text>
                </View>
              }
              {l.mode === 'TRAM' && l.routeLongName &&
                <View
                  style={{
                    ...styles.transitBubble,
                    borderColor: Colors.black,
                  }}
                >
                  <Text
                    style={styles.transitLabel}
                  >{l.routeLongName}</Text>
                </View>
              }
              {j < legs.length - 1 ? join : null}
            </View>
          );
        })
    );
  };

  const plansArrayToResults = () => {
    const results = plans.map((plan, i) => {
      const legs = plan.legs.filter((l) => {
        if (l.mode === 'WALK') {
          return l.distance > 161;
        }
        return true;
      });
      const modes = [...new Set(plan.legs.map(l => l.mode))];
      const stops = [...new Set(plan.legs.map(l => l.intermediateStops))];
      const id = Date.now();
      let accLabel = translator.t('views.scheduleTrip.results.optionLabel', { number: i + 1 });
      if (plan.shortest) {
        accLabel += ", " + translator.t('views.scheduleTrip.results.shortestTime');
      }
      if (plan.transfers === 0 && plan.legs.filter(l => l.mode === 'BUS').length > 0) {
        accLabel += ", " + translator.t('views.scheduleTrip.results.noTransfers');
      }
      accLabel += ", " + translator.t('global.leave') + " " + moment(plan.startTime).format('h:mm A');
      accLabel += ", " + translator.t('global.arrive') + " " + moment(plan.endTime).format('h:mm A');
      accLabel += ", " + formatters.datetime.asDuration(plan.duration);
      if (modes.length <= 1 && stops.length <= 1) {
        accLabel += ", " + translator.t('views.scheduleTrip.results.noStops');
      }
      else if (modes.length > 1 && stops.length > 1) {
        accLabel += ", " + translator.t('views.scheduleTrip.results.includesStops');
      }
      accLabel += ", " + translator.t('views.scheduleTrip.results.modeCount', { count: modes.length });
      accLabel += ", " + modes.map(m => translator.t(`global.modes.${m.toLowerCase()}`)).join(',');
      return (
        <TouchableOpacity
          key={id}
          style={cardStyle()}
          onPress={() => {
            store.trip.selectPlan(plan);
            // console.log('RESULTS: select plan', JSON.stringify(plan));
            store.mapManager.setCurrentMap('selected');
            store.mapManager.setCurrentIndoorMap('selected');
            store.display.showSpinner(0.5);
            navigation.push('schedule.selected');
          }}
          accessibilityLabel={accLabel}
          accessibilityLanguage={store.preferences.language || 'en'}
        >
          <View
            style={styles.row}
          >
            <View>
              <Text
                style={styles.dateTimeDirection}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('global.leave')}</Text>
              <View
                style={styles.detailDateTimeLabel}
              >
                <Text
                  style={styles.dateTimeHourMinute}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{moment(plan.startTime).format('h:mm')}</Text>
                <Text
                  style={styles.dateTimeMeridiem}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{moment(plan.startTime).format('A')}</Text>
              </View>
            </View>

            <FontAwesomeIcon
              style={{ marginHorizontal: 20 }}
              icon="arrow-right"
              color={Colors.darker}
              size={(16 * deviceMultiplier) * Math.min(1.5, currentFontScale)}
            />

            <View>
              <Text
                style={styles.dateTimeDirection}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('global.arrive')}</Text>
              <View
                style={styles.detailDateTimeLabel}
              >
                <Text
                  style={styles.dateTimeHourMinute}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{moment(plan.endTime).format('h:mm')}</Text>
                <Text
                  style={styles.dateTimeMeridiem}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{moment(plan.endTime).format('A')}</Text>
              </View>
            </View>

          </View>

          <View
            style={styles.row}
          >
            {legsArrayToModesResult(legs, id)}
          </View>

          <View
            style={styles.row}
          >
            <Text
              style={styles.detail}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{formatters.datetime.asDuration(plan.duration)}</Text>
            <FontAwesomeIcon
              icon="circle"
              size={(6 * deviceMultiplier) * Math.min(1.5, currentFontScale)}
              style={{ marginHorizontal: 8 * deviceMultiplier }}
            />
            {modes.length <= 1 && stops.length <= 1
              &&
              <>
                <Text
                  style={styles.detail}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{translator.t('views.scheduleTrip.results.noStops')}</Text>
                <FontAwesomeIcon
                  icon="circle"
                  size={(6 * deviceMultiplier) * Math.min(1.5, currentFontScale)}
                  style={{ marginHorizontal: 8 * deviceMultiplier }}
                />
              </>
            }
            {modes.length > 1 && stops.length > 1
              &&
              <>
                <Text
                  style={styles.detail}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{translator.t('views.scheduleTrip.results.includesStops')}</Text>
                <FontAwesomeIcon
                  icon="circle"
                  size={(6 * deviceMultiplier) * Math.min(1.5, currentFontScale)}
                  style={{ marginHorizontal: 8 * deviceMultiplier }}
                />
              </>
            }
            <Text
              style={styles.detail}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.scheduleTrip.results.modeCount', { count: modes.length })}</Text>
          </View>

          {plan.shortest &&
            <Text
              style={styles.calloutLabel}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.scheduleTrip.results.shortestTime')}</Text>
          }
          {plan.transfers === 0 && plan.legs.filter(l => l.mode === 'BUS').length > 0 &&
            <Text
              numberOfLines={1}
              style={styles.calloutLabel}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.scheduleTrip.results.noTransfers')}</Text>
          }

        </TouchableOpacity>
      );
    });
    return (
      <ScrollView
        style={{
          ...styles.content,
          marginBottom: insets.bottom,
        }}
        contentContainerStyle={styles.scrollViewContentContainerStyle}
        refreshControl={
          <RefreshControl
            colors={[Colors.primary3]}
            tintColor={Colors.primary3}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(false);
            }}
          />
        }>
        {results}
      </ScrollView>
    );
  };

  const noResultsContainerStyle = () => {
    return {
      ...styles.noResultsContainer,
      top: insets.top + 100,
    };
  };



  return (
    <View
      style={styles.container}
    >

      <View style={styles.header}>

        <Pressable
          style={styles.headerBackButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.pop();
            }
            else {
              store.mapManager.setCurrentMap('home');
              store.mapManager.setCurrentIndoorMap('results');
              store.trip.reset();
              navigation.reset({
                index: 0,
                routes: [{ name: 'home' }],
              });
            }
          }}
          accessibilityLabel={translator.t('global.backLabelDefault')}
          accessibilityLanguage={store.preferences.language || 'en'}
        >
          <FontAwesomeIcon
            icon="chevron-left"
            size={18 * deviceMultiplier} />
        </Pressable>

        <Text
          style={styles.headerLabel}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{translator.t('views.scheduleTrip.results.header')}</Text>

      </View>

      {plansArrayToResults()}

      {plans.length === 0 && !refreshing &&
        <View
          style={noResultsContainerStyle()}
        >
          <Text
            style={styles.noResultsText}
          >{translator.t('views.scheduleTrip.results.noResults')}</Text>
          <Button
            label={translator.t('views.scheduleTrip.results.backLabel')}
            buttonStyle={{
              backgroundColor: Colors.white,
              borderColor: Colors.white,
            }}
            labelStyle={{
              color: Colors.primary1,
            }}
            onPress={() => {
              navigation.pop();
            }}
          />
        </View>
      }

      {config.INCLUDE_INDOOR &&
        <View style={{
          height: 1,
          backgroundColor: Colors.danger,
          // position: 'absolute',
          // top: 100,
          // right: 0,
          // left: 0,
          // height: 300
        }}>
          <JMapViewMemo
            ref={gotIndoorRef}
            width={1}
            height={1}
            visible={false}
            handleVenueLoaded={handleVenueLoaded}
            handleNavigationPathGenerated={handleNavigationPathGenerated}
            handleSearchDestinationsGenerated={handleSearchDestinationsGenerated}
            mapOptions={config.INDOOR.OPTIONS}
          />
          {/* <JMapView
            ref={gotIndoorRef}
            style={{
              // width: Devices.screen.width,
              // height: 300,
              // visible: true
              width: 1,
              height: 1,
              visible: false
            }}
            onMapMessage={{
              onNavigationPathGenerated: handleNavigationPathGenerated,
              onSearchDestinationsGenerated: handleSearchDestinationsGenerated,
              onVenueLoaded: handleVenueLoaded
            }}
            mapOptions={config.INDOOR.OPTIONS}
          /> */}
        </View>
      }

    </View>
  );
});

Results.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    addListener: PropTypes.func,
  }),
};

export default Results;