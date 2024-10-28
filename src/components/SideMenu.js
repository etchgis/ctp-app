/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, Devices } from '../styles';
import { useStore } from '../stores/RootStore';
import { observer } from 'mobx-react';

const MENU_WIDTH = Devices.screen.width - 100;

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.black,
  },
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: -5,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
});

const SideMenu = observer(({
}) => {

  const store = useStore();

  const [displayIndex, setDisplayIndex] = useState(0);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0);

  const _displayValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(_displayValue, {
      toValue: displayIndex,
      duration: 250,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [displayIndex]);

  useEffect(() => {
    setDisplayIndex(store.display.sideMenuVisible ? 1 : 0);
  }, [store.display.sideMenuVisible]);

  useEffect(() => {
    _displayValue.addListener((d) => {
      setBackgroundOpacity(d.value);
    });
    return () => {
      _displayValue.removeAllListeners();
    };
  }, []);

  const backgroundViewStyle = () => {
    const opacity = _displayValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.35],
    });
    return {
      ...styles.background,
      opacity,
    };
  };

  const containerViewStyle = () => {
    const right = _displayValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-MENU_WIDTH, 0],
    });
    return {
      ...styles.container,
      right,
    };
  };

  return (
    <>
      {backgroundOpacity > 0 &&
        <Animated.View
          style={backgroundViewStyle()}
        />
      }
      <Animated.View
        style={containerViewStyle()}
      >
        <TouchableOpacity
          onPress={() => {
            store.display.hideSideMenu();
          }}
        >
          <Text>MENU</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
});

export default SideMenu;
