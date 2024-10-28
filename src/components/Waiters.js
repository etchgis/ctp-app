import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";
import { Colors } from '../styles';
import { StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  dot: {
    marginHorizontal: 1
  }
});

const Dots = ({
  duration,
  colorFrom,
  colorTo,
  size
}) => {

  const sv1 = useSharedValue(0);
  const sv2 = useSharedValue(0);
  const sv3 = useSharedValue(0);

  useEffect(() => {
    sv1.value = withRepeat(withTiming(1, { duration }), -1);
    sv2.value = withDelay((duration / 3), withRepeat(withTiming(1, { duration }), -1));
    sv3.value = withDelay((duration / 3) * 2, withRepeat(withTiming(1, { duration }), -1));
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => {
    return {
      ...styles.dot,
      height: size,
      width: size,
      borderRadius: size / 2,
      backgroundColor: interpolateColor(
        sv1.value,
        [0, 0.5, 1],
        [colorFrom, colorTo, colorFrom]
      )
    };
  });

  const animatedStyle2 = useAnimatedStyle(() => {
    return {
      ...styles.dot,
      height: size,
      width: size,
      borderRadius: size / 2,
      backgroundColor: interpolateColor(
        sv2.value,
        [0, 0.5, 1],
        [colorFrom, colorTo, colorFrom]
      )
    };
  });

  const animatedStyle3 = useAnimatedStyle(() => {
    return {
      ...styles.dot,
      height: size,
      width: size,
      borderRadius: size / 2,
      backgroundColor: interpolateColor(
        sv3.value,
        [0, 0.5, 1],
        [colorFrom, colorTo, colorFrom]
      )
    };
  });

  return (
    <View
      style={styles.container}
    >

      <Animated.View
        style={animatedStyle1}
      />

      <Animated.View
        style={animatedStyle2}
      />

      <Animated.View
        style={animatedStyle3}
      />

    </View>
  )

}

Dots.propTypes = {
  duration: PropTypes.number,
  colorFrom: PropTypes.string,
  colorTo: PropTypes.string,
  size: PropTypes.number
};

Dots.defaultProps = {
  duration: 1000,
  colorFrom: Colors.light,
  colorTo: Colors.primary1,
  size: 20
};

export {
  Dots
};