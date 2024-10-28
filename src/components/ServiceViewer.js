/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { PixelRatio, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Devices, Typography } from '../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import moment from 'moment';
import config from '../config';
import Button from './Button';
import formatters from '../utils/formatters';
// import debounce from '../utils/debounce';
import { mobility } from '@etchgis/mobility-transport-layer';
import { debounce } from 'lodash';
import { useFontScale } from '../utils/fontScaling';
import { isTablet } from 'react-native-device-info';
import { useFocusEffect } from '@react-navigation/native';
import translator from '../models/translator';
import { useStore } from '../stores/RootStore';
import LocationData from '../models/location-data';
import booleanContains from '@turf/boolean-contains';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    // borderTopColor: Colors.primary3,
    // borderTopWidth: 3,
    borderBottomColor: Colors.light,
    borderBottomWidth: 1,
  },
  spinnerContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    opacity: 0.5,
    zIndex: 90,
  },
  scroll: {
    // paddingTop: 10,
  },
  backButton: {
    backgroundColor: Colors.primary1,
    // width: 40 * (FONT_SCALE > 1.5 ? 1.5 : 1),
    // height: 40 * (FONT_SCALE > 1.5 ? 1.5 : 1),
    position: 'absolute',
    // top: -(40 * (FONT_SCALE > 1.5 ? 1.5 : 1)) / 2,
    left: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // borderRadius: (40 * (FONT_SCALE > 1.5 ? 1.5 : 1)) / 2,
    borderColor: Colors.primary1,
    borderWidth: 1,
    zIndex: 20,
  },
  routeLabelContainer: {
    position: 'absolute',
    // top: -35 * (FONT_SCALE > 1.5 ? 1.5 : 1),
    right: 7,
    zIndex: 20,
    // width: 60 * (FONT_SCALE > 1.5 ? 1.5 : 1),
    // height: 60 * (FONT_SCALE > 1.5 ? 1.5 : 1),
    // borderRadius: (60 * (FONT_SCALE > 1.5 ? 1.5 : 1)) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 4,
  },
  routeLabel: {
    ...Typography.h2,
    marginBottom: 0,
    fontWeight: 'bold',
  },
  routeEtaLabel: {
    position: 'absolute',
    bottom: -23,
    right: -20,
    width: 80,
    ...Typography.h4,
    fontWeight: 'bold',
  },
  serviceButton: {
    minHeight: 60,
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomColor: Colors.white,
    borderBottomWidth: 1,
  },
  serviceButtonTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceButtonBottom: {

  },
  serviceName: {
    ...Typography.h1,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  serviceTime: {
    textAlign: 'right',
    ...Typography.h6,
  },
  serviceStop: {
    ...Typography.h6,
  },
  serviceStopCode: {
    fontWeight: 'bold',
  },
  serviceDestination: {
    ...Typography.h5,
  },
  hailName: {
    ...Typography.h3,
  },
  stopButton: {
    minHeight: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomColor: Colors.white,
    borderBottomWidth: 1,
  },
  stopButtonLeft: {
    flex: 1,
  },
  stopButtonRight: {
    alignItems: 'flex-end',
  },
  stopName: {
    ...Typography.h3,
  },
  stopCode: {
    ...Typography.h5,
    fontWeight: 'bold',
  },
  stopRoutes: {
    ...Typography.h6,
  },
  stopTime: {
    ...Typography.h4,
  },
  svgContainer: {
    width: 50,
    marginRight: 10,
  },
  hailContainer: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hailButtonStyle: {
    backgroundColor: config.MODES.find(m => m.id === 'hail').color,
    borderColor: config.MODES.find(m => m.id === 'hail').color,
    width: PixelRatio.getPixelSizeForLayoutSize(100),
  },
  hailText: {
    ...Typography.h5,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  hailTextAddress: {
    ...Typography.h4,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.primary1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginTop: 20,
  },
  cancelHailButtonStyle: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
});

