import React, { useState } from 'react';
import { DynamicColorIOS, PixelRatio, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Colors, Devices, Typography } from '../../styles';
import Header from '../../components/Header';
import { useStore } from '../../stores/RootStore';
import { Picker } from '@react-native-picker/picker';
import Popup from '../../components/Popup';
import config from '../../config';
import { useFontScale } from '../../utils/fontScaling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    marginBottom: 14,
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
});

const Accessibility = observer(({
  navigation,
}) => {
  const store = useStore();
  const currentFontScale = useFontScale();
  const insets = useSafeAreaInsets();

  const [showNavigationDirections, setShowNavigationDirections] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [languageLabel, setLanguageLabel] = useState(config.LANAGUAGES[store.preferences.language]);

  const updateNotifications = (toggled, type) => {
    if (toggled) {
      store.preferences.addNotification(type);
    }
    else {
      store.preferences.removeNotification(type);
    }
  };

  const switchTrackColor = () => {
    const falseContrast = DynamicColorIOS({
      dark: Colors.white,
      light: Colors.white,
      highContrastDark: Colors.white,
      highContrastLight: Colors.white,
    });
    const trueContrast = DynamicColorIOS({
      dark: Colors.secondary2,
      light: Colors.secondary2,
      highContrastDark: Colors.primary1,
      highContrastLight: Colors.primary1,
    });
    return {
      false: falseContrast,
      true: trueContrast,
    };
  };

  const switchThumbColorSelected = () => {
    return DynamicColorIOS({
      dark: Colors.primary1,
      light: Colors.primary1,
      highContrastDark: Colors.white,
      highContrastLight: Colors.white,
    });
  };

  const switchThumbColorUnselected = () => {
    return DynamicColorIOS({
      dark: Colors.white,
      light: Colors.white,
      highContrastDark: Colors.white,
      highContrastLight: Colors.white,
    });
  };

  const switchIosBackgroundColor = () => {
    return DynamicColorIOS({
      dark: Colors.secondary2,
      light: Colors.secondary2,
      highContrastDark: Colors.secondary2,
      highContrastLight: Colors.secondary2,
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
        title={translator.t('views.account.accessibility.header')}
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
              >{translator.t('views.account.accessibility.directions')}</Text>

              <Pressable
                style={menuItemValueStyle()}
                onPress={() => {
                  setShowNavigationDirections(true);
                }}
                accessibilityLabel={translator.t('views.account.accessibility.directionsLabel')}
                accessibilityLanguage={store.preferences.language || 'en'}
              >
                <Text
                  style={styles.menuItemValueText}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{translator.t(`views.account.accessibility.${store.preferences.navigationDirections}`)}</Text>
              </Pressable>

            </View>

          </View>

          <View style={styles.section}>

            <View style={menuItemStyle()}>

              <Text
                style={styles.menuItemText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.accessibility.language')}</Text>

              <Pressable
                style={menuItemValueStyle()}
                onPress={() => {
                  setShowLanguagePicker(true);
                }}
                accessibilityLabel={translator.t('views.account.accessibility.languageLabel')}
                accessibilityLanguage={store.preferences.language || 'en'}
              >
                <Text
                  style={styles.menuItemValueText}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{translator.t(`views.account.accessibility.${config.LANAGUAGES[store.preferences.language]}`)}</Text>
              </Pressable>

            </View>

          </View>

          <View style={styles.section}>
            {config.NOTIFICATION_CHANNELS.map(n => {
              return (
                <View key={n.value} style={menuItemStyle()}>

                  <Text
                    style={styles.menuItemText}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  >{translator.t(`views.account.accessibility.${n.label}`)}</Text>

                  <View
                    style={styles.menuItemValue}
                  >
                    <Switch
                      style={{
                        transform: [{
                          scaleX: Math.min(config.MAX_FONT_SCALE * 0.8, currentFontScale),
                        }, {
                          scaleY: Math.min(config.MAX_FONT_SCALE * 0.8, currentFontScale),
                        }],
                      }}
                      trackColor={Devices.isIphone && switchTrackColor()}
                      thumbColor={Devices.isIphone && (store.preferences.notifications.indexOf(n.value) > -1 ? switchThumbColorSelected() : switchThumbColorUnselected())}
                      ios_backgroundColor={Devices.isIphone && switchIosBackgroundColor()}
                      onValueChange={(value) => {
                        updateNotifications(value, n.value);
                      }}
                      value={store.preferences.notifications.indexOf(n.value) > -1}
                      accessibilityLabel={translator.t('views.account.accessibility.notificationToggle', { type: translator.t(`views.account.accessibility.${n.label}`) })}
                      accessibilityLanguage={store.preferences.language || 'en'}
                    />
                  </View>

                </View>
              );
            })}
          </View>

        </ScrollView>

      </View>

      <Popup
        title={translator.t('views.account.accessibility.directions')}
        label={translator.t(`views.account.accessibility.${store.preferences.navigationDirections}`)}
        labelStyle={{
          marginBottom: 0,
        }}
        show={showNavigationDirections}
        onClosePress={() => {
          setShowNavigationDirections(false);
        }}
      >
        <Picker
          style={{
            width: '100%',
          }}
          selectedValue={store.preferences.navigationDirections}
          onValueChange={(value) => {
            store.preferences.updateProperty('navigationDirections', value);
          }}>
          <Picker.Item
            label={translator.t('views.account.accessibility.voiceOn')}
            value="voiceOn"
          />
          <Picker.Item
            label={translator.t('views.account.accessibility.voiceOff')}
            value="voiceOff"
          />
        </Picker>
      </Popup>

      <Popup
        title={translator.t('views.account.accessibility.language')}
        label={translator.t(`views.account.accessibility.${config.LANAGUAGES[store.preferences.language]}`)}
        labelStyle={{
          marginBottom: 0,
        }}
        show={showLanguagePicker}
        onClosePress={() => {
          setShowLanguagePicker(false);
        }}
      >
        <Picker
          style={{
            width: '100%',
          }}
          selectedValue={store.preferences.language || 'en'}
          onValueChange={(value) => {
            store.preferences.updateProperty('language', value);
            translator.configure(value, false);
            setLanguageLabel(config.LANAGUAGES[value]);
          }}>
          <Picker.Item
            label={translator.t('views.account.accessibility.english')}
            value="en"
          />
          <Picker.Item
            label={translator.t('views.account.accessibility.spanish')}
            value="es"
          />
        </Picker>
      </Popup>

    </View>
  );
});

Accessibility.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    pop: PropTypes.func,
  }).isRequired,
};

export default Accessibility;
