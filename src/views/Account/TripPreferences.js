import React, { useState } from 'react';
import { PixelRatio, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Colors, Devices, Typography } from '../../styles';
import Header from '../../components/Header';
import { useStore } from '../../stores/RootStore';
import Popup from '../../components/Popup';
import CheckBox from '@react-native-community/checkbox';
import Slider from '@react-native-community/slider';
import config from '../../config';
import { useFontScale } from '../../utils/fontScaling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toggle from '../../components/Toggle';
import { isTablet } from 'react-native-device-info';
import { deviceMultiplier } from '../../styles/devices';
import translator from '../../models/translator';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 25,
    paddingTop: 65,
  },
  content: {
    flex: 1,
  },
  section: {
    borderBottomColor: Colors.secondary2,
    borderBottomWidth: 1,
    marginBottom: 26,
    paddingHorizontal: 10,
  },
  menuItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemText: {
    ...Typography.h6,
    flex: 2,
  },
  menuItemValue: {
    // width: 70,
    alignItems: 'flex-end',
  },
  menuItemValueText: {
    // width: 70,
    alignItems: 'flex-end',
    ...Typography.h6,
    paddingVertical: 20
  },
  checkBoxContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  // NOTE CheckBox size:  RELOAD to see changes
  checkBox: {
    marginRight: Devices.isAndroid ? 25 : 15,
    height: 20 * deviceMultiplier,
    width: 20 * deviceMultiplier,
    transform: [{
      scaleX: (Devices.isAndroid ? 1.5 : 1) * deviceMultiplier
    }, {
      scaleY: (Devices.isAndroid ? 1.5 : 1) * deviceMultiplier
    }],
    backgroundColor: Devices.isAndroid ? 'none' : Colors.secondary1,
  },
  checkBoxText: {
    color: Colors.dark,
    fontWeight: 'bold',
    ...Typography.h6
  },
});

