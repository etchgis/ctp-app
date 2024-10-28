import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Colors } from '../styles';

const styles = StyleSheet.create({
  container: {
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
  },
});

const Spinner = ({
  opacity,
}) => {

  const _spinValue = useRef(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(_spinValue.current, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const rotate = _spinValue.current.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{
      ...styles.container,
      opacity,
    }}>
      <Animated.View
        style={{ transform: [{ rotate }] }}
      >
        <FontAwesomeIcon
          icon="circle-notch"
          size={42}
          color={Colors.primary1}
        />
      </Animated.View>
    </View>
  );
};

Spinner.propTypes = {
  opacity: PropTypes.number,
};

Spinner.defaultProps = {
  opacity: 1,
};

export default Spinner;
