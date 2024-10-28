/* eslint-disable react-hooks/exhaustive-deps */
import React, { createRef, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../../stores/RootStore';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Colors, Typography } from '../../styles';
import AddressSearch from '../../components/AddressSearch';
import Input from '../../components/Input';
import Button from '../../components/Button';
import config from '../../config';
import Popup from '../../components/Popup';
import { Picker } from '@react-native-picker/picker';
import simulator from '../../services/simulator';
import TripPlan from '../../models/trip-plan';
import { rides } from '../../services/transport';
import translator from '../../models/translator';
import { JMapView } from 'react-native-ctp-odp';
import { fromGeoJSON } from '../../utils/polyline';

const styles = StyleSheet.create({
  safeArea: {
    position: 'relative',
    flex: 1,
  },
  wrapper: {
    flex: 1,
    paddingHorizontal: 25,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
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
    alignItems: 'center',
  },
  contentText: {
    ...Typography.h5,
    marginVertical: 10,
  },
  shuttleText: {
    ...Typography.h3,
    color: Colors.primary1,
    fontWeight: 'bold',
  },
  addressText: {
    ...Typography.h4,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  hailButtonStyle: {
    marginTop: 20,
    backgroundColor: config.MODES.find(m => m.id === 'hail').color,
    borderColor: config.MODES.find(m => m.id === 'hail').color,
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

const Hail = observer(({
  navigation,
}) => {
  const store = useStore();

  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [selectedToAddress, setSelectedToAddress] = useState(store.hail.dropoff);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [showNumberOfPeople, setShowNumberOfPeople] = useState(false);
  const [numberOfPeopleLabel, setNumberPeopleLabel] = useState('1');

  const toInputRef = createRef();
  const numberOfPeopleInputRef = createRef();

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

  const toRefInputFocus = () => {
    setShowAddressSearch(true);
    toInputRef.current.blur();
  };

  const handleAddressSearchSelect = (result) => {
    setSelectedToAddress(result);
    if (result.venueId) {
      const venue = config.INDOOR.VENUES.find(v => v.id === result.venueId);
      if (venue) {
        let addr = result;
        addr.point = venue.entrances.standard.point;
        store.trip.updateDestination(result);
      }
      else {
        store.trip.updateDestination(result);
      }
    }
    else {
      store.trip.updateDestination(result);
    }
    setShowAddressSearch(false);
  };

  const handleCancelAddressSearch = () => {
    setShowAddressSearch(false);
  };

  const numberOfPeopleInputRefFocus = () => {
    numberOfPeopleInputRef.current.blur();
    setShowNumberOfPeople(true);
  };

  const numberOfPeopleChange = (value) => {
    setNumberOfPeople(value);
    setNumberPeopleLabel(String(value));
  };

  const handleConfirm = () => {
    store.display.showSpinner();
    store.trip.updateWhenAction('asap');
    store.trip.updateWhen(new Date());
    store.trip.generatePlans()
      .then((p) => {
        console.log('results', p);
        let selectedPlan;
        for (let i = 0; i < store.trip.plans.length; i++) {
          const plan = store.trip.plans[i];
          // find a hail leg
          for (let j = 0; j < plan.legs.length; j++) {
            const leg = plan.legs[j];
            if (leg.mode === 'HAIL') {
              selectedPlan = plan;
              break;
            }
          }
          if (selectedPlan) {
            break;
          }
        }
        if (selectedPlan) {
          store.trip.selectPlan(selectedPlan);

          const o_vid = store.trip.request.origin.venueId;
          const d_vid = store.trip.request.destination.venueId;

          const v = [];
          if (o_vid) v.push({ id: o_vid, leg: 'origin' });
          if (d_vid) v.push({ id: d_vid, leg: 'destination' });
          setVenues(v);

          if ((!o_vid && !d_vid) || !config.INCLUDE_INDOOR) {
            scheduleTrip(selectedPlan);
          }
        }
        else {
          Alert.alert(
            'Warning',
            'No trips were found for this shuttle.  You must be in the service area to have a shuttle pick you up at your location.  If you wish to schedule a trip using the shuttle please try in the service area or plan a multi-mode trip from the home view.',
            [
              {
                text: 'OK',
                style: 'cancel',
              },
            ],
          );
          store.display.hideSpinner();
        }
      })
      .catch(e => {
        store.display.hideSpinner();
        console.log('results catch', e);
      });
  };

  const scheduleTrip = async (plan) => {
    try {
      const accessToken = await store.authentication.fetchAccessToken();
      const newTrip = await store.schedule.add(plan, store.trip.request, accessToken);
      simulator.setTripPlan(new TripPlan(store.trip.selectedPlan));
      summon();
    } catch (e) {
      console.log('schedule trip error', e);
      store.display.hideSpinner();
    }
  };

  const summon = async () => {
    const userId = store.authentication.user?.id;
    const organizationId = config.ORGANIZATION;
    const datetime = Date.now();
    const direction = 'leave';
    const startLocation = store.trip.request.origin.point;
    const pickup = {
      address: store.trip.request.origin.text,
      coordinates: [startLocation.lng, startLocation.lat],
    };
    const endLocation = store.trip.request.destination.point;
    const dropoff = {
      address: store.trip.request.destination.text,
      coordinates: [endLocation.lng, endLocation.lat],
    };
    // const driverId = null; // don't let the user pick
    const driverId = 'd95c52b6-ee0d-44f1-9148-7c77971a4653';
    const passengers = numberOfPeople;
    const accessToken = await store.authentication.fetchAccessToken();
    const result = await rides.request(userId, organizationId, datetime, direction, pickup, dropoff, driverId, passengers, accessToken);
    console.log('summon completed', result);
    store.display.hideSpinner();
    store.hail.setRide(result);
    store.mapManager.setCurrentMap('navigator');
    store.mapManager.setCurrentIndoorMap('navigator');
    store.display.showSpinner(0.5);
    navigation.push('navigator');
  };

  // BEGIN INDOOR MAP
  const indoorMapRef = useRef();
  const [venues, setVenues] = useState([]);
  const [indoorLeg, setIndoorLeg] = useState();
  const [indoorReady, setIndoorReady] = useState(false);
  const [venueLoaded, setVenueLoaded] = useState(false);
  const [indoorDestinations, setIndoorDestinations] = useState([]);

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
      console.log('HAIL: cleanup');
      indoorMapRef.current = null;
    }
  }, []);

  const gotIndoorRef = (ref) => {
    if (!indoorMapRef.current && store.mapManager.currentIndoorMap === 'hail') {
      indoorMapRef.current = ref;
      console.log('HAIL: got indoor ref');
      setIndoorReady(true);
    }
  };

  useEffect(() => {
    if (indoorMapRef.current && indoorReady && venues.length > 0) {
      const venueId = venues[0].id;
      const venue = config.INDOOR.VENUES.find(v => v.id === venueId);
      let credentials = { ...venue.credentials };
      credentials.venueId = venueId;
      console.log('HAIL: set venue', venueId, credentials);

      indoorMapRef.current.setMapVenue(credentials, config.INDOOR.OPTIONS);
    }
  }, [indoorMapRef, indoorReady, venues]);

  const handleVenueLoaded = useCallback((venueId) => {
    console.log('HAIL: venue loaded', venueId);
    setVenueLoaded(true);
  }, [venueLoaded]);

  const handleSearchDestinationsGenerated = useCallback((destinations) => {
    if (indoorMapRef.current && store.mapManager.currentIndoorMap === 'hail') {
      console.log('HAIL: search destinations generated');
      setIndoorDestinations(destinations);
    }
  }, []);

  useEffect(() => {
    if (indoorDestinations.length > 0 && indoorMapRef.current && venueLoaded && store.mapManager.currentIndoorMap === 'hail' && venues.length > 0) {
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
        console.log('HAIL: get wayfinding path', startWaypointId, endWaypointId);
        indoorMapRef.current.wayfindBetweenWaypoints(startWaypointId, endWaypointId);
      }
    }
  }, [indoorDestinations, venueLoaded]);

  const handleNavigationPathGenerated = useCallback((pathId, instructions, start, end, path, geojson) => {
    if (indoorMapRef.current && pathId && store.mapManager.currentIndoorMap === 'hail') {
      console.log('HAIL: navigation path generated');
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
      setIndoorLeg(_indoorLeg);
      indoorMapRef.current.drawNavigationPath(pathId, getNavigationPathStyle());
    }
  }, [venues]);

  useEffect(() => {
    if (indoorLeg && store.mapManager.currentIndoorMap === 'hail') {
      console.log('HAIL: got indoor plan');

      const currentVenue = venues[0];
      if (currentVenue.leg === 'origin') {
        store.trip.prependIndoorToPlans(indoorLeg);
      }
      if (currentVenue.leg === 'destination') {
        store.trip.appendIndoorToPlans(indoorLeg);
      }
      scheduleTrip(store.trip.selectedPlan);
    }
  }, [indoorLeg]);
  // END INDOOR MAP

  return (
    <SafeAreaView
      style={styles.safeArea}
    >

      <View style={styles.wrapper}>

        <View style={styles.header}>

          <Pressable
            style={styles.headerBackButton}
            accessibilityLabel={translator.t('global.backLabelDefault')}
            accessibilityLanguage={store.preferences.language || 'en'}
            onPress={() => {
              store.mapManager.setCurrentIndoorMap('results');
              navigation.pop();
            }}
          >
            <FontAwesomeIcon
              icon="chevron-left"
              size={18} />
          </Pressable>

          <Text style={styles.headerLabel}>{translator.t('views.scheduleTrip.hail.header')}</Text>

        </View>

        <View
          style={styles.content}
        >

          <Text style={styles.contentText}>{translator.t('views.scheduleTrip.hail.contextText1')}</Text>
          <Text style={styles.shuttleText}>{store.hail?.service?.name}</Text>
          <Text style={styles.contentText}>{translator.t('views.scheduleTrip.hail.contextText2')}</Text>
          <Text style={styles.addressText}>{store.trip?.request?.origin?.text}</Text>
          <Text style={styles.contentText}>{translator.t('views.scheduleTrip.hail.contextText3')}</Text>

          <Input
            ref={toInputRef}
            leftIconName="magnifying-glass"
            // label="To"
            placeholder={translator.t('views.scheduleTrip.hail.searchLabel')}
            value={selectedToAddress && (selectedToAddress?.alias || selectedToAddress?.text)}
            onFocus={toRefInputFocus}
            inputStyle={{
              marginTop: 12,
              width: '100%',
            }}
          />

          <Text style={styles.formLabel}>{translator.t('views.scheduleTrip.hail.formLabel')}</Text>

          <Input
            ref={numberOfPeopleInputRef}
            rightIconName="chevron-down"
            value={numberOfPeopleLabel}
            onFocus={numberOfPeopleInputRefFocus}
            inputStyle={{
              marginTop: 12,
              width: '100%',
            }}
          />

          {/* <Text style={styles.contentText}>By pressing Confirm below you lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vel nunc eget elit porta dictum. Ut consectetur egestas massa, in consequat est tempor eu. Vestibulum porta erat sed mauris bibendum pharetra. </Text> */}

          <Button
            label={translator.t('views.scheduleTrip.hail.confirmLabel')}
            buttonStyle={styles.hailButtonStyle}
            width={200}
            disabled={!selectedToAddress}
            disabledButtonStyle={{
              backgroundColor: Colors.medium,
              borderColor: Colors.medium,
            }}
            onPress={handleConfirm}
          />

        </View>

      </View>

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

      <Popup
        title={translator.t('views.scheduleTrip.hail.peoplePopup')}
        titleStyle={{
          marginBottom: 50,
        }}
        label={numberOfPeopleLabel}
        labelStyle={{
          marginBottom: 0,
        }}
        show={showNumberOfPeople}
        onClosePress={() => {
          setShowNumberOfPeople(false);
        }}
      >
        <Picker
          style={{
            width: '100%',
          }}
          selectedValue={numberOfPeople}
          onValueChange={numberOfPeopleChange}
        >
          <Picker.Item label="1" value={1} />
          <Picker.Item label="2" value={2} />
          <Picker.Item label="3" value={3} />
          <Picker.Item label="4" value={4} />
        </Picker>
      </Popup>

      <AddressSearch
        show={showAddressSearch}
        onAddressSelect={handleAddressSearchSelect}
        onCancelPress={handleCancelAddressSearch}
      />

    </SafeAreaView>
  );
});

Hail.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    pop: PropTypes.func,
  }).isRequired,
};

export default Hail;