const TripPreferences = observer(({
  navigation,
}) => {
  const store = useStore();
  const preferences = store.preferences;
  const currentFontScale = useFontScale();
  console.log(currentFontScale);
  const insets = useSafeAreaInsets();

  const [showMaxCostSlider, setShowMaxCostSlider] = useState(false);
  const [maxCostLabel, setMaxCostLabel] = useState(`$${preferences.maxCost}`);
  const [showMaxTransferSlider, setShowMaxTransferSlider] = useState(false);

  const updateModes = (toggled, mode) => {
    if (toggled) {
      store.preferences.addMode(mode);
    }
    else {
      store.preferences.removeMode(mode);
    }
  };

  const configModesToCheckboxes = () => {
    return config.MODES
      .filter(m => m.id !== 'walk' && m.mode !== 'indoor')
      .map((m, i) => {
        return (
          <View
            key={i}
            style={styles.checkBoxContainer}
          >
            <CheckBox
              value={preferences.modes.indexOf(m.mode) > -1}
              onValueChange={(value) => {
                updateModes(value, m.mode);
              }}
              boxType="square"
              style={styles.checkBox}
              accessibilityLabel={translator.t('global.modes.checkLabel', { mode: translator.t(`global.modes.${m.id}`) })}
              accessibilityLanguage={store.preferences.language || 'en'}
            />
            <Text
              style={styles.checkBoxText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t(`global.modes.${m.id}`)}</Text>
          </View>
        );
      });
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

  return (
    <View style={styles.container}>
      <Header
        title={translator.t('views.account.tripPreferences.header')}
        onBackPress={() => {
          navigation.pop();
        }}
        backLabel={translator.t('global.backLabel', { to: translator.t('views.account.menu.header') })}
      />
      <View style={styles.content}>

        <ScrollView
          style={{
            marginBottom: insets.bottom,
          }}
          contentContainerStyle={{
            paddingBottom: 100,
          }}
        >

          <View style={styles.section}>


            <View style={menuItemStyle()}>

              <Text
                style={styles.menuItemText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.tripPreferences.wheelchair')}</Text>

              <View
                style={menuItemValueStyle()}
              >
                <Toggle
                  toggled={preferences.wheelchair}
                  onChange={(value) => {
                    store.preferences.updateProperty('wheelchair', value);
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
                  thumbColor={preferences.wheelchair ? Colors.primary1 : Colors.white}
                  ios_backgroundColor={Colors.secondary2}
                  onValueChange={(value) => {
                    store.preferences.updateProperty('wheelchair', value);
                  }}
                  value={preferences.wheelchair}
                /> */}
              </View>

            </View>

            <View style={menuItemStyle()}>

              <Text
                style={styles.menuItemText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.tripPreferences.serviceAnimal')}</Text>

              <View
                style={menuItemValueStyle()}
              >
                <Toggle
                  toggled={preferences.serviceAnimal}
                  onChange={(value) => {
                    store.preferences.updateProperty('serviceAnimal', value);
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
                  thumbColor={preferences.serviceAnimal ? Colors.primary1 : Colors.white}
                  ios_backgroundColor={Colors.secondary2}
                  onValueChange={(value) => {
                    store.preferences.updateProperty('serviceAnimal', value);
                  }}
                  value={preferences.serviceAnimal}
                /> */}
              </View>

            </View>

            <View style={menuItemStyle()}>

              <Text
                style={styles.menuItemText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.tripPreferences.minimizeWalking')}</Text>

              <View
                style={menuItemValueStyle()}
              >
                <Toggle
                  toggled={preferences.minimizeWalking}
                  onChange={(value) => {
                    store.preferences.updateProperty('minimizeWalking', value);
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
                  thumbColor={preferences.minimizeWalking ? Colors.primary1 : Colors.white}
                  ios_backgroundColor={Colors.secondary2}
                  onValueChange={(value) => {
                    store.preferences.updateProperty('minimizeWalking', value);
                  }}
                  value={preferences.minimizeWalking}
                /> */}
              </View>

            </View>

            <View style={menuItemStyle()}>

              <Text
                style={styles.menuItemText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.tripPreferences.maxTransfers')}</Text>

              <Pressable
                onPress={() => {
                  setShowMaxTransferSlider(true);
                }}
                accessibilityLabel={translator.t('views.account.tripPreferences.maxTransfersLabel')}
                accessibilityLanguage={store.preferences.language || 'en'}
              >
                <Text
                  style={styles.menuItemValueText}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >
                  {translator.t('global.transferCount', { count: preferences.maxTransfers || 2 })}
                </Text>
              </Pressable>

            </View>

          </View>

          <View style={styles.section}>

            <Text
              style={{ marginBottom: 20 }}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.tripPreferences.preferredModes')}</Text>

            {configModesToCheckboxes()}

          </View>

          {/* <View style={styles.section}>

          <Text style={{ marginBottom: 20 }}>Enhanced Mobility Options</Text>

          <Text style={{ marginBottom: 24 }}>Mobility Option 1</Text>

          <Text style={{ marginBottom: 24 }}>Mobility Option 2</Text>

        </View> */}

        </ScrollView>

      </View>

      <Popup
        title="Max Cost per Trip"
        label={maxCostLabel}
        show={showMaxCostSlider}
        onClosePress={() => {
          setShowMaxCostSlider(false);
        }}
      >
        <Slider
          style={{
            width: '100%',
          }}
          minimumValue={0}
          maximumValue={100}
          step={5}
          value={preferences.maxCost}
          minimumTrackTintColor={Colors.primary1}
          maximumTrackTintColor={Colors.secondary2}
          thumbTintColor={Colors.primary1}
          onSlidingComplete={(value) => {
            store.preferences.updateProperty('maxCost', value);
            setMaxCostLabel(`$${value}`);
          }}
        />
      </Popup>

      <Popup
        title={translator.t('views.account.tripPreferences.maxTransfers')}
        label={translator.t('global.transferCount', { count: preferences.maxTransfers || 2 })}
        show={showMaxTransferSlider}
        onClosePress={() => {
          setShowMaxTransferSlider(false);
        }}
      >
        <Slider
          style={{
            width: '100%',
          }}
          minimumValue={0}
          maximumValue={8}
          step={1}
          value={preferences.maxTransfers}
          minimumTrackTintColor={Colors.primary1}
          maximumTrackTintColor={Colors.secondary2}
          thumbTintColor={Colors.primary1}
          onSlidingComplete={(value) => {
            store.preferences.updateProperty('maxTransfers', value);
          }}
        />
      </Popup>

    </View>
  );
});

TripPreferences.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    pop: PropTypes.func,
  }).isRequired,
};

export default TripPreferences;