const ServiceViewer = ({
  authenticated,
  // position,
  location,
  // services,
  // feed,
  onServiceSelected,
  onSelectedServiceRefresh,
  onStopPress,
  onBackPress,
  onHailPress,
}) => {

  const store = useStore();
  const currentFontScale = useFontScale();

  const [showStops, setShowStops] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceFeed, setSelectedServiceFeed] = useState(null);
  const [filteredStops, setFilteredStops] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [inCommunityShuttleArea, setInCommunityShuttleArea] = useState(false);
  const [inCommunityShuttleTimeframe, setInCommunityShuttleTimeframe] = useState(false);

  const _intervalRef = useRef();

  const debounced = useCallback(
    debounce(() => getClosestServices(location), 500),
    [location],
  );

  useEffect(() => {
    if (location.lng && location.lat) {
      debounced();
    }
  }, [location]);

  useEffect(() => {
    if (!showStops) {
      setFilteredStops([]);
      setSelectedService(null);
    }
  }, [showStops]);

  const getClosestServices = (point) => {
    if (point.lng && point.lat) {
      setRefreshing(true);
      mobility.skids.services.byDistance(point.lng, point.lat, 0.5, 'COMPLETE_TRIP')
        .then(values => {
          console.log('got service: count', values.length);
          setServices(values);
          setRefreshing(false);
        })
        .catch(e => {
          console.log('skids service error', e);
          setRefreshing(false);
        });
    }
  };

  const handleBackButtonPress = () => {
    clearInterval(_intervalRef.current);
    _intervalRef.current = null;
    setShowStops(false);
    setSelectedService(null);
    setSelectedServiceFeed(null);
    if (onBackPress) {
      onBackPress();
    }
  };

  const handleServicePress = (service) => {
    setShowStops(true);
    setSelectedService(service);
    if (service.service && service.route) {
      console.log('service:', service.route.patternId);
      getRoute(service.service, service.route.patternId);
    }
    if (service.service && service.mode === 'shuttle' && onServiceSelected) {
      onServiceSelected(service, null);
    }
    const hdsStart = moment().hour(config.HDS_HOURS.start[0]).minute(config.HDS_HOURS.start[1]).second(0),
      hdsEnd = moment().hour(config.HDS_HOURS.end[0]).minute(config.HDS_HOURS.end[1]).second(0);
    const inTimeframe = moment().isAfter(hdsStart) && moment().isBefore(hdsEnd);
    setInCommunityShuttleTimeframe(inTimeframe);
  };

  const getRoute = (serviceId, patternId) => {
    setRefreshing(true);
    mobility.skids.feeds.get(serviceId, patternId, 'COMPLETE_TRIP')
      .then(result => {
        setSelectedServiceFeed(result);
        setRefreshing(false);
      })
      .catch(e => {
        console.log('skids feed error', e);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    if (selectedService && selectedServiceFeed && selectedServiceFeed?.stops?.length > 0) {
      setFilteredStops(getFilteredStops(selectedService, selectedServiceFeed));
      if (onServiceSelected && !_intervalRef.current) {
        console.log('service and feed selected');
        onServiceSelected(selectedService, selectedServiceFeed);
      }
      refreshRoute(selectedService);
    }
  }, [selectedService, selectedServiceFeed]);

  const getFilteredStops = (service, feed) => {
    let gotFirst = false;
    let fStops = [];
    for (var i = 0; i < feed.stops.length; i++) {
      let stop = feed.stops[i];
      if (gotFirst || stop.stopId === service?.location?.id) {
        console.log(stop.stopId, 'arrivalOffset', stop.arrivalOffset, 'departureOffset', stop.departureOffset);
        gotFirst = true;
        if (feed.stopTimes.currentTimes[i]) {
          stop.arrive = feed.stopTimes.currentTimes[i].arrive;
        }
        if (feed.stopTimes.nextTimes[i]) {
          stop.arriveNext = feed.stopTimes.nextTimes[i].arrive;
        }
        fStops.push(stop);
      }
    }
    return fStops;
  };

  // useEffect(() => {
  //   return () => {
  //     if (_intervalRef.current) {
  //       console.log('unload interval');
  //       clearInterval(_intervalRef.current);
  //       _intervalRef.current = null;
  //     }
  //   };
  // }, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (_intervalRef.current) {
          console.log('unload interval');
          clearInterval(_intervalRef.current);
          _intervalRef.current = null;
        }
      };
    }, []),
  );

  const refreshRoute = (service) => {
    if (!_intervalRef.current) {
      _intervalRef.current = setInterval(() => {
        console.log('refreshing feed', service.service, service.route.patternId);
        mobility.skids.feeds.get(service.service, service.route.patternId, 'COMPLETE_TRIP')
          .then(result => {
            console.log('refreshed feed', result.length);
            if (onSelectedServiceRefresh) {
              onSelectedServiceRefresh(result);
            }
            setSelectedServiceFeed(result);
          })
          .catch(e => {
            console.log('skids feed error', e);
          });
      }, 5000);
    }
  };

  const refreshScrollView = () => {
    // only refresh routes, stops are refreshed every 5 seconds
    if (!showStops) {
      console.log('refresh routes');
      getClosestServices(location);
    }
    else {
      setRefreshing(false);
    }
  };

  const handleStopPress = (stop) => {
    if (onStopPress && stop.stopId && selectedServiceFeed) {
      const selectedStop = selectedServiceFeed?.stops?.find(s => s.stopId === stop.stopId);
      onStopPress(selectedStop);
    }
  };

  const handleHailPress = (service) => {
    if (onHailPress) {
      onHailPress(service);
    }
  };

  useEffect(() => {
    console.log('useEffect services', services.length);
    if (location?.lng && location?.lat) {
      let fc = { ...LocationData.EmptyPoint };
      fc.features[0].geometry.coordinates = [location.lng, location.lat];
      console.log('inside service area');
      setInCommunityShuttleArea(booleanContains(LocationData.NftaCommunityShuttle.features[0], fc.features[0]));
    }
  }, [services]);

  // useEffect(() => {
  //   if (feed && selectedService && feed?.stops?.length > 0) {
  //     let gotFirst = false;
  //     let fStops = [];
  //     for (var i = 0; i < feed.stops.length; i++) {
  //       let stop = feed.stops[i];
  //       if (gotFirst || stop.stopId === selectedService?.location?.id) {
  //         gotFirst = true;
  //         if (feed.stopTimes.currentTimes[i]) {
  //           stop.arrive = feed.stopTimes.currentTimes[i].arrive;
  //         }
  //         if (feed.stopTimes.nextTimes[i]) {
  //           stop.arriveNext = feed.stopTimes.nextTimes[i].arrive;
  //         }
  //         fStops.push(stop);
  //       }
  //     }
  //     setFilteredStops(fStops);
  //   }
  // }, [feed]);

  const timeToDuration = (timestamp) => {
    let diff = timestamp - Date.now();
    return diff / 1000;
  };

  const durationToString = (timestamp) => {
    const diff = timeToDuration(timestamp);
    var hours = Math.floor(diff / 3600);
    var minutes = Math.floor(diff / 60) % 60;
    var seconds = Math.floor(diff) % 60;
    if (hours > 0) {
      if (minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${hours}h`;
      }
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else if (seconds > 0) {
      return `${seconds}s`;
    } else {
      return 'now';
    }
  };

  const durationToStringLong = (timestamp) => {
    const diff = timeToDuration(timestamp);
    var hours = Math.floor(diff / 3600);
    var minutes = Math.floor(diff / 60) % 60;
    var seconds = Math.floor(diff) % 60;
    if (hours > 0) {
      if (minutes > 0) {
        return `${hours} ${translator.t('global.hour', { count: hours })} ${minutes} ${translator.t('global.minute', { count: minutes })}`;
      } else {
        return `${hours} ${translator.t('global.hour', { count: hours })}`;
      }
    } else if (minutes > 0) {
      return `${minutes} ${translator.t('global.minute', { count: minutes })}`;
    } else if (seconds > 0) {
      return `${seconds} ${translator.t('global.second', { count: seconds })}`;
    } else {
      return translator.t('global.now');
    }
  };

  const distanceToString = (kilometers) => {
    // show in miles if less than 1 mile, otherwise show in feet
    var miles = kilometers * 0.621371;
    if (miles < 1) {
      return `${Math.round(miles * 5280)} ft`;
    } else {
      return `${Math.round(miles * 10) / 10} mi`;
    }
  };

  const containerStyle = {
    ...styles.container,
  };

  const backButtonStyle = () => {
    return {
      ...styles.backButton,
      width: (isTablet() ? 80 : 40) * (currentFontScale > 1.5 ? 1.5 : 1),
      height: (isTablet() ? 80 : 40) * (currentFontScale > 1.5 ? 1.5 : 1),
      top: -((isTablet() ? 80 : 40) * (currentFontScale > 1.5 ? 1.5 : 1)) / 2,
      borderRadius: ((isTablet() ? 80 : 40) * (currentFontScale > 1.5 ? 1.5 : 1)) / 2,
    };
  };

  const routeLabelContainerStyle = () => {
    return {
      ...styles.routeLabelContainer,
      top: -(isTablet() ? 60 : 35) * (currentFontScale > 1.5 ? 1.5 : 1),
      width: (isTablet() ? 120 : 60) * (currentFontScale > 1.5 ? 1.5 : 1),
      height: (isTablet() ? 120 : 60) * (currentFontScale > 1.5 ? 1.5 : 1),
      borderRadius: ((isTablet() ? 120 : 60) * (currentFontScale > 1.5 ? 1.5 : 1)) / 2,
      borderColor: selectedService?.color ? `#${selectedService.color}`.trim() : Colors.primary1,
    };
  };

  const getServiceAccessibilityLabel = (service) => {
    if (service.mode === 'shuttle') {
      return translator.t('components.serviceViewer.tapShuttleMessage', { shuttle: service.name });
    }
    else {
      return translator.t('components.serviceViewer.tapRouteMessage', {
        route: service?.route?.subRoute,
        destination: service?.route?.destination,
        stop: `${service.location?.publicCode} ${service.location?.name}`,
        duration: durationToStringLong(service.route.arrive),
        next: moment(service.route.arriveNext).format('h:mm A'),
      });
    }
  }

  const getStopAccessibilityLabel = (stop) => {
    return translator.t('components.serviceViewer.tapStopMessage', {
      stop: `${stop.publicCode} ${stop.name}`,
      routes: stop.routes.join(','),
      next1: moment(stop.arrive).format('h:mm A'),
      next2: moment(stop.arriveNext).format('h:mm A'),
    });
  }

  return (
    <View
      style={containerStyle}
    >
      {showStops &&
        <>
          <TouchableOpacity
            style={backButtonStyle()}
            onPress={handleBackButtonPress}
            accessible={true}
            accessibilityLabel={translator.t('components.serviceViewer.backLabel')}
            accessibilityLanguage={store.preferences.language || 'en'}
          >
            <FontAwesomeIcon
              icon="angle-left"
              size={24 * (currentFontScale > 1.5 ? 1.5 : 1)}
              color={Colors.white}
            />
          </TouchableOpacity>
          <View
            style={routeLabelContainerStyle()}
            accessible={false}
          >
            {selectedService?.mode === 'bus' &&
              <Text
                style={{
                  ...styles.routeLabel,
                  color: selectedService?.color ? `#${selectedService.color}`.trim() : Colors.primary1,
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{selectedService?.route?.subRoute}</Text>
            }
            {selectedService?.mode === 'shuttle' &&
              <>
                <FontAwesomeIcon
                  icon="truck-front"
                  color={config.MODES.find(m => m.id === 'hail').color}
                  size={30}
                />
                <Text
                  style={{
                    ...styles.routeEtaLabel,
                    color: config.MODES.find(m => m.id === 'hail').color,
                  }}
                >{selectedService?.eta ? formatters.datetime.asDuration(selectedService?.eta, false) : ''}</Text>
              </>
            }
          </View>
        </>
      }
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            colors={[Colors.primary3]}
            tintColor={Colors.primary3}
            refreshing={refreshing}
            onRefresh={refreshScrollView}
          />
        }
      >
        {!showStops &&
          services
            .filter(s => {
              if (s?.route?.arrive) {
                return timeToDuration(s?.route?.arrive) <= 7200;
              }
              if (!authenticated && s?.mode === 'shuttle') {
                return false;
              }
              return true;
            })
            .map((s, i) => {
              const backgroundColor = `#${s.color}`.trim();
              const color = `#${s.textColor}`;
              return (
                <TouchableOpacity
                  key={`${i}-${s.id}`}
                  style={{
                    ...styles.serviceButton,
                    backgroundColor,
                  }}
                  onPress={() => {
                    handleServicePress(s);
                  }}
                  accessible={true}
                  accessibilityLabel={getServiceAccessibilityLabel(s)}
                  accessibilityLanguage={store.preferences.language || 'en'}
                >
                  {s.mode === 'bus' &&
                    <>
                      <View
                        style={styles.serviceButtonTop}
                      >
                        <Text style={{ ...styles.serviceName, color }} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{s?.route?.subRoute}</Text>
                        <View>
                          <Text style={{ ...styles.serviceTime, color }} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{s?.route?.arrive ? durationToString(s.route.arrive) : ''}</Text>
                          <Text style={{ ...styles.serviceTime, color }} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{s?.route?.arriveNext ? `${translator.t('global.nextLabel')} ${moment(s.route.arriveNext).format('h:mm A')}` : ''}</Text>
                        </View>
                      </View>
                      {(s?.route || s?.location) &&
                        <View
                          style={styles.serviceButtonBottom}
                        >
                          {s?.route &&
                            <Text style={{ ...styles.serviceDestination, color }} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{s.route?.destination}</Text>
                          }
                          {s?.location &&
                            <Text style={{ ...styles.serviceStop, color }} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>
                              {translator.t('global.stopLabel')}
                              <Text style={styles.serviceStopCode} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{' '}{s.location?.publicCode}{' '}</Text>
                              {s.location?.name}
                              {s?.kilometers &&
                                <Text maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{' ('}{distanceToString(s?.kilometers)}{') '}</Text>
                              }
                            </Text>
                          }
                        </View>
                      }
                    </>
                  }
                  {s.mode === 'shuttle' &&
                    <>
                      <Text style={{ ...styles.hailName, color }} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{s.name}</Text>
                    </>
                  }
                </TouchableOpacity>
              );
            })
        }
        {showStops && selectedService?.mode === 'bus' && filteredStops.map((s, i) => {
          const backgroundColor = selectedService?.color ? `#${selectedService.color}`.trim() : Colors.primary1;
          const color = selectedService?.textColor ? `#${selectedService.textColor}`.trim() : Colors.white;
          return (
            <TouchableOpacity
              key={i}
              style={{
                ...styles.stopButton,
                backgroundColor,
                paddingTop: i === 0 ? 26 : 8,
              }}
              onPress={() => {
                handleStopPress(s);
              }}
              accessible={true}
              accessibilityLabel={getStopAccessibilityLabel(s)}
              accessibilityLanguage={store.preferences.language || 'en'}
            >
              <View
                style={styles.stopButtonLeft}
              >
                <Text style={{ ...styles.stopName, color }} maxFontSizeMultiplier={config.MAX_FONT_SCALE} numberOfLines={1}>{s.name}</Text>
                <Text style={{ ...styles.stopCode, color }} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{s.publicCode}</Text>
                {s?.routes &&
                  <Text style={{ ...styles.stopRoutes, color }} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{`${translator.t('components.serviceViewer.servicingRoutes')} ${s.routes.length !== 0 ? 's' : ''} ${s.routes.join(',')}`}</Text>
                }
              </View>
              <View
                style={styles.stopButtonRight}
              >
                <Text style={{ ...styles.stopTime, color }} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{moment(s.arrive).format('h:mm A')}</Text>
                <Text style={{ ...styles.stopTime, color }} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{moment(s.arriveNext).format('h:mm A')}</Text>
              </View>
            </TouchableOpacity>
          );
        })
        }
        {showStops && selectedService?.mode === 'shuttle' && selectedService?.name === 'NFTA Community Shuttle' &&
          <View style={styles.hailContainer}>
            {inCommunityShuttleArea && inCommunityShuttleTimeframe &&
              <>
                <Text
                  style={styles.hailText}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >
                  {translator.t('components.serviceViewer.shuttleMessage')}
                </Text>
                <Button
                  label={translator.t('components.serviceViewer.shuttleLabel')}
                  buttonStyle={styles.hailButtonStyle}
                  // width={200}
                  onPress={() => {
                    handleHailPress(selectedService);
                  }}
                />
              </>
            }
            {inCommunityShuttleArea && !inCommunityShuttleTimeframe &&
              <Text
                style={styles.hailText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >
                {translator.t('components.serviceViewer.shuttleNotAvailableTimeFrame')}
              </Text>
            }
            {!inCommunityShuttleArea &&
              <Text
                style={styles.hailText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >
                {translator.t('components.serviceViewer.shuttleNotInArea')}
              </Text>
            }
          </View>
        }
        {showStops && selectedService?.mode === 'shuttle' && selectedService?.name !== 'NFTA Community Shuttle' &&
          <View style={styles.hailContainer}>
            <Text
              style={styles.hailText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >
              {translator.t('components.serviceViewer.shuttleNotAvailable')}
            </Text>
          </View>
        }
      </ScrollView>
    </View>
  );
};

ServiceViewer.propTypes = {
  authenticated: PropTypes.bool,
  location: PropTypes.shape({
    lng: PropTypes.number,
    lat: PropTypes.number,
  }),
  onServiceSelected: PropTypes.func,
  onSelectedServiceRefresh: PropTypes.func,
  onStopPress: PropTypes.func,
  onBackPress: PropTypes.func,
  onHailPress: PropTypes.func,
};

ServiceViewer.defaultProps = {
  authenticated: false
};

export default ServiceViewer;
