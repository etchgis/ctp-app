import Slider from '@react-native-community/slider';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import PropTypes from 'prop-types';
import { Colors, Devices, Typography } from '../styles';
import Pressable from 'react-native/Libraries/Components/Pressable/Pressable';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import translator from '../models/translator';
import { useStore } from '../stores/RootStore';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 400,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 50,
    paddingVertical: 20,
  },
  title: {
    ...Typography.h4,
    marginBottom: 100,
  },
  label: {
    ...Typography.h1,
    marginBottom: 50,
  },
  close: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
});

const Popup = ({
  title,
  titleStyle,
  label,
  labelStyle,
  show,
  children,
  onClosePress,
}) => {

  const store = useStore();
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
    if (show) {
      setViewIndex(1);
    }
    else {
      setViewIndex(0);
    }
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
      outputRange: [-400, 0],
    });
    return {
      ...styles.content,
      bottom,
    };
  };

  const tStyle = {
    ...styles.title,
    ...titleStyle,
  };

  const lStyle = {
    ...styles.label,
    ...labelStyle,
  };

  return (
    <Animated.View
      style={containerViewStyle()}
    >

      <Animated.View
        style={contentViewStyle()}
      >

        <Pressable
          style={styles.close}
          onPress={() => {
            if (onClosePress) {
              onClosePress();
            }
          }}
          accessibilityLabel={translator.t('global.closeLabel')}
          accessibilityLanguage={store.preferences.language || 'en'}
        >
          <FontAwesomeIcon
            icon="xmark"
            size={24}
            color={Colors.primary1}
          />
        </Pressable>

        {title &&
          <Text style={tStyle}>{title}</Text>
        }

        {label &&
          <Text style={lStyle}>{label}</Text>
        }

        {children}

      </Animated.View>

    </Animated.View>
  );
};

Popup.propTypes = {
  title: PropTypes.string,
  titleStyle: PropTypes.object,
  label: PropTypes.string,
  labelStyle: PropTypes.object,
  show: PropTypes.bool,
  children: PropTypes.any,
  onClosePress: PropTypes.func,
};

Popup.defaultProps = {
  title: 'Something',
  titleStyle: {},
  label: 'Value',
  labelStyle: {},
  show: false,
  children: {},
  onClosePress: null,
};

export default Popup;
