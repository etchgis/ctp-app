/* eslint-disable react-hooks/exhaustive-deps */
import React, { createRef, useEffect, useState } from 'react';
import { ActivityIndicator, NativeModules, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { useStore } from '../../stores/RootStore';
import BottomMenu from '../../components/BottomMenu';
import { Colors, Typography } from '../../styles';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { formatters } from '../../utils';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScheduleTripDropdown from '../../components/ScheduleTripDropdown';
import TripHistoryButton from '../../components/TripHistoryButton';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Map from '../../components/Map';
import config from '../../config';
import bbox from '@turf/bbox';
import buffer from '@turf/buffer';
import bboxPolygon from '@turf/bbox-polygon';
import { Path, Svg } from 'react-native-svg';
import { useFontScale } from '../../utils/fontScaling';
import { deviceMultiplier } from '../../styles/devices';
import { isTablet } from 'react-native-device-info'
import translator from '../../models/translator';
import { set } from 'mobx';

const MapboxGL = { ...NativeModules.Mapbox };

let _mapboxReady = false;
MapboxGL.setAccessToken(config.MAP.MAPBOX_TOKEN).then(() => {
  _mapboxReady = true;
});

const MENU_HEIGHT = 45 * deviceMultiplier;

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
    zIndex: 90,
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
    left: isTablet() ? 100 : 20,
  },
  tripHistoryButton: {
    position: 'absolute',
    right: isTablet() ? 40 : 20,
    zIndex: 1000
  },
  scheduleContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
    backgroundColor: Colors.secondary2,
    paddingHorizontal: 12,
    paddingTop: 69,
    paddingBottom: 22,
  },
  footer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.white,
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
  upcomingTripTitle: {
    ...Typography.h6,
    marginBottom: 25,
  },
  scrollViewContentContainerStyle: {
    paddingBottom: 50,
    paddingHorizontal: 10,
  },
  card: {
    // height: 90,
    width: '100%',
    backgroundColor: Colors.white,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
    borderBottomColor: Colors.light,
    borderBottomWidth: 1,
  },
  firstCard: {
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  lastCard: {
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  cardLeft: {
    flex: 1,
    alignItems: 'center',
  },
  cardMiddle: {
    // flex: 4,
    alignItems: 'center',
  },
  cardRight: {
    width: 72 * deviceMultiplier,
  },
  cardTop: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  month: {
    ...Typography.h3,
  },
  day: {
    ...Typography.h1,
    marginBottom: 0,
  },
  middleText: {
    ...Typography.h5
  },
  cardButton: {
    width: 36 * deviceMultiplier,
    height: 36 * deviceMultiplier,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteTitle: {
    ...Typography.h3,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  activeCard: {
    width: '100%',
    backgroundColor: Colors.white,
    alignItems: 'center',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: 40,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 16,
    width: '100%',
  },
  activeCardHeaderText: {
    ...Typography.h4,
    fontWeight: 'bold',
    flex: 1,
  },
  activeCardMapContainer: {
    height: 120,
    width: '100%',
  },
  activeCardContent: {
    paddingHorizontal: 10,
    paddingVertical: 16,
    borderBottomColor: Colors.light,
    borderBottomWidth: 1,
    width: '100%',
  },
  activeCardContentLeft: {
    flex: 3,
  },
  activeCardContentRight: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%',
  },
  activeCardContentTitle: {
    fontWeight: 'bold',
    ...Typography.h6
  },
  activeCardContentText: {
    ...Typography.h6
  },
  activeCardFooter: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  activeCardLink: {
    paddingVertical: 4,
  },
  activeCardLinkText: {
    color: Colors.primary1,
    fontWeight: 'bold',
    ...Typography.h6
  },
  refreshActiveTripButton: {
    padding: 2,
  },
});

const Schedule = observer(({
  navigation,
}) => {

  const store = useStore();
  const currentFontScale = useFontScale();
  const insets = useSafeAreaInsets();

  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showSave, setShowSave] = useState(false);
  const [favoriteName, setFavoriteName] = useState('My Trip');
  const [refreshing, setRefreshing] = useState(false);
  const [currentDropDownHeight, setCurrentDropdownHeight] = useState(0);
  const [currentTripHistoryButtonHeight, setCurrentTripHistoryButtonHeight] = useState(0);

  const favoriteInputRef = createRef();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', (e) => {
      fetchTrips();
    });
  
    return unsubscribe;
  }, [navigation]);

  const fetchTrips = () => {
    console.log('fetch trips');
    setRefreshing(true);
    store.authentication.fetchAccessToken()
      .then((accessToken) => {
        const from = moment().second(0).subtract(5, 'minute').valueOf(),
          to = moment(from).add(1, 'month').valueOf();
        store.schedule.getRange(from, to, accessToken)
          .then(() => {
            console.log('fetch trips success', store.schedule.trips.length);
            setTrips(store.schedule.trips);
            console.log('getActiveTrip');
            getActiveTrip();
            setRefreshing(false);
          })
          .catch((e) => {
            console.log('fetch trips error', e);
            setRefreshing(false);
          });
      })
      .catch((e) => {
        console.log('fetch access token error', e);
        setRefreshing(false);
      });
  };

  const getActiveTrip = () => {
    if (store.schedule.trips.length > 0) {
      const trip = store.schedule.trips[0],
        dt = new moment(trip?.plan?.startTime),
        now = new moment(),
        dur = moment.duration(dt.diff(now)).asMinutes();
      setActiveTrip((dur >= -5 && dur < 6) ? trip : null);
    }
    else {
      setActiveTrip(null);
    }
  };

  const openTripPress = (trip) => {
    // BUG?
    // re-parsing the plan eliminates the mobx strict-mode observable warning
    store.trip.selectPlan(JSON.parse(JSON.stringify(trip.plan)));
    store.trip.setRequest(trip.plan.request);
    store.schedule.selectTrip(trip);
    // store.display.showSpinner();
    store.mapManager.setCurrentMap('selected');
    store.mapManager.setCurrentIndoorMap('selected');
    store.display.showSpinner(0.5);
    navigation.push('schedule.selected');
  };

  const toggleSavePress = (trip, isFavorite) => {
    if (isFavorite) {
      store.favorites.removeTrip(trip.plan.request.id);
    }
    else {
      setSelectedTrip(trip);
      setShowSave(true);
    }
  };

  const saveFavoritePress = () => {
    let favorite = { ...selectedTrip.plan.request };
    favorite.alias = favoriteName;
    favorite.id = store.favorites.addTrip(favorite);
    store.display.showSpinner();
    store.authentication.fetchAccessToken()
      .then((accessToken) => {
        store.schedule.updateTripRequest(selectedTrip.id, favorite, accessToken)
          .then((trip) => {
            store.display.hideSpinner();
            setShowSave(false);
            setFavoriteName('My Trip');
          })
          .catch((e) => {
            store.display.hideSpinner();
            setShowSave(false);
            setFavoriteName('My Trip');
          });
      })
      .catch((e) => {
        store.display.hideSpinner();
        setShowSave(false);
        setFavoriteName('My Trip');
      });

  };

  const cancelSaveFavoritePress = () => {
    setShowSave(false);
    setFavoriteName('My Trip');
  };

  const isFavoriteLocation = (id) => {
    return store.favorites.locations.findIndex(l => l.id === id) > -1;
  };

  const isFavoriteTrip = (id) => {
    return store.favorites.trips.findIndex(t => t.id === id);
  };

  const colorScheme = useColorScheme();
  const [mapboxReady, setMapboxReady] = useState(_mapboxReady);
  const [styleReady, setStyleReady] = useState(false);

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

  useEffect(() => {
    if (_mapboxReady) {
      setMapboxReady(true);
    } else {
      waitForAccessToken();
    }
  }, [mapboxReady]);

  const gotRef = (ref) => {
    if (!store.mapManager.map && store.mapManager.currentMap === 'schedule') {
      console.log('got schedule ref');
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

  const cardMiddleStyle = () => {
    return {
      ...styles.cardMiddle,
      flex: currentFontScale < 1.35 ? 4 : 3,
    };
  };

  useEffect(() => {
    if (styleReady && activeTrip) {
      if (store.mapManager.map) {
        store.mapManager.addLayers();
        const plan = activeTrip.plan ? activeTrip.plan : activeTrip;
        var geoJson = store.mapManager.updateSelectedTripLayer(plan, store.preferences.wheelchair);
        if (geoJson) {
          const bbx = bbox(buffer(bboxPolygon(bbox(geoJson)), 1));
          store.mapManager.fitBounds([bbx[2], bbx[3]], [bbx[0], bbx[1]]);
        }
      }
    }
  }, [styleReady, activeTrip]);

  const activeTripCardTitle = (duration) => {
    let intCount =
      duration >= 2 ? Math.round(duration)
        : duration < 2 && duration >= 1 ? 1
          : 0
    return translator.t('views.schedule.schedule.activeTripTitle', { count: intCount });
  }

  const activeTripToCard = () => {
    if (activeTrip) {
      const plan = activeTrip.plan,
        request = plan.request,
        modes = [...new Set(plan.legs.map(l => l.mode))],
        destinationTitle =
          isFavoriteLocation(request.destination.id) ? request.destination.alias : request.destination.text;
      const dt = moment(activeTrip?.plan?.startTime),
        now = moment(),
        dur = moment.duration(dt.diff(now)).asMinutes();
      const arriveTime = moment(activeTrip?.plan?.endTime);
      // let headerTitle = activeTripCardTitle(dur);
      // if (dur >= 2) {
      //   headerTitle += `in ${dur.toFixed(0)} minutes`;
      // }
      // else if (dur < 2 && dur >= 1) {
      //   headerTitle += 'in a minute';
      // }
      // else {
      //   headerTitle += 'now';
      // }
      return (
        <View style={styles.activeCard}>
          <View style={styles.activeCardHeader}>
            <Text
              style={styles.activeCardHeaderText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{activeTripCardTitle(dur)}</Text>
            <TouchableOpacity
              style={styles.refreshActiveTripButton}
              onPress={fetchTrips}
            >
              <FontAwesomeIcon
                icon="rotate-right"
                size={20 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                color={Colors.primary1}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.activeCardMapContainer}>
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
          <View style={styles.activeCardContent}>
            <View style={styles.row}>
              <View style={styles.activeCardContentLeft}>
                <Text
                  style={styles.activeCardContentTitle}
                >{translator.t('views.schedule.schedule.activeTripSubTitle', { time: arriveTime.format('h:mm A') })}</Text>
                <Text
                  style={styles.activeCardContentText}
                >{destinationTitle}</Text>
              </View>
              <View style={styles.activeCardContentRight}>
                {legsArrayToModesResult(modes, Date.now())}
              </View>
            </View>
          </View>
          <View style={styles.activeCardFooter}>
            <TouchableOpacity
              style={styles.activeCardLink}
              onPress={() => {
                openTripPress(activeTrip);
              }}>
              <Text
                style={styles.activeCardLinkText}
              >{translator.t('views.schedule.schedule.activeTripText')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  };

  const tripArrayToCards = () => {
    const cards =
      (trips || [])
        .slice(activeTrip ? 1 : 0, 3)
        .map((t, i) => {
          const trip = t;
          const plan = trip.plan;
          const request = plan.request;
          const dt = moment(trip?.plan?.startTime);
          const favoriteTrip = isFavoriteTrip(request.id);
          let favoriteTripTitle = '';
          if (favoriteTrip > -1) {
            favoriteTripTitle = store.favorites.trips[favoriteTrip]?.alias;
          }
          const originTitle =
            isFavoriteLocation(request.origin.id) ? request.origin.alias : request.origin.text;
          const destinationTitle =
            isFavoriteLocation(request.destination.id) ? request.destination.alias : request.destination.text;
          return (
            <View
              key={trip.id}
              style={{
                ...styles.card,
                ...(i === 0 ? styles.firstCard : {}),
                ...(i === trips.length - 1 ? styles.lastCard : {}),
              }}
            >
              {currentFontScale < 1.78 &&
                <View
                  style={styles.cardLeft}
                  accessible={true}
                  accessibilityLabel={
                    formatters.datetime.format(dt, 'MMMM', store.preferences.language).toUpperCase() +
                    ' ' +
                    formatters.datetime.format(dt, 'D', store.preferences.language)
                  }
                  accessibilityLanguage={store.preferences.language || 'en'}
                >
                  <Text
                    style={styles.month}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  >{formatters.datetime.format(dt, 'MMM', store.preferences.language).toUpperCase()}</Text>
                  <Text
                    style={styles.day}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  >{formatters.datetime.format(dt, 'D', store.preferences.language)}</Text>
                </View>
              }
              <View style={cardMiddleStyle()}>
                {currentFontScale > 1.78 &&
                  <View
                    style={styles.cardTop}
                    accessible={true}
                    accessibilityLabel={
                      formatters.datetime.format(dt, 'MMMM', store.preferences.language).toUpperCase() +
                      ' ' +
                      formatters.datetime.format(dt, 'D', store.preferences.language)
                    }
                    accessibilityLanguage={store.preferences.language || 'en'}
                  >
                    <Text
                      style={styles.month}
                      maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                    >{formatters.datetime.format(dt, 'MMM', store.preferences.language).toUpperCase()}</Text>
                    <Text
                      style={styles.day}
                      maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                    >{formatters.datetime.format(dt, 'D', store.preferences.language)}</Text>
                  </View>
                }
                <View
                  style={styles.row}
                  accessible={true}
                  accessibilityLabel={
                    formatters.datetime.format(dt, 'h:mm A', store.preferences.language).toUpperCase() +
                    ', ' +
                    formatters.datetime.asDurationLong(plan.duration)
                  }
                  accessibilityLanguage={store.preferences.language || 'en'}
                >
                  <Text
                    style={styles.middleText}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  >{formatters.datetime.format(dt, 'h:mm A', store.preferences.language).toUpperCase()}</Text>
                  <FontAwesomeIcon
                    icon="circle"
                    size={6 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                    style={{ marginHorizontal: 8 * deviceMultiplier }}
                  />
                  <Text
                    style={styles.middleText}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  >{formatters.datetime.asDuration(plan.duration)}</Text>
                </View>
                {favoriteTrip > -1 &&
                  <View style={styles.row}>
                    <Text
                      style={styles.middleText}
                      maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                    >{favoriteTripTitle}</Text>
                  </View>
                }
                <View
                  style={styles.row}
                  accessible={true}
                  accessibilityLabel={
                    `${originTitle} ${translator.t('global.toLabel')} ${destinationTitle}`
                  }
                  accessibilityLanguage={store.preferences.language || 'en'}
                >
                  <Text
                    style={{
                      ...styles.middleText,
                      flex: 1,
                      textAlign: 'right'
                    }}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                    numberOfLines={1}
                  >{originTitle}</Text>
                  <FontAwesomeIcon
                    icon="arrow-right"
                    size={12 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                    style={{ marginHorizontal: 8 }}
                  />
                  <Text
                    style={{
                      ...styles.middleText,
                      flex: 1,
                      textAlign: 'left'
                    }}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                    numberOfLines={1}
                  >{destinationTitle}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.cardButton}
                    onPress={() => {
                      toggleSavePress(trip, favoriteTrip > -1);
                    }}
                    accessibilityLabel={
                      favoriteTrip > -1 ?
                        translator.t('views.schedule.schedule.favoriteDeleteLabel') :
                        translator.t('views.schedule.schedule.favoriteSaveLabel')
                    }
                    accessibilityLanguage={store.preferences.language || 'en'}
                  >
                    <FontAwesomeIcon
                      icon="star"
                      size={20 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                      color={favoriteTrip > -1 ? Colors.primary1 : Colors.light}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cardButton}
                    onPress={() => {
                      openTripPress(trip);
                    }}
                    accessibilityLabel={translator.t('views.schedule.schedule.openTripLabel')}
                    accessibilityLanguage={store.preferences.language || 'en'}
                  >
                    <FontAwesomeIcon
                      icon="chevron-right"
                      size={20 * deviceMultiplier}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View >
          );
        });
    return cards;
  };

  const legsArrayToModesResult = (modes, id) => {
    return (
      modes
        .map((m, j) => {
          const join =
            <FontAwesomeIcon
              icon="angle-right"
              size={10 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
              style={{
                marginHorizontal: 6,
              }}
            />;
          let mode = config.MODES.find(m1 => m1.id.toLowerCase() === m.toLowerCase());
          if (mode && mode.id.toLowerCase() === 'walk' && store.preferences.wheelchair) {
            mode = config.WHEELCHAIR;
          }
          const svg =
            <Svg
              width={20 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale) * 0.7}
              height={20 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale) * 0.7}
              viewBox={mode ? mode.svg.viewBox : config.MODES[0].svg.viewBox}
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
                marginBottom: 4,
              }}
            >
              {svg}
              {j < modes.length - 1 ? join : null}
            </View>
          );
        })
    );
  };

  const headerStyle = () => {
    return {
      ...styles.header,
      height: styles.header.height + insets.top,
      paddingTop: insets.top,
    };
  };

  const scheduleContainerStyle = () => {
    return {
      ...styles.scheduleContainer,
      top: styles.header.height + insets.top,
      bottom: styles.footer.bottom + insets.bottom + 45,
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

  const handleDropdownOnLayout = (e) => {
    if (currentDropDownHeight !== e.nativeEvent.layout.height) {
      setCurrentDropdownHeight(e.nativeEvent.layout.height);
    }
  };

  const tripHistoryButtonStyle = () => {
    return {
      ...styles.tripHistoryButton,
      top: -currentTripHistoryButtonHeight / 1.5
    }
  }

  const handleTripHistoryButtonOnLayout = (e) => {
    if (currentTripHistoryButtonHeight !== e.nativeEvent.layout.height) {
      setCurrentTripHistoryButtonHeight(e.nativeEvent.layout.height);
    }
  };

  return (
    <>

      <View style={styles.container}>

        <View style={headerStyle()}>

          <Text
            style={styles.title}
            maxFontSizeMultiplier={1}
          >
            <Text
              style={styles.titleGreeting}
            >{translator.t('views.schedule.schedule.greeting')}{' '}</Text>
            {store.authentication.loggedIn &&
              <Text style={{ fontWeight: 'bold' }}>{store?.profile?.firstName}</Text>
            }
            {!store.authentication.loggedIn &&
              <Text>{translator.t('views.schedule.schedule.greetingGuest')}</Text>
            }
          </Text>

          <View style={dropdownStyle()}>
            <ScheduleTripDropdown
              onLayout={handleDropdownOnLayout}
              loggedIn={store.authentication.loggedIn}
              favoriteTrips={store.favorites.trips}
              onScheduleTripPress={() => {
                navigation.push('schedule.plan');
              }}
              onFavoriteTripPress={(trip) => {
                store.trip.create();
                store.trip.setRequest(trip);
                store.schedule.selectTrip(null);
                navigation.push('schedule.plan');
              }}
            />
          </View>

        </View>

        <View style={scheduleContainerStyle()}>

          <ScrollView
            contentContainerStyle={styles.scrollViewContentContainerStyle}
            refreshControl={
              <RefreshControl
                colors={[Colors.primary3]}
                tintColor={Colors.primary3}
                refreshing={refreshing}
                onRefresh={fetchTrips}
              />
            }>

            {activeTrip && activeTripToCard()}

            <Text
              style={styles.upcomingTripTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{
                trips.length > 0 ?
                  translator.t('views.schedule.schedule.titleA') :
                  translator.t('views.schedule.schedule.titleB')
              }</Text>

            {tripArrayToCards()}

          </ScrollView>

        </View>

        <View style={footerStyle()}>

          <View style={tripHistoryButtonStyle()}>
            <TripHistoryButton
              onLayout={handleTripHistoryButtonOnLayout}
              onPress={() => {
                navigation.push('tripLog');
              }}
            />
          </View>

          <BottomMenu
            navigation={navigation}
            loggedIn={store.authentication.loggedIn}
          />

        </View>

      </View>

      <Modal
        show={showSave}
        height={250}
      >
        <Text
          style={styles.favoriteTitle}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >Trip Name</Text>
        <Input
          ref={favoriteInputRef}
          placeholder="Name your favorite trip"
          value={favoriteName}
          onChangeText={(value) => {
            setFavoriteName(value);
          }}
          inputStyle={{
            marginBottom: 20,
            width: '100%',
          }}
        />
        <Button
          label="Save"
          width={150}
          onPress={saveFavoritePress}
        />
        <Button
          label="Cancel"
          width={150}
          buttonStyle={{
            backgroundColor: Colors.white,
            borderColor: Colors.white,
          }}
          labelStyle={{
            color: Colors.primary1,
          }}
          onPress={cancelSaveFavoritePress}
        />
      </Modal>

    </>
  );

});

Schedule.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default Schedule;
