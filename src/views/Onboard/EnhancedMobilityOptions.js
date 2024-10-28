/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView, NativeModules, PixelRatio, Pressable, ScrollView, StyleSheet, Switch, Text, TouchableWithoutFeedback, View,
} from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors, Devices, Typography } from '../../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useStore } from '../../stores/RootStore';
import config from '../../config';
import { useFontScale } from '../../utils/fontScaling';
import Toggle from '../../components/Toggle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isTablet } from 'react-native-device-info';
import { deviceMultiplier } from '../../styles/devices';
import translator from '../../models/translator';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white
  },
  scroll: {
    paddingHorizontal: 25,
  },
  top: {
    flex: 1,
    paddingTop: 65
  },
  bottom: {
    flex: 1,
  },
  footer: {
    height: 180,
  },
  backButton: {
    color: Colors.primary1,
    marginBottom: 43,
  },
  backButtonIcon: {
    color: Colors.primary1,
  },
  logo: {
    top: 0,
    width: 200,
    height: 129,
    alignSelf: 'center',
  },
  title: {
    ...Typography.h4,
    color: Colors.primary1,
    marginBottom: 50,
  },
  subTitle: {
    ...Typography.h5,
    color: Colors.dark,
    marginBottom: 30,
  },
  pressableWithIcon: {
    display: 'flex',
    flexDirection: 'row',
  },
  pressableWithIconText: {
    color: Colors.primary1,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  selectedAddressContainer: {
    height: 150,
  },
  selectedAddress: {
    backgroundColor: Colors.secondary2,
    padding: 16,
  },
  searchContainer: {
    position: 'absolute',
    top: Devices.screen.height,
    right: 0,
    left: 0,
    height: Devices.screen.height,
    backgroundColor: Colors.white,
    paddingTop: Devices.isIphoneX ? 65 : 45,
  },
  searchResultContainer: {
    flexDirection: 'row',
    borderBottomColor: Colors.secondary2,
    borderBottomWidth: 1,
    height: 50,
    alignItems: 'center',
  },
  searchResultLeft: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultMiddle: {
    flex: 1,
  },
  searchResultRight: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultDistance: {
    ...Typography.h6,
    color: Colors.darker,
  },
  searchResultTitle: {
    ...Typography.h5,
    color: Colors.primary1,
  },
  searchResultDescription: {
    ...Typography.h6,
    color: Colors.primary2,
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 40,
  },
  progressActive: {
    width: 20,
    height: 20,
    backgroundColor: Colors.primary1,
    borderRadius: 10,
  },
  progressInactive: {
    width: 20,
    height: 20,
    backgroundColor: Colors.light,
    borderRadius: 10,
  },
  menuItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemText: {
    flex: 2,
    ...Typography.h6
  },
});

