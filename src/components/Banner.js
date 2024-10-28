import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { Colors, Typography } from '../styles';
import voice from '../services/voice';
import formatters from '../utils/formatters';
import stepdirection from '../models/step-direction';
import config from '../config';
import translator from '../models/translator';
import navigator from '../services/navigator';

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 90,
  },
  current: {
    backgroundColor: Colors.primary3,
    paddingHorizontal: 20,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 90,
  },
  currentTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcoming: {
    backgroundColor: Colors.primary2,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
  },
  currentStepLabel: {
    ...Typography.h2,
    color: Colors.white,
    flexWrap: 'wrap',
    flex: 1,
    marginLeft: 10,
  },
  timeLabel: {
    ...Typography.h4,
    color: '#eee',
    alignSelf: 'flex-end',
  },
  nextLabel: {
    ...Typography.h4,
    color: Colors.white,
    marginRight: 10,
    fontWeight: 'bold',
  },
  nextStepLabel: {
    ...Typography.h4,
    color: Colors.white,
    flex: 1,
  },
});

const Banner = ({
  // tripProgress,
  rerouting,
  onHeightChange,
}) => {

  const [title, setTitle] = useState('');
  const [next, setNext] = useState('');
  const [timeToNext, setTimeToNext] = useState('');
  const [distanceToNext, setDistanceToNext] = useState('');
  const [pathString, setPathString] = useState('');
  const navWatchRef = useRef();

  const pathScale = 3;
  const pathX = 0;

  useEffect(() => {
    navWatchRef.current = navigator.subscribe(handleNavigationProgress);

    return () => {
      navWatchRef.current && navWatchRef.current.cancel();
    };
  }, []);

  const handleNavigationProgress = useCallback((progress) => {
    let currentStep =
      !rerouting ?
        translator.t('directions.goToStart') :
        translator.t('directions.rerouting');
    let ttn;
    let sdr;
    let ns;

    let ps;
    if (progress && !rerouting) {
      // console.log('PROGRESS', progress);
      const stepTimeRemaining = progress.stepDurationRemaining;
      const stepDistanceRemaining = progress.stepDistanceRemaining;
      // console.log('voice.lastSpeech', voice.lastSpeech);
      // if (voice.lastSpeech) {
      //   // currentStep = voice.lastSpeech; // progress.maneuverInstruction;
      //   if (voice.lastSpeech.toLowerCase().includes('continue')
      //     || voice.lastSpeech.toLowerCase().includes('your')) {
      //     currentStep = voice.lastSpeech;
      //   } else {
      //     currentStep = progress.currentInstruction;
      //   }
      // }
      currentStep = progress.currentInstruction;
      if (progress.maneuverDirection) {
        ttn = formatters.datetime.asDuration(stepTimeRemaining, true).toUpperCase();
        sdr = formatters.distance.humanize(stepDistanceRemaining);
        ns = progress.upcomingInstruction;
      }

      if (progress.maneuverDirection && progress.maneuverDirection !== stepdirection.none.id) {
        const modifier = progress?.bannerInstruction?.primary?.modifier;
        if (modifier && config.NAVIGATION_DIRECTIONS[modifier]) {
          ps = config.NAVIGATION_DIRECTIONS[modifier];
        }
        else {
          const md = stepdirection.byId[progress.maneuverDirection];
          ps = config.NAVIGATION_DIRECTIONS[md.text];
        }
      } /* else if (progress.maneuverDirection === 0 && cs.maneuverType === 3) {
        ps = config.NAVIGATION_DIRECTIONS.straight;
      } */ // TODO: what was this supposed to be for? what's maneuver type 3?
      if (currentStep?.toLowerCase() === 'proceed to destination') {
        ps = config.NAVIGATION_DIRECTIONS.arrive;
      }
      if (currentStep?.toLowerCase() === 'cross at the curb ramp') {
        ps = config.NAVIGATION_DIRECTIONS.straight;
      }

      setTitle(tryTranslate(currentStep));
      setNext(tryTranslate(ns));
      setTimeToNext(ttn);
      setDistanceToNext(sdr);
      setPathString(ps);
    }
  }, []);

  const onContainerLayout = (e) => {
    const { height } = e.nativeEvent.layout;
    if (onHeightChange) {
      onHeightChange(height);
    }
  };

  //TODO: have this in trip progress or elsewhere
  const tryTranslate = (text) => {
    if (!text) return null;
    if (text.toLowerCase().includes('turn sharp right on')) {
      return text.replace('Turn Sharp Right On', `${translator.t('directions.sharpRight')}`);
    }
    if (text.toLowerCase().includes('turn right on')) {
      return text.replace('Turn Right On', `${translator.t('directions.turn')} ${translator.t('directions.right')}`);
    }
    if (text.toLowerCase().includes('turn slightly right on')) {
      return text.replace('Turn Slight Right On', `${translator.t('directions.slightRight')}`);
    }
    if (text.toLowerCase().includes('straight on')) {
      return text.replace('Straight On', `${translator.t('directions.straight')}`);
    }
    if (text.toLowerCase().includes('turn sharp left on')) {
      return text.replace('Turn Sharp Left On', `${translator.t('directions.sharpLeft')}`);
    }
    if (text.toLowerCase().includes('turn left on')) {
      return text.replace('Turn Left On', `${translator.t('directions.turn')} ${translator.t('directions.left')}`);
    }
    if (text.toLowerCase().includes('turn slightly left on')) {
      return text.replace('Turn Slightly Left On', `${translator.t('directions.slightLeft')}`);
    }
    if (text.toLowerCase().includes('next stop')) {
      return text.replace('Next Stop', `${translator.t('directions.nextStop')}`);
    }
    if (text.toLowerCase().includes('your stop is coming up next')) {
      return text.replace('Your stop is coming up next. Please depart the bus at', `${translator.t('directions.yourStop1')}`);
    }
    if (text.toLowerCase().includes('is your stop')) {
      return text.replace('is your stop', `${translator.t('directions.yourStop2')}`);
    }
    if (text.toLowerCase().includes('proceed to destination')) {
      return text.replace('Proceed To Destination', `${translator.t('directions.proceedDestination')}`);
    }
    if (text.toLowerCase().includes('your destination')) {
      return text.replace('Your Destination', `${translator.t('directions.yourDestination')}`);
    }
    if (text.toLowerCase().includes('depart for')) {
      return text.replace('Depart for', `${translator.t('directions.depart')}`);
    }
    return text;
  }

  return (
    <View
      style={styles.container}
      onLayout={onContainerLayout}
    >

      <View
        style={styles.current}
      >

        <View
          style={styles.currentTop}
        >

          <Svg width={60} height={60}>
            {pathString && <Path d={pathString} scale={pathScale} x={pathX} y={0} fill="#ffffff" />}
          </Svg>

          <Text
            style={styles.currentStepLabel}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{title}</Text>

        </View>

        {timeToNext && (
          // <Text
          //   style={styles.timeLabel}
          //   maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          // >{timeToNext}</Text>
          <Text
            style={styles.timeLabel}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{distanceToNext}</Text>
        )}

      </View>

      <View
        style={styles.upcoming}
      >

        <Text
          style={styles.nextLabel}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{translator.t('directions.next').toUpperCase()}</Text>
        <Text
          style={styles.nextStepLabel}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{tryTranslate(next)}</Text>

      </View>

    </View>
  );

};

Banner.propTypes = {
  // tripProgress: PropTypes.shape({
  //   leg: PropTypes.shape({
  //     mode: PropTypes.string,
  //     intermediateStops: PropTypes.arrayOf(PropTypes.shape({})),
  //   }),
  //   legIndex: PropTypes.number,
  //   stepIndex: PropTypes.number,
  //   stepDurationRemaining: PropTypes.number,
  //   maneuverDirection: PropTypes.number,
  //   maneuverInstruction: PropTypes.string,
  //   nextManeuverInstruction: PropTypes.string,
  //   currentInstruction: PropTypes.string,
  //   upcomingInstruction: PropTypes.string,
  // }),
  rerouting: PropTypes.bool,
  onHeightChange: PropTypes.func,
};

Banner.defaultProps = {
  // tripProgress: null,
  rerouting: false,
  onHeightChange: null,
};

export default Banner;
