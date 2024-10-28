/* eslint-disable react-hooks/exhaustive-deps */
import React, { createRef, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, PixelRatio, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PropTypes from 'prop-types';
import Input from './Input';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Colors, Devices, Typography } from '../styles';
import { geocoder } from '../services/transport';
import config from '../config';
import LocationData from '../models/location-data';
import booleanContains from '@turf/boolean-contains';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Devices.screen.height,
    right: 0,
    left: 0,
    height: Devices.screen.height,
    backgroundColor: Colors.white,
    paddingTop: Devices.isIphoneX ? 65 : 45,
  },
  resultContainer: {
    flexDirection: 'row',
    borderBottomColor: Colors.secondary2,
    borderBottomWidth: 1,
    minHeight: 50,
    alignItems: 'center',
  },
  left: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
  },
  right: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distance: {
    ...Typography.h6,
    color: Colors.darker,
    marginTop: 2,
  },
  title: {
    ...Typography.h5,
    color: Colors.primary1,
  },
  description: {
    ...Typography.h6,
    color: Colors.primary2,
  },
  favorite: {
    fontWeight: 'bold',
    color: Colors.primary1,
    ...Typography.h4,
  },
});

const AddressSearch = ({
  location,
  show,
  homeAddress,
  savedAddresses,
  onCancelPress,
  onAddressSelect,
}) => {

  const [displayIndex, setDisplayIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [geocodeResults, setGeocodeResults] = useState([]);

  const _inputRef = createRef();

  const _displayValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(_displayValue, {
      toValue: displayIndex,
      duration: Devices.isIphone ? 250 : 0,  // bug with android keyboard causing the component to go too high
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [displayIndex]);

  useEffect(() => {
    setInputValue('');
    let list = savedAddresses;
    if (homeAddress) {
      list = [homeAddress, ...savedAddresses];
    }
    if (location?.lng && location?.lat) {
      const currentLocation = { 'alias': 'Current Location', 'description': '', 'distance': '0 ft', 'point': { 'lng': location.lng, 'lat': location.lat }, 'text': 'Current Location', 'title': 'Current Location' };
      list = [...[currentLocation], ...savedAddresses];
    }
    setGeocodeResults(list);
    if (show) {
      setDisplayIndex(1);
      _inputRef.current.focus();
    }
    else {
      setDisplayIndex(0);
      _inputRef.current.blur();
    }
  }, [show]);

  const handleCancelPress = () => {
    if (onCancelPress) {
      onCancelPress();
    }
  };

  const handleClearPress = () => {
    setInputValue('');
    let list = savedAddresses;
    if (location?.lng && location?.lat) {
      const currentLocation = { 'alias': 'Current Location', 'description': '', 'distance': '0 ft', 'point': { 'lng': location.lng, 'lat': location.lat }, 'text': 'Current Location', 'title': 'Current Location' };
      list = [...[currentLocation], ...savedAddresses];
    }
    setGeocodeResults(list);
  };

  const handleTextChange = (value) => {
    setInputValue(value);
    if (geocoder) {
      console.log(location);
      let list =
        savedAddresses.filter(l => l.alias.toLowerCase().startsWith(value.toLowerCase()));
      geocoder.forward(value, location)
        .then((results) => {
          if (location?.lng && location?.lat && 'current location'.startsWith(value.toLowerCase())) {
            const currentLocation = { 'alias': 'Current Location', 'description': '', 'distance': '0 ft', 'point': { 'lng': location.lng, 'lat': location.lat }, 'text': 'Current Location', 'title': 'Current Location' };
            list = [...[currentLocation], ...list];
          }
          setGeocodeResults([...list, ...results]);
        })
        .catch((e) => {
          console.warn(e);
        });
    }
  };

  const handleAddressSelect = (address) => {
    Keyboard.dismiss();
    if (!address.alias) {
      let txt = address.title;
      if (address.description) {
        txt += `, ${address.description}`;
      }
      address.text = txt;
    }
    if (onAddressSelect) {
      onAddressSelect(address);
    }
  };

  const handleAutoCompletePress = (address) => {
    let txt = address.alias;
    if (!txt) {
      txt = address.title;
      if (address.description) {
        txt += `, ${address.description}`;
      }
    }
    setInputValue(txt);
  };

  const searchViewStyle = () => {
    const top = _displayValue.interpolate({
      inputRange: [0, 1],
      outputRange: [Devices.screen.height, 0],
    });
    return {
      ...styles.container,
      top,
    };
  };

  return (
    <Animated.View
      style={searchViewStyle()}
    >

      <Input
        ref={_inputRef}
        leftIconName="chevron-left"
        rightIconName="xmark"
        onLeftIconPress={handleCancelPress}
        onRightIconPress={handleClearPress}
        value={inputValue}
        onChangeText={handleTextChange}
        inputStyle={{
          marginHorizontal: 25,
          marginBottom: 8,
        }}
      />

      <ScrollView
        keyboardShouldPersistTaps="always"
      >
        {geocodeResults.map((r, i) => {
          let { distance } = r;
          if (distance && distance >= 0) {
            let [num, units] = distance.split(' ');
            num = parseFloat(num);
            if (num > 1000) {
              distance = null;
            } else if (num > 10) {
              distance = `${Math.round(num)} ${units}`;
            }
            else {
              distance = '';
            }
          }
          else {
            distance = '';
          }
          return (
            <TouchableOpacity
              key={i}
              style={styles.resultContainer}
              onPress={() => {
                handleAddressSelect(r);
              }}
            >
              <View style={styles.left}>
                <FontAwesomeIcon
                  icon="location-dot"
                  color={Colors.primary1}
                  size={16}
                />
                {distance && distance.length > 0 && !r.id &&
                  <Text style={styles.distance} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{distance}</Text>
                }
              </View>
              <View style={styles.middle}>
                {r.alias && r.alias.length > 0 &&
                  <Text style={styles.favorite} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{r.alias}</Text>
                }
                {!r.alias &&
                  <View
                    style={{
                      justifyContent: 'center',
                    }}>
                    <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>
                      {r.title}
                    </Text>
                    {r.description && r.description.length > 0 &&
                      <Text style={styles.description} numberOfLines={1} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>
                        {r.description}
                      </Text>
                    }
                  </View>
                }

              </View>
              <View style={styles.right}>
                <TouchableOpacity
                  onPress={() => {
                    handleAutoCompletePress(r);
                  }}
                >
                  <FontAwesomeIcon
                    style={{ color: Colors.primary2, transform: [{ rotate: '45deg' }] }}
                    icon="arrow-left"
                    size={16 * Math.min(1.5, PixelRatio.getFontScale())}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

    </Animated.View>
  );

};

AddressSearch.propTypes = {
  show: PropTypes.bool,
  searchText: PropTypes.string,
  savedAddresses: PropTypes.array,
  onCancelPress: PropTypes.func,
  onAddressSelect: PropTypes.func,
};

AddressSearch.defaultProps = {
  show: false,
  searchText: '',
  savedAddresses: [],
};

export default AddressSearch;