const EnhancedMobilityOptions = observer(({
  navigation,
}) => {

  const store = useStore();
  const currentFontScale = useFontScale();
  const insets = useSafeAreaInsets();

  const [wheelchair, setWheelchair] = useState(false);
  const [serviceAnimal, setServiceAnimal] = useState(false);

  const handleNext = () => {
    let language = Devices.isIphone ? NativeModules.SettingsManager.settings.AppleLocale : NativeModules.I18nManager.localeIdentifier;
    language = language.substring(0, 2);
    // const prefs = {
    //   wheelchair,
    //   serviceAnimal,
    //   language: language === 'es' ? 'es' : 'en'
    // };
    store.registration.updatePreference('wheelchair', wheelchair);
    store.registration.updatePreference('serviceAnimal', serviceAnimal);
    store.registration.updatePreference('language', language === 'es' ? 'es' : 'en');
    navigation.push('onboard.confirm');
  };

  const menuItemStyle = () => {
    return {
      ...styles.menuItem,
      marginBottom: 14 * Math.min(config.MAX_FONT_SCALE, currentFontScale),
    };
  };

  const menuItemValueStyle = () => {
    return {
      ...styles.menuItemValue,
      width: isTablet() ?
        PixelRatio.getPixelSizeForLayoutSize(currentFontScale > 1.18 ? 60 : 50) * deviceMultiplier :
        PixelRatio.getPixelSizeForLayoutSize(currentFontScale > 1.18 ? 50 : 40),
    };
  };

  const containerStyle = () => {
    return {
      ...styles.container,
      paddingTop: insets.top,
      paddingBottom: insets.bottom
    }
  };

  const contentStyle = () => {
    return {
      height: Devices.screen.height - (insets.top + insets.bottom)
    }
  };

  return (
    <View
      style={containerStyle()}
    >

      <ScrollView style={styles.scroll}>

        <View style={contentStyle()}>

          <View style={styles.top}>

            <Pressable
              style={styles.backButton}
              accessibilityLabel={translator.t('global.backLabelDefault')}
              onPress={() => {
                navigation.pop();
              }}>
              <FontAwesomeIcon
                icon="chevron-left"
                size={20 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                style={styles.backButtonIcon} />
            </Pressable>

            <Image
              style={styles.logo}
              resizeMode="contain"
              source={require('../../../assets/images/ITS4US_Buffalo_Logo.png')}
            />

          </View>

          <View style={styles.bottom}>

            <Text
              style={styles.title}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.onboard.enhanced.title')}</Text>

            <View style={menuItemStyle()}>

              <Text
                style={styles.menuItemText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.onboard.enhanced.menuItem1')}</Text>

              <View
                style={menuItemValueStyle()}
              >
                <Toggle
                  toggled={wheelchair}
                  onChange={(value) => {
                    setWheelchair(value);
                  }}
                />
                {/* <Switch
                  style={{
                    transform: [{
                      scaleX: Math.min(config.MAX_FONT_SCALE * 0.8, currentFontScale),
                    }, {
                      scaleY: Math.min(config.MAX_FONT_SCALE * 0.8, currentFontScale),
                    }],
                  }}
                  trackColor={{ false: Colors.white, true: Colors.secondary2 }}
                  thumbColor={wheelchair ? Colors.primary1 : Colors.white}
                  ios_backgroundColor={Colors.secondary2}
                  onValueChange={(value) => {
                    setWheelchair(value);
                  }}
                  value={wheelchair}
                /> */}
              </View>

            </View>

            <View style={menuItemStyle()}>

              <Text
                style={styles.menuItemText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.onboard.enhanced.menuItem2')}</Text>

              <View
                style={menuItemValueStyle()}
              >
                <Toggle
                  toggled={serviceAnimal}
                  onChange={(value) => {
                    setServiceAnimal(value);
                  }}
                />
                {/* <Switch
                  style={{
                    transform: [{
                      scaleX: Math.min(config.MAX_FONT_SCALE * 0.8, currentFontScale),
                    }, {
                      scaleY: Math.min(config.MAX_FONT_SCALE * 0.8, currentFontScale),
                    }],
                  }}
                  trackColor={{ false: Colors.white, true: Colors.secondary2 }}
                  thumbColor={serviceAnimal ? Colors.primary1 : Colors.white}
                  ios_backgroundColor={Colors.secondary2}
                  onValueChange={(value) => {
                    setServiceAnimal(value);
                  }}
                  value={serviceAnimal}
                /> */}
              </View>

            </View>

            {/* <Text
              style={styles.subTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >Entered in the email to find enhanced mobility options you are registered with such as [x].</Text>

            <Input
              placeholder="Add email"
              label="Email"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
              }}
              returnKeyType="done"
            />

            <Pressable
              style={styles.pressableWithIcon}
            >
              <FontAwesomeIcon
                icon="plus"
                color={Colors.primary1}
              />
              <Text
                style={styles.pressableWithIconText}
              >
                Add another email address
              </Text>
            </Pressable> */}

          </View>

          <View style={styles.footer}>

            <Button
              label={translator.t('global.nextLabel')}
              onPress={handleNext}
              width={isTablet() ? '50%' : '100%'}
              buttonStyle={{
                alignSelf: 'center'
              }}
            />

            <Button
              label={translator.t('global.skipLabel')}
              width={isTablet() ? '50%' : '100%'}
              buttonStyle={{
                backgroundColor: Colors.white,
                borderColor: Colors.white,
                alignSelf: 'center'
              }}
              labelStyle={{
                color: Colors.primary1,
              }}
              onPress={() => {
                navigation.push('onboard.confirm');
              }}
            />

            <View style={styles.progressContainer}>
              <View style={styles.progressInactive} />
              <View style={styles.progressInactive} />
              <View style={styles.progressInactive} />
              <View style={styles.progressInactive} />
              <View style={styles.progressActive} />
            </View>

          </View>

        </View>

      </ScrollView>

    </View>
  );
});

EnhancedMobilityOptions.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default EnhancedMobilityOptions;
