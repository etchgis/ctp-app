import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { Colors, Devices } from '../styles';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 200,
  },
  content: {
    position: 'absolute',
    top: 50,
    right: 20,
    bottom: 50,
    left: 20,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
    zIndex: 201,
  },
});

const Modal = ({
  children,
  show,
  height,
  allowScrolling
}) => {

  const [viewIndex, setViewIndex] = useState(0);

  const _viewValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(_viewValue, {
      toValue: viewIndex,
      duration: 250,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewIndex]);

  useEffect(() => {
    setViewIndex(show ? 1 : 0);
  }, [show]);

  const containerViewStyle = () => {
    const opacity = _viewValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    return {
      ...styles.container,
      top: show ? 0 : Devices.screen.height,
      opacity,
    };
  };

  const contentViewStyle = () => {
    const bottom = _viewValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-Devices.screen.height, (Devices.screen.height - height) / 2],
    });
    return {
      ...styles.content,
      bottom,
      height,
      top: (Devices.screen.height - height) / 2,
    };
  };

  return (
    <Animated.View
      style={containerViewStyle()}
    >

      <Animated.View
        style={contentViewStyle()}
      >

        <ScrollView
          scrollEnabled={allowScrolling}
        >

          {children}

        </ScrollView>

      </Animated.View>

    </Animated.View>
  );
};

Modal.propTypes = {
  children: PropTypes.any,
  show: PropTypes.bool,
  height: PropTypes.number,
  allowScrolling: PropTypes.bool,
};

Modal.defaultProps = {
  children: null,
  show: false,
  height: Devices.screen.height - 100,
  allowScrolling: true,
};

export default Modal;
