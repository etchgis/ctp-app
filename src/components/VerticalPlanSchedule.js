import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Linking, PixelRatio, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Devices, Typography } from '../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import formatters from '../utils/formatters';
import { Circle, G, Line, Path, Rect, Svg, Text as SvgText, Symbol, TSpan, Use } from 'react-native-svg';
import * as d3Path from 'd3-path';
import config from '../config';
import Button from './Button';
import { useFontScale } from '../utils/fontScaling';
import { deviceMultiplier } from '../styles/devices';
import { isTablet } from 'react-native-device-info';
import translator from '../models/translator';
import { useStore } from '../stores/RootStore';
import moment from 'moment';

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 5,
    borderBottomColor: Colors.primary1,
    borderBottomWidth: 2,
    marginBottom: -1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerDetail: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    marginBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.primary1,
    borderRadius: 4,
    position: 'absolute',
    top: 6,
    left: (Devices.screen.width / 2) - 20,
  },
  destination: {
    ...Typography.h5,
  },
  duration: {
    ...Typography.h5,
    marginRight: 7,
  },
  transfers: {
    ...Typography.h5,
    marginLeft: 7,
  },
  default: {
    backgroundColor: Colors.white,
  },
  active: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    backgroundColor: Colors.white,
  },
  inactive: {
    opacity: 0.5,
  },
  screenReaderContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  screenReaderText: {
    paddingVertical: 2,
    ...Typography.h5,
  }
});

// FROM: https://dev.to/bytebodger/constructors-in-functional-components-with-hooks-280m
const useConstructor = (callBack = () => { }) => {
  const [hasBeenCalled, setHasBeenCalled] = useState(false);
  if (hasBeenCalled) { return; }
  callBack();
  setHasBeenCalled(true);
};

