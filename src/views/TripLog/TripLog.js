/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import PropTypes from 'prop-types';
import { useStore } from '../../stores/RootStore';
import Header from '../../components/Header';
import { Colors, Devices, Typography } from '../../styles';
import RadioButtonGroup from '../../components/RadioButtonGroup';
import { ScrollView } from 'react-native-gesture-handler';
import { useIsFirstRender } from '../../utils/isFirstRender';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { formatters } from '../../utils';
import { useIsUserExpired } from '../../utils/isUserExpired';
import config from '../../config';
import { useFontScale } from '../../utils/fontScaling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import translator from '../../models/translator';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 25,
    paddingTop: 65,
  },
  scroll: {
    marginBottom: 40,
  },
  card: {
    minHeight: 90,
    width: '100%',
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 9,
    borderColor: Colors.light,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  cardLeft: {
    flex: 1,
    alignItems: 'center',
  },
  cardMiddle: {
    // flex: 4,
    alignItems: 'center',
    paddingRight: 10
  },
  cardRight: {
    // width: 72,
    flex: 1,
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
  cardButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteCard: {
    borderBottomColor: Colors.dark,
    borderBottomWidth: 1,
    borderTopColor: Colors.dark,
    borderTopWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 13,
    marginBottom: -1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const TripLog = ({
  navigation,
}) => {

  console.log('TripLog render', Date.now());

  const store = useStore();
  // useIsUserExpired(store, navigation);
  const isFirstRender = useIsFirstRender();
  const currentFontScale = useFontScale();
  const insets = useSafeAreaInsets();

  const [view, setView] = useState('activity');
  const [trips, setTrips] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = () => {
    setRefreshing(true);
    store.authentication.fetchAccessToken()
      .then((accessToken) => {
        const from = moment().subtract(1, 'month').valueOf(),
          to = moment(from).add(1, 'month').valueOf();
        store.schedule.getRange(from, to, accessToken)
          .then(() => {
            setTrips(store.schedule.trips);
            setRefreshing(false);
          })
          .catch((e) => {
            console.log(e);
            setRefreshing(false);
          });
      })
      .catch((e) => {
        console.log(e);
        setRefreshing(false);
      });
  }

  const isFavoriteLocation = (id) => {
    return store.favorites.locations.findIndex(l => l.id === id) > -1;
  };

  const isFavoriteTrip = (id) => {
    return store.favorites.trips.findIndex(t => t.id === id);
  };

  const openTripPress = (trip) => {
    // BUG?
    // re-parsing the plan eliminates the mobx strict-mode observable warning
    store.trip.selectPlan(JSON.parse(JSON.stringify(trip.plan)));
    store.trip.setRequest(trip.plan.request);
    store.schedule.selectTrip(trip);
    store.mapManager.setCurrentMap('selected');
    store.mapManager.setCurrentIndoorMap('selected');
    store.display.showSpinner(0.5);
    navigation.push('schedule.selected');
  };

  const openFavoritePress = (trip) => {
    store.schedule.selectTrip(null);
    store.trip.create();
    store.trip.setRequest(trip);
    navigation.push('schedule.plan');
  };

  const cardMiddleStyle = () => {
    return {
      ...styles.cardMiddle,
      flex: currentFontScale < 1.35 ? 4 : 3,
    };
  };

  const tripsArrayToCards = () => {
    const cards =
      trips.map((t, i) => {
        const trip = t;
        const plan = trip.plan;
        const request = plan.request;
        const dt = moment(plan?.startTime);
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
            style={styles.card}
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
                  maxFontSizeMultiplier={config.maxFontSizeMultiplier}
                >{dt.format('MMM').toUpperCase()}</Text>
                <Text
                  style={styles.day}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{dt.format('D')}</Text>
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
                    size={20 * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  >{dt.format('MMM').toUpperCase()}</Text>
                  <Text
                    style={styles.day}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  >{dt.format('D')}</Text>
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
                <Text maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{dt.format('h:mm A')}</Text>
                <FontAwesomeIcon
                  icon="circle"
                  size={6}
                  style={{ marginHorizontal: 8 }}
                />
                <Text maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{formatters.datetime.asDuration(plan.duration)}</Text>
              </View>
              {favoriteTrip > -1 &&
                <View style={styles.row}>
                  <Text maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{favoriteTripTitle}</Text>
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
                  style={{ flex: 1, textAlign: 'right' }}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  numberOfLines={1}
                >{originTitle}</Text>
                <FontAwesomeIcon
                  icon="arrow-right"
                  size={12 * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                  style={{ marginHorizontal: 8 }}
                />
                <Text
                  style={{ flex: 1, textAlign: 'left' }}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  numberOfLines={1}
                >{destinationTitle}</Text>
              </View>
            </View>
            {/* <View style={styles.cardRight}>
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.cardButton}
                  onPress={() => {
                    openTripPress(trip);
                  }}
                >
                  <FontAwesomeIcon
                    icon="chevron-right"
                    size={20 * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                  />
                </TouchableOpacity>
              </View>
            </View> */}
          </View >
        );
      });
    return (
      <ScrollView
        style={{
          marginBottom: insets.bottom,
        }}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            colors={[Colors.primary3]}
            tintColor={Colors.primary3}
            refreshing={refreshing}
            onRefresh={fetchTrips}
          />
        }
      >
        {cards}
      </ScrollView>
    );
  };

  const favoritesArrayToCards = () => {
    const cards = store.favorites.trips.map((t) => {
      const originTitle =
        isFavoriteLocation(t.origin.id) ? t.origin.alias : t.origin.text;
      const destinationTitle =
        isFavoriteLocation(t.destination.id) ? t.destination.alias : t.destination.text;
      return (
        <View
          key={t.id}
          style={styles.favoriteCard}
        >
          <View style={styles.cardLeft}>
            <FontAwesomeIcon
              icon="star"
              size={20 * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
              color={Colors.primary1}
            />
          </View>
          <View
            style={{
              ...styles.cardMiddle,
              flex: 4,
            }}
            accessible={true}
            accessibilityLabel={
              `${t.alias}. ${originTitle} ${translator.t('global.toLabel')} ${destinationTitle}`
            }
            accessibilityLanguage={store.preferences.language || 'en'}
          >
            <Text maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{t.alias}</Text>
            <View
              style={styles.row}
            >
              <Text
                style={{ flex: 1, textAlign: 'right' }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                numberOfLines={1}
              >{originTitle}</Text>
              <FontAwesomeIcon
                icon="arrow-right"
                size={12 * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                style={{ marginHorizontal: 8 }}
              />
              <Text
                style={{ flex: 1, textAlign: 'left' }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                numberOfLines={1}
              >{destinationTitle}</Text>
            </View>
          </View>
          <View style={{
            ...styles.cardRight,
            flex: 1,
            alignItems: 'flex-end',
          }}>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.cardButton}
                onPress={() => {
                  openFavoritePress(t);
                }}
                accessible={true}
                accessibilityLabel={translator.t('views.tripLog.planLabel')}
                accessibilityLanguage={store.preferences.language || 'en'}
              >
                <FontAwesomeIcon
                  icon="chevron-right"
                  size={20 * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    });
    return (
      <ScrollView
        style={styles.scroll}
      >
        {cards}
      </ScrollView>
    );
  };

  return (
    <View
      style={styles.container}
    >
      <Header
        title={translator.t('views.tripLog.header')}
        backLabel={translator.t('global.backLabelDefault')}
        onBackPress={() => {
          navigation.pop();
        }}
      />

      <RadioButtonGroup
        style={{
          marginBottom: 30,
        }}
        items={[{
          label: translator.t('views.tripLog.activity'),
          value: 'activity',
        }, {
          label: translator.t('views.tripLog.favorites'),
          value: 'favorites',
        }]}
        value={'activity'}
        onChange={(value) => {
          setView(value);
        }}
      />

      {view === 'activity' &&
        tripsArrayToCards()
      }

      {view === 'favorites' &&
        favoritesArrayToCards()
      }

    </View>

  );
};

TripLog.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default TripLog;
