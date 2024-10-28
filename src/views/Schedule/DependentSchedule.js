/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { useStore } from '../../stores/RootStore';
import { Colors, Devices, Typography } from '../../styles';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { formatters } from '../../utils';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/Header';

const TOP_HEIGHT = 80;
const MENU_HEIGHT = 45;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.danger,
  },
  title: {
    ...Typography.h1,
  },
  titleGreeting: {
    fontStyle: 'italic',
    fontWeight: '200',
  },
  scheduleContainer: {
    flex: 1,
    backgroundColor: Colors.secondary2,
    paddingHorizontal: 22,
    paddingTop: 69,
    paddingBottom: 22,
  },
  upcomingTripTitle: {
    ...Typography.h6,
    marginBottom: 25,
  },
  card: {
    height: 90,
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
    flex: 4,
    alignItems: 'center',
  },
  cardRight: {
    width: 42,
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
  favoriteTitle: {
    ...Typography.h3,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

const DependentSchedule = observer(({
  navigation,
}) => {

  const store = useStore();

  const [selectedTrip, setSelectedTrip] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchTrips();
    }, [])
  );

  const fetchTrips = () => {
    store.authentication.fetchAccessToken()
      .then((accessToken) => {
        const dependentId = store.traveler.selectedDependent.dependent,
          from = moment().second(0).subtract(5, 'minute').valueOf(),
          to = moment(from).add(1, 'month').valueOf();
        store.schedule.getDependentSchedule(dependentId, from, to, accessToken)
          .then(() => {
            if (store.schedule.trips.length > 0) {
            }
          })
          .catch((e) => {
            console.log('fetch trips error', e);
          });
      })
      .catch((e) => {
        console.log('fetch access token error', e);
      });
  };

  const openTripPress = (trip) => {
    // BUG?
    // re-parsing the plan eliminates the mobx strict-mode observable warning
    store.trip.selectPlan(JSON.parse(JSON.stringify(trip.plan)));
    store.trip.setRequest(trip.plan.request);
    store.schedule.selectTrip(trip);
    navigation.push('tracker');
  };

  const tripArrayToCards = () => {
    const cards =
      (store.schedule.dependentTrips || [])
        .slice(0, 3)
        .map((t, i) => {
          const trip = t;
          const plan = trip.plan;
          const request = plan.request;
          const dt = moment(trip?.plan?.startTime);
          const originTitle = request.origin.text;
          const destinationTitle = request.destination.text;
          return (
            <View
              key={trip.id}
              style={{
                ...styles.card,
                ...(i === 0 ? styles.firstCard : {}),
                ...(i === store.schedule.trips.length - 1 ? styles.lastCard : {}),
              }}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.month}>{dt.format('MMM').toUpperCase()}</Text>
                <Text style={styles.day}>{dt.format('D')}</Text>
              </View>
              <View style={styles.cardMiddle}>
                <View style={styles.row}>
                  <Text>{dt.format('h:mm A')}</Text>
                  <FontAwesomeIcon
                    icon="circle"
                    size={6}
                    style={{ marginHorizontal: 8 }}
                  />
                  <Text>{formatters.datetime.asDuration(plan.duration)}</Text>
                </View>
                <View style={styles.row}>
                  <Text
                    style={{ flex: 1, textAlign: 'right' }}
                    numberOfLines={1}
                  >{originTitle}</Text>
                  <FontAwesomeIcon
                    icon="arrow-right"
                    size={12}
                    style={{ marginHorizontal: 8 }}
                  />
                  <Text
                    style={{ flex: 1, textAlign: 'left' }}
                    numberOfLines={1}
                  >{destinationTitle}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                {/* <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.cardButton}
                    onPress={() => {
                      openTripPress(trip);
                    }}
                  >
                    <FontAwesomeIcon
                      icon="play"
                      size={20}
                      color={Colors.primary1}
                    />
                  </TouchableOpacity>
                </View> */}
              </View>
            </View >
          );
        });
    return cards;
  };

  return (
    <SafeAreaView
      style={{ flex: 1 }}
    >

      {/* TODO: TEMP REMOVE THIS AND KEEP CONSISTENT ACROSS ALL VIEWS WITH SAFEAREAVIEW */}
      <View
        style={{
          paddingHorizontal: 25,
        }}
      >
        <Header
          title={`${store.traveler?.selectedDependent?.firstName || ''} ${store.traveler?.selectedDependent?.lastName || ''}`}
          onBackPress={() => {
            navigation.pop();
          }}
        />
      </View>

      <View
        style={styles.mainContainer}
      >

        <View
          style={styles.scheduleContainer}
        >
          <Text style={styles.upcomingTripTitle}>UPCOMING TRIPS</Text>

          {tripArrayToCards()}

        </View>

      </View>

    </SafeAreaView>
  );

});

DependentSchedule.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default DependentSchedule;