const VerticalPlanSchedule = ({
  request,
  plan,
  wheelchair,
  tripUpdates,
  planWidth,
  separation,
  onScroll,
  showGo,
  onGoPress,
  onExitPress,
  showExit,
  navigating,
  tracking,
  trackingUpdates,
  vehicleUpdates,
  screenReading,

}) => {

  // console.log('PLAN', JSON.stringify(plan));

  const store = useStore();
  const currentFontScale = useFontScale();
  const maximumGraphicScale = Math.min(Math.max(1, currentFontScale), config.MAX_FONT_SCALE) * deviceMultiplier;

  const AGENCY_HEIGHT = 100;
  const LEG_HEIGHT = 60;
  const INTERMEDIATE_STOP_HEIGHT = 30 * maximumGraphicScale;
  const INTERMEDIATE_STOP_OFFSET = 135 * maximumGraphicScale;
  const MODE_RADIUS = 12;
  const STOP_RADIUS = 6;
  const STROKE_WIDTH = 4;
  const PIXELS_PER_CHAR = 8;

  const [planLegs, setPlanLegs] = useState([]);
  const [totalPlanHeight, setTotalPlanHeight] = useState(0);
  const [showDetailArray, setShowDetailArray] = useState([]);

  useConstructor(() => {
    let total = 0;
    // let offset = MODE_RADIUS + (STROKE_WIDTH * 0.75);
    let offset = 5;
    let legs = plan.legs || [];
    let stopsArray = [];
    legs.forEach((l, i) => {
      l.y1 = offset;
      let additional = (l?.agencyName ? AGENCY_HEIGHT : LEG_HEIGHT);
      if (l.intermediateStops && l.intermediateStops.length > 0) {
        additional = additional + (l.intermediateStops.length * INTERMEDIATE_STOP_HEIGHT);
        stopsArray.push(0);
      }
      else {
        stopsArray.push(1);
      }
      if (i === 0 && l.mode === 'HAIL') {
        additional += 40;
      }
      l.y2 = (additional + offset) * deviceMultiplier;
      total = total + l.y2;
    });
    setShowDetailArray(stopsArray);
    setPlanLegs(legs);
    const plansWithStopsCount = legs.reduce(
      (acc, val) => acc + (val.intermediateStops ? 1 : 0),
      0
    );
    setTotalPlanHeight(total + (plansWithStopsCount * INTERMEDIATE_STOP_OFFSET) + 360);
  });

  const touchStart = () => {
    if (onScroll) {
      onScroll(true);
    }
  };

  const touchEnd = () => {
    if (onScroll) {
      onScroll(false);
    }
  };

  const touchCancel = () => {
    if (onScroll) {
      onScroll(false);
    }
  };

  const getModeColor = (mode) => {
    let color = '#616161';
    const found = config.MODES.find(m => m.mode.toLowerCase() === mode.toLowerCase());
    if (found) {
      color = found.color === '#ffffff' ? '#70BFDA' : found.color || '#70BFDA';
    }

    return color;
  };

  const formatLegTitle = (leg) => {
    if (leg.route || leg.agency) {
      return (leg.route || leg.agency);
    }
    if (leg.mode === 'WALK') {
      const duration = formatters.datetime.asDuration(leg.duration);
      let title = translator.t(`global.modes.${wheelchair ? 'roll' : 'walk'}`);
      if (duration) {
        title += ' ' + duration;
      }
      return title;
    }
    if (leg.mode === 'HAIL') {
      return translator.t('global.modes.hail');
    }
    if (leg.mode === 'INDOOR' && leg.venueId) {
      const venue = config.INDOOR.VENUES.find(v => v.id === leg.venueId);
      return venue ? venue.name : 'INDOOR';
    }
    return leg.mode;
  };

  const getModeName = (mode) => {
    let name = mode.toLowerCase();
    if (name === 'walk' && wheelchair) {
      return 'roll';
    }
    if (name === 'tram' || name === 'cable_car' || name === 'gondola') {
      return 'tram';
    }
    if (name === 'ferry') {
      return 'ship';
    }
    if (name === 'rail') {
      return 'train';
    }
    return name;
  };

  const trimText = (text, threshold) => {
    if (text.length <= threshold) {
      return text;
    }
    return text.substr(0, threshold).concat('...');
  };

  const drawLine = (x1, y1, x2, y2) => {
    const path = d3Path.path();
    path.moveTo(x1, y1);
    path.lineTo(x2, y2);
    return path.toString();
  };

  const toggleShowDetail = (index) => {
    let detailArray = [...showDetailArray];
    detailArray[index] = detailArray[index] === 0 ? 1 : 0;
    setShowDetailArray(detailArray);
  };

  const headerStyle = () => {
    return {
      ...styles.header,
      // height: 110, // 110 * (currentFontScale / 2),
      height: 110 * Math.min(1.5, currentFontScale),
    };
  };

  return (
    <>

      <View
        style={headerStyle()}
      >

        <View
          style={styles.handle}
        />

        <View
          style={{
            width: Devices.screen.width - 50 - 70,
          }}
          accessible={true}
          accessibilityLabel={
            translator.t('components.verticalPlanSchedule.to') +
            ' ' +
            request.destination.text +
            ', ' +
            formatters.datetime.asDuration(plan.duration) +
            ', ' +
            translator.t('global.transferCount', { count: plan.transfers })
          }
          accessibilityLanguage={store.preferences.language || 'en'}
        >
          <Text
            style={styles.destination}
            numberOfLines={2}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('components.verticalPlanSchedule.to')}<Text
            style={{ fontWeight: 'bold' }}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{' '}{request.destination.text}</Text>
          </Text>
          <View
            style={styles.headerDetail}
          >
            <Text
              style={styles.duration}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >
              {formatters.datetime.asDuration(plan.duration)}
            </Text>
            <FontAwesomeIcon
              icon="circle"
              size={6}
            />
            <Text
              style={styles.transfers}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('global.transferCount', { count: plan.transfers })}</Text>
          </View>
        </View>

        <View>
          {(navigating || showExit) &&
            <Button
              label={translator.t('global.exitLabel')}
              width={70 * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
              buttonStyle={{
                backgroundColor: Colors.danger,
                borderColor: Colors.danger,
              }}
              labelStyle={{
                fontWeight: 'bold',
              }}
              onPress={() => {
                if (onExitPress) {
                  onExitPress();
                }
              }}
            />
          }
          {!navigating && showGo &&
            <Button
              label={translator.t('global.goLabel')}
              width={70}
              buttonStyle={{
                backgroundColor: Colors.success,
                borderColor: Colors.success,
              }}
              labelStyle={{
                fontWeight: 'bold',
              }}
              onPress={() => {
                if (onGoPress) {
                  onGoPress();
                }
              }}
            />
          }
        </View>

      </View>

      <ScrollView
        onTouchStart={touchStart}
        onTouchEnd={touchEnd}
        onTouchCancel={touchCancel}
        contentContainerStyle={{
          paddingBottom: 400,
        }}
      >
        <>
          {
            planLegs.map((leg, i) => {
              let x1 = 30;
              let y1 = leg.y1;
              let x2 = x1;
              let y2 = leg.y2;
              let height = 200;

              if (showDetailArray[i] === 1) {
                height = y2 - y1;
              }

              let separator = drawLine(0, 1 * maximumGraphicScale, planWidth, 1 * maximumGraphicScale);

              let prevModeColor = '#FFFFFF';
              if (i > 0) {
                prevModeColor = getModeColor(planLegs[i - 1].mode);
              }

              let curModeColor = getModeColor(leg.mode);

              let duration = formatters.datetime.asDuration(leg.duration);
              let time = formatters.datetime.asHHMMA(new Date(leg.startTime));
              let delay = translator.t('components.verticalPlanSchedule.onTime'),
                realtime = false,
                busAtRisk = false;
              if (tripUpdates && tripUpdates.transit) {
                let update = tripUpdates.transit.find(t => t.legIndex === i);
                if (update && update.atRisk) {
                  busAtRisk = true;
                }
              }

              let title = formatLegTitle(leg);
              let name = getModeName(leg.mode);
              var price = (leg.price || 0) / 100;
              var route, headsign;
              if (leg.agencyName && leg.route) {
                route = leg.route;
                headsign = leg.headsign;
                var maxPixels = planWidth - (x1 + 20),
                  charPixels = (headsign?.length || 0) * PIXELS_PER_CHAR * maximumGraphicScale,
                  estChars = maxPixels / (PIXELS_PER_CHAR * maximumGraphicScale);
                if (charPixels > maxPixels) {
                  headsign = trimText(headsign, estChars);
                }
              }

              let origin = translator.t('global.leaveOrigin', { origin: request.origin.text });
              if (i === 0) {
                var maxPixels = planWidth - (x1 + 20),
                  charPixels = origin.length * PIXELS_PER_CHAR * maximumGraphicScale,
                  estChars = maxPixels / (PIXELS_PER_CHAR * maximumGraphicScale);
                if (charPixels > maxPixels) {
                  origin = trimText(origin, estChars);
                }
              }

              let destination = translator.t('global.arriveDestination', { destination: request.destination.text });
              if (i === planLegs.length - 1) {
                var maxPixels = planWidth - (x1 + 20),
                  charPixels = destination.length * PIXELS_PER_CHAR * maximumGraphicScale,
                  estChars = maxPixels / (PIXELS_PER_CHAR * maximumGraphicScale);
                if (charPixels > maxPixels) {
                  destination = trimText(destination, estChars);
                }
              }

              let toName = leg.to ? (leg.to.name || '') : ` ${translator.t('components.verticalPlanSchedule.yourStop')}`;
              let toNameTrimmed = toName;

              var maxPixels = planWidth - (x1 + 20),
                charPixels = toName.length * PIXELS_PER_CHAR * maximumGraphicScale,
                estChars = maxPixels / (PIXELS_PER_CHAR * maximumGraphicScale * 0.9);
              if (charPixels > maxPixels) {
                toName = trimText(toName, estChars);
              }

              var maxPixels = planWidth - (x1 + 20),
                charPixels = toNameTrimmed.length * PIXELS_PER_CHAR * maximumGraphicScale,
                estChars = maxPixels / (PIXELS_PER_CHAR * maximumGraphicScale * 1.2);
              if (charPixels > maxPixels) {
                toNameTrimmed = trimText(toNameTrimmed, estChars);
              }

              let intermediateStops;
              let intermediateStopsLabel;
              if (leg.intermediateStops && leg.intermediateStops.length > 0) {

                const lbl = translator.t('components.verticalPlanSchedule.stopCount', { count: leg.intermediateStops.length });
                const dur = formatters.datetime.asDuration(leg.duration);
                intermediateStopsLabel = `${lbl}, ${dur}`;

                if (showDetailArray[i] === 1) {
                  height += (STOP_RADIUS + INTERMEDIATE_STOP_HEIGHT) * 2;
                }

                // showDetailArray[i] === 1 ? (70 + (30 * intermediateStops.length) + 20) :
                intermediateStops = leg.intermediateStops.map((stop, j) => {
                  let sy1 = leg.y1 - STOP_RADIUS + (j * INTERMEDIATE_STOP_HEIGHT + INTERMEDIATE_STOP_OFFSET);
                  let sTitle = stop.name || '';
                  var mPixels = planWidth - (x1 + 20),
                    cPixels = sTitle.length * PIXELS_PER_CHAR * maximumGraphicScale,
                    eChars = maxPixels / (PIXELS_PER_CHAR * maximumGraphicScale * 0.9);
                  if (cPixels > mPixels) {
                    sTitle = trimText(sTitle, eChars);
                  }
                  let sFontSize = 10 * maximumGraphicScale,
                    sFill = '#6E6259',
                    sWeight = 'normal';

                  return (
                    <G
                      key={`stop-${i * 10 + j}`}
                    >
                      <Circle
                        cx={x1}
                        cy={sy1}
                        r={STOP_RADIUS * maximumGraphicScale}
                        stroke={curModeColor}
                        strokeWidth={STROKE_WIDTH}
                        fill={Colors.white} />
                      <SvgText
                        x={x1 + 20} y={sy1 + 3}
                        fill={sFill}
                        fontSize={sFontSize}
                        fontWeight={sWeight} >
                        {sTitle}
                      </SvgText>
                    </G>
                  );
                });
              }

              let currentlegIndex = -1;
              if (trackingUpdates) {
                currentlegIndex = trackingUpdates.legIndex;
              }
              let currentLegStyle = styles.default;
              if (tracking) {
                currentLegStyle = currentlegIndex === i ? styles.active : styles.inactive;
              }
              let vehicle = null;
              let vehicleEta = translator.t('components.verticalPlanSchedule.shuttleSummon');
              // find any vehicle for this leg
              if (vehicleUpdates) {
                // TODO: pass the JWT to Skids so we don't have to return every waypoint
                vehicle = vehicleUpdates.find(v => v.userLegIndex === i);
                if (vehicle && vehicle.legTimeLeft != null && vehicle.route?.legs != null) {
                  let eta = vehicle.legTimeLeft;
                  for (let j = 0; j < vehicle.route.legs.length; j++) {
                    const shuttleLeg = vehicle.route.legs[j];
                    const riderId = shuttleLeg.toWaypoint?.rider?.id;
                    if (riderId != null && riderId === store.authentication.user?.id) {
                      break;
                    } else if (j !== 0) {
                      eta += shuttleLeg.duration;
                    }
                  }
                  vehicleEta = translator.t('components.verticalPlanSchedule.shuttleArrival', { duration: formatters.datetime.asDuration(eta) });
                }
              }
              const modeIconOffset = (maximumGraphicScale === 1 ? 1 : maximumGraphicScale <= 1.353 ? 2 : 3);

              let legFromName = leg.from.name;
              var maxPixels = planWidth - (x1 + 20),
                charPixels = legFromName.length * PIXELS_PER_CHAR * maximumGraphicScale,
                estChars = maxPixels / (PIXELS_PER_CHAR * maximumGraphicScale * 0.9);
              if (charPixels > maxPixels) {
                legFromName = trimText(legFromName, estChars);
              }

              if (!screenReading) {
                return (
                  <Svg
                    key={`leg-${i}`}
                    width={planWidth}
                    height={height * (i === planLegs.length - 1 ? 2 : 1) * maximumGraphicScale}
                    style={currentLegStyle}
                  >
                    <Symbol
                      id={'roll'}
                      viewBox={config.WHEELCHAIR.svg.viewBox}
                    >
                      <Path
                        d={config.WHEELCHAIR.svg.path}
                      />
                    </Symbol>
                    <Symbol
                      id={'phone'}
                      viewBox={config.PHONE.svg.viewBox}
                    >
                      <Path
                        d={config.PHONE.svg.path}
                      />
                    </Symbol>
                    <Symbol
                      id={'realtime'}
                      viewBox="0 0 448 512"
                    >
                      <Path
                        d="M128.081 415.959c0 35.369-28.672 64.041-64.041 64.041S0 451.328 0 415.959s28.672-64.041 64.041-64.041 64.04 28.673 64.04 64.041zm175.66 47.25c-8.354-154.6-132.185-278.587-286.95-286.95C7.656 175.765 0 183.105 0 192.253v48.069c0 8.415 6.49 15.472 14.887 16.018 111.832 7.284 201.473 96.702 208.772 208.772.547 8.397 7.604 14.887 16.018 14.887h48.069c9.149.001 16.489-7.655 15.995-16.79zm144.249.288C439.596 229.677 251.465 40.445 16.503 32.01 7.473 31.686 0 38.981 0 48.016v48.068c0 8.625 6.835 15.645 15.453 15.999 191.179 7.839 344.627 161.316 352.465 352.465.353 8.618 7.373 15.453 15.999 15.453h48.068c9.034-.001 16.329-7.474 16.005-16.504z"
                      />
                    </Symbol>
                    <Symbol
                      id={'danger'}
                      viewBox="0 0 512 512"
                    >
                      <Path
                        d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
                      />
                    </Symbol>
                    <Symbol
                      id={'destination'}
                      viewBox={config.DESTINATION.svg.viewBox}
                    >
                      <Path
                        d={config.DESTINATION.svg.path1}
                        fill={Colors.black}
                      />
                      <Path
                        d={config.DESTINATION.svg.path2}
                        fill={Colors.primary1}
                      />
                    </Symbol>
                    {
                      config.MODES.map((mode, j) => {
                        return (
                          <Symbol
                            key={`mode-${i}-${j}`}
                            id={mode.id}
                            viewBox={mode.svg.viewBox}>
                            <Path
                              d={mode.svg.path}
                            />
                          </Symbol>
                        );
                      })
                    }
                    <G>
                      <Path
                        d={separator}
                        stroke={'#cccccc'}
                        strokeWidth={1}
                      />
                      {i > 0 &&
                        <Line
                          x1={x1}
                          y1={0}
                          x2={x2}
                          y2={y1 + (MODE_RADIUS * maximumGraphicScale * 2)}
                          stroke={prevModeColor}
                          strokeWidth={STROKE_WIDTH}
                          strokeDasharray={planLegs[i - 1].mode === 'WALK' ? [4, 5] : null}
                          strokeLinecap="round" />
                      }
                      <Line
                        x1={x1}
                        y1={y1 + (MODE_RADIUS * 2) + 6}
                        x2={x2}
                        y2={(y2 + (intermediateStops ? ((STOP_RADIUS + INTERMEDIATE_STOP_HEIGHT) * 2) : 0)) * maximumGraphicScale}
                        stroke={curModeColor}
                        strokeWidth={STROKE_WIDTH}
                        strokeDasharray={leg.mode === 'WALK' ? [4, 5] : null}
                        strokeLinecap="round" />
                      <Circle
                        cx={x1}
                        cy={LEG_HEIGHT * 0.5 * maximumGraphicScale}
                        r={MODE_RADIUS * maximumGraphicScale}
                        stroke={curModeColor}
                        strokeWidth={STROKE_WIDTH}
                        fill={curModeColor} />
                      <Use
                        href={'#' + name}
                        x={x1 - x1 / 4 * maximumGraphicScale - modeIconOffset}
                        y={21 * maximumGraphicScale}
                        width={18 * maximumGraphicScale}
                        height={18 * maximumGraphicScale}
                        fill={'#ffffff'}
                      />
                      <SvgText
                        x={x1 + 20 * maximumGraphicScale + (busAtRisk ? x1 * maximumGraphicScale : 0)}
                        y={y1 + ((MODE_RADIUS * 2) + 6) * maximumGraphicScale}
                        fill={'#111111'}
                        fontSize={18 * maximumGraphicScale}
                        fontWeight="bold">{title}</SvgText>
                      {route &&
                        <SvgText
                          x={planWidth - 75}
                          y={y1 + (MODE_RADIUS * 2) * maximumGraphicScale}
                          fill={'#111111'}
                          fontSize={14 * maximumGraphicScale}
                          fontWeight="bold">{time}</SvgText>
                      }
                      {busAtRisk &&
                        <Use
                          href={'#danger'}
                          x={x1 + 20 * maximumGraphicScale}
                          // x={x1 - x1 / 4 * maximumGraphicScale - modeIconOffset}
                          y={21 * maximumGraphicScale}
                          width={18 * maximumGraphicScale}
                          height={18 * maximumGraphicScale}
                          fill={Colors.danger}
                        />
                      }
                      {leg.mode === 'HAIL' &&
                        <G>
                          <SvgText
                            x={x1 + 30 * maximumGraphicScale}
                            y={y1 + (MODE_RADIUS * 2) + (isTablet() ? 45 : 25)}
                            inlineSize={100}
                            fill={'#111111'}
                            fontSize={11 * maximumGraphicScale}
                            fontWeight="bold"
                            fontStyle="italic"
                          >
                            {vehicleEta}
                          </SvgText>
                          <G onPress={() => {
                            if (Linking.canOpenURL) {
                              Linking.openURL(`tel:${config.HAIL_PHONE}`);
                            }
                          }}>
                            <Circle
                              cx={planWidth - 35}
                              cy={y1 + (MODE_RADIUS * 2)}
                              r={MODE_RADIUS * 1.5}
                              stroke={config.PHONE.backgroundColor}
                              strokeWidth={STROKE_WIDTH}
                              fill={config.PHONE.backgroundColor} />
                            <Use
                              href={'#phone'}
                              x={planWidth - 53}
                              y={y1 + (MODE_RADIUS) - 6}
                              width={36}
                              height={36}
                              fill={config.PHONE.color}
                            />
                          </G>
                        </G>
                      }
                      {i === 0 &&
                        <SvgText
                          x={x1 * maximumGraphicScale + 20}
                          y={y1 + ((MODE_RADIUS * 2) + 22) * maximumGraphicScale + (leg.mode === 'HAIL' ? 25 : 0)}
                          inlineSize={100}
                          fill={'#111111'}
                          fontSize={12 * maximumGraphicScale}
                          fontWeight="bold">{origin}</SvgText>
                      }
                    </G>
                    {route &&
                      <G>
                        <SvgText
                          x={x1 * maximumGraphicScale + 20 + (busAtRisk ? x1 * maximumGraphicScale : 0)}
                          y={y1 + ((MODE_RADIUS * 2) + 26) * maximumGraphicScale}
                          fill={'#111111'}
                          fontSize={12 * maximumGraphicScale}
                          fontWeight="bold">
                          {'To '}{headsign}
                        </SvgText>
                        <SvgText
                          x={x1 * maximumGraphicScale + 20 + (busAtRisk ? x1 * maximumGraphicScale : 0)}
                          y={y1 + ((MODE_RADIUS * 2) + 46) * maximumGraphicScale}
                          fill={curModeColor}
                          fontSize={16 * maximumGraphicScale}
                          fontWeight="bold">
                          <TSpan>
                            {toNameTrimmed}
                          </TSpan>
                        </SvgText>
                      </G>
                    }
                    {!!intermediateStops && showDetailArray[i] === 1 &&
                      <G>
                        <Circle
                          cx={x1}
                          cy={(y1 + 100) * maximumGraphicScale}
                          r={STOP_RADIUS * maximumGraphicScale}
                          stroke={curModeColor}
                          strokeWidth={STROKE_WIDTH}
                          fill={'#ffffff'} />
                        <SvgText
                          x={x1 + 20}
                          y={(y1 + 103) * maximumGraphicScale}
                          fill={'#111111'}
                          fontSize={10 * maximumGraphicScale}
                          fontWeight={'bold'}
                        >
                          {legFromName}
                        </SvgText>
                        <SvgText
                          x={planWidth - 75}
                          y={(y1 + 102) * maximumGraphicScale}
                          fill={'#6E6259'}
                          fontSize={10 * maximumGraphicScale}
                          fontWeight="bold"
                        >
                          <TSpan>
                            {formatters.datetime.asHHMMA(new Date(leg.from.departure))}
                          </TSpan>
                          {/* <TSpan
                            dy={10 * maximumGraphicScale}
                            textAnchor={'end'}
                          >
                            {delay}
                          </TSpan> */}
                        </SvgText>
                        {intermediateStops}
                        <Circle
                          cx={x1}
                          cy={leg.y1 - STOP_RADIUS + (intermediateStops.length * INTERMEDIATE_STOP_HEIGHT + INTERMEDIATE_STOP_OFFSET)}
                          r={STOP_RADIUS * maximumGraphicScale}
                          stroke={curModeColor}
                          strokeWidth={STROKE_WIDTH}
                          fill={'#ffffff'}
                        />
                        <SvgText
                          x={x1 + 20}
                          y={leg.y1 - STOP_RADIUS + (intermediateStops.length * INTERMEDIATE_STOP_HEIGHT + INTERMEDIATE_STOP_OFFSET) + 3}
                          fill={'#111111'}
                          fontSize={10 * maximumGraphicScale}
                          fontWeight={'bold'} >
                          {toName}
                        </SvgText>
                        <SvgText
                          x={planWidth - 75}
                          y={leg.y1 - STOP_RADIUS + (intermediateStops.length * INTERMEDIATE_STOP_HEIGHT + INTERMEDIATE_STOP_OFFSET) + 3}
                          fill={'#6E6259'}
                          fontSize={10 * maximumGraphicScale}
                          fontWeight="bold"
                        >
                          {formatters.datetime.asHHMMA(new Date(leg.to.arrival))}
                        </SvgText>
                        <G>
                          <SvgText
                            x={x1 + 20}
                            y={leg.y1 - STOP_RADIUS + (intermediateStops.length * INTERMEDIATE_STOP_HEIGHT + INTERMEDIATE_STOP_OFFSET + (25 * maximumGraphicScale))}
                            fill={Colors.primary1}
                            fontSize={14 * maximumGraphicScale}
                            fontWeight={'bold'}>
                            {translator.t('components.verticalPlanSchedule.showLess')}
                          </SvgText>
                          <Rect
                            x={x1 + 20 - 3}
                            y={leg.y1 - STOP_RADIUS + (intermediateStops.length * INTERMEDIATE_STOP_HEIGHT + INTERMEDIATE_STOP_OFFSET + (8 * maximumGraphicScale))}
                            width={208}
                            height={22 * maximumGraphicScale}
                            opacity={0}
                            onPress={() => {
                              toggleShowDetail(i);
                            }} />
                        </G>
                      </G>
                    }
                    {!!intermediateStops && showDetailArray[i] === 0 &&
                      <G>
                        <Circle
                          cx={x1}
                          cy={(y1 + 100) * maximumGraphicScale}
                          r={6 * maximumGraphicScale}
                          stroke={curModeColor}
                          strokeWidth={4}
                          fill={'#ffffff'}
                        />
                        <SvgText
                          x={x1 + 20}
                          y={(y1 + 103) * maximumGraphicScale}
                          fill={'#111111'}
                          fontSize={10 * maximumGraphicScale}
                          fontWeight={'bold'}
                        >
                          {leg.from.name}
                        </SvgText>
                        <Line
                          x1={x1}
                          y1={(y1 + 120) * maximumGraphicScale}
                          x2={x1}
                          y2={(y1 + 150) * maximumGraphicScale}
                          stroke={'#ffffff'}
                          strokeWidth={4}
                        />
                        <Line
                          x1={x1}
                          y1={(y1 + 120) * maximumGraphicScale}
                          x2={x1}
                          y2={(y1 + 150) * maximumGraphicScale}
                          stroke={curModeColor}
                          strokeWidth={4}
                          strokeDasharray={[1, 6]}
                          strokeLinecap="round"
                        />
                        <G>
                          <SvgText
                            x={x1 + 20}
                            y={(y1 + 140) * maximumGraphicScale}
                            fill={Colors.primary1}
                            fontSize={14 * maximumGraphicScale}
                            fontWeight={'bold'}>
                            {intermediateStopsLabel}
                          </SvgText>
                          <Rect
                            x={x1 + 20 - 3}
                            y={(y1 + 110 + 15) * maximumGraphicScale}
                            width={208}
                            height={22 * maximumGraphicScale}
                            opacity={0}
                            onPress={() => {
                              toggleShowDetail(i);
                            }}
                          />
                        </G>
                        <Circle
                          cx={x1}
                          cy={(y1 + 100 + 71) * maximumGraphicScale}
                          r={6 * maximumGraphicScale}
                          stroke={curModeColor}
                          strokeWidth={4}
                          fill={curModeColor} />
                        <SvgText
                          x={x1 + 20}
                          y={(y1 + 102 + 71) * maximumGraphicScale}
                          fill={'#111111'}
                          fontSize={10 * maximumGraphicScale}
                          fontWeight={'bold'}
                        >
                          {toName}
                        </SvgText>
                      </G>
                    }
                    {i === planLegs.length - 1 &&
                      <G>
                        <Path
                          d={drawLine(0, height * maximumGraphicScale, planWidth, height * maximumGraphicScale)}
                          stroke={'#cccccc'}
                          strokeWidth={1}
                        />
                        <Line
                          x1={30}
                          y1={(height + 2) * maximumGraphicScale}
                          x2={30}
                          y2={(height + MODE_RADIUS + 2) * maximumGraphicScale}
                          stroke={planLegs.length > 0 ? getModeColor(planLegs[planLegs.length - 1].mode) : Colors.dark}
                          strokeWidth={STROKE_WIDTH}
                          strokeDasharray={planLegs.length > 0 ? planLegs[planLegs.length - 1].mode === 'WALK' ? [4, 5] : null : null}
                          strokeLinecap="round" />
                        <Use
                          href={'#destination'}
                          x={x1 - (15 * 2 * maximumGraphicScale) / 2}
                          y={(height + 15) * maximumGraphicScale}
                          width={30 * maximumGraphicScale}
                          height={30 * maximumGraphicScale}
                          fill={'#000000'}
                        />
                        <SvgText
                          x={x1 + 20 * maximumGraphicScale}
                          y={(height + (MODE_RADIUS * 2) + 7) * maximumGraphicScale}
                          fill={'#111111'}
                          fontSize={12 * maximumGraphicScale}
                          fontWeight="bold">{destination}</SvgText>
                        <Path
                          d={drawLine(0, ((height * 2) - 1) * maximumGraphicScale, planWidth, ((height * 2) - 1) * maximumGraphicScale)}
                          stroke={'#cccccc'}
                          strokeWidth={1}
                        />
                      </G>
                    }
                  </Svg>
                );
              }
              else {
                return (
                  <View
                    key={`leg-${i}`}
                    style={styles.screenReaderContainer}
                  >
                    {leg.mode === 'HAIL' &&
                      <>
                        <Text
                          style={styles.screenReaderText}
                        >{vehicleEta}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            if (Linking.canOpenURL) {
                              Linking.openURL(`tel:${config.HAIL_PHONE}`);
                            }
                          }}
                        >
                          <Text
                            style={styles.screenReaderText}
                          >CALL</Text>
                        </TouchableOpacity>
                      </>
                    }
                    {i === 0 &&
                      <Text
                        style={styles.screenReaderText}
                        accessibilityLabel={translator.t('global.leaveOrigin', { origin: request.origin.text })}
                      >{origin}</Text>
                    }
                    {route &&
                      <>
                        <Text
                          style={styles.screenReaderText}
                          accessibilityLabel={`To ${headsign}, ${toName}`}
                        >{'To '}{headsign}{', '}{toNameTrimmed}</Text>
                      </>
                    }
                    {!!intermediateStops &&
                      <>
                        <Text
                          style={styles.screenReaderText}
                        >{'Board at '}{leg.from.name}</Text>
                        <Text
                          style={styles.screenReaderText}
                        >{intermediateStopsLabel}</Text>
                        <Text
                          style={styles.screenReaderText}
                        >{'Depart at '}{toName}</Text>
                      </>
                    }
                    {i === planLegs.length - 1 &&
                      <>
                        <Text
                          style={styles.screenReaderText}
                          accessibilityLabel={translator.t('global.arriveDestination', { destination: request.destination.text })}
                        >{destination}</Text>
                      </>
                    }
                  </View>
                )
              }
            })
          }

        </>

      </ScrollView >

    </>
  );

};

VerticalPlanSchedule.propTypes = {
  request: PropTypes.object.isRequired,
  plan: PropTypes.object.isRequired,
  tripUpdates: PropTypes.shape({
    currentLeg: PropTypes.number,
    transit: PropTypes.arrayOf(PropTypes.object),
  }),
  wheelchair: PropTypes.bool.isRequired,
  planWidth: PropTypes.number,
  separation: PropTypes.number,
  onScroll: PropTypes.func,
  showGo: PropTypes.bool,
  onGoPress: PropTypes.func,
  showExit: PropTypes.bool,
  onExitPress: PropTypes.func,
  navigating: PropTypes.bool,
  tracking: PropTypes.bool,
  trackingUpdates: PropTypes.object,
  vehicleUpdates: PropTypes.arrayOf(PropTypes.object),
  screenReading: PropTypes.bool,
};

VerticalPlanSchedule.defaultProps = {
  planWidth: Devices.screen.width,
  separation: 10,
  navigating: false,
  tracking: false,
  screenReading: false
};

export default VerticalPlanSchedule;
