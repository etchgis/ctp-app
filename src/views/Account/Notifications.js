/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { DynamicColorIOS, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Colors, Devices, Typography } from '../../styles';
import Header from '../../components/Header';
import { useStore } from '../../stores/RootStore';
import config from '../../config';
import { useFontScale } from '../../utils/fontScaling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isTablet } from 'react-native-device-info';
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
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 14,
    ...Typography.h6
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

const Notifications = observer(({
  navigation,
}) => {
  const store = useStore();
  const currentFontScale = useFontScale();
  const insets = useSafeAreaInsets();

  const [dependents, setDependents] = useState(store.traveler.dependents || []);

  useEffect(() => {
    fetchDependents();
  }, []);

  const fetchDependents = () => {
    store.authentication.fetchAccessToken()
      .then((accessToken) => {
        store.traveler.getDependents(accessToken)
          .then(results => {
            setDependents(results);
          })
          .catch((e) => {
            console.log('get dependents error', e);
          });
      })
      .catch((e) => {
        console.log('fetch access token error', e);
      });
  };

  const updateNotificationTypes = (toggled, types) => {
    if (toggled) {
      store.preferences.addNotificationType(types);
    }
    else {
      store.preferences.removeNotificationType(types);
    }
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

  const menuItemTextStyle = () => {
    const customContrastDynamicTextColor = DynamicColorIOS({
      dark: Colors.medium,
      light: Colors.primary1,
      highContrastDark: Colors.black,
      highContrastLight: Colors.white,
    });
    return {
      ...styles.menuItemText,
      color: customContrastDynamicTextColor,
    };
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

  return (
    <View style={styles.container}>
      <Header
        title={translator.t('views.account.notifications.header')}
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
              >{translator.t('views.account.notifications.preference')}</Text>

              <Pressable
                style={styles.menuItemValue}
                onPress={() => {
                  navigation.push('account.accessibility');
                }}
                accessibilityLabel={translator.t('views.account.notifications.preferenceLabel')}
                accessibilityLanguage={store.preferences.language || 'en'}
              >
                <Text
                  style={styles.menuItemText}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{translator.t('views.account.notifications.settings')}</Text>
              </Pressable>

            </View>

          </View>

          <View style={styles.section}>

            <Text
              style={styles.sectionTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.notifications.alerts.rider.title')}</Text>

            {config.NOTIFICATION_TYPES.traveler.map(n => {
              let selected = false;
              for (let j = 0; j < n.types.length; j++) {
                if (store.preferences.notificationTypes.indexOf(n.types[j]) > -1) {
                  selected = true;
                }
              }
              return (
                <View
                  key={n.value}
                  style={menuItemStyle()}
                >

                  <Text
                    style={styles.menuItemText}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  >{translator.t(`views.account.notifications.alerts.rider.${n.value}`)}</Text>

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
                      thumbColor={Devices.isIphone && (selected ? switchThumbColorSelected() : switchThumbColorUnselected())}
                      ios_backgroundColor={Devices.isIphone && switchIosBackgroundColor()}
                      onValueChange={(value) => {
                        updateNotificationTypes(value, n.types);
                      }}
                      value={selected}
                      accessibilityLabel={translator.t('views.account.notifications.alerts.alertToggle', { type: translator.t(`views.account.notifications.alerts.rider.${n.value}`) })}
                      accessibilityLanguage={store.preferences.language || 'en'}
                    />
                  </View>

                </View>
              );
            })}

          </View>

          {dependents.length > 0 &&
            <View style={styles.section}>

              <Text
                style={styles.sectionTitle}
              >{translator.t('views.account.notifications.alerts.caregiver.title')}</Text>

              {config.NOTIFICATION_TYPES.caregiver.map(n => {
                let selected = false;
                for (let j = 0; j < n.types.length; j++) {
                  if (store.preferences.notificationTypes.indexOf(n.types[j]) > -1) {
                    selected = true;
                  }
                }
                return (
                  <View
                    key={n.value}
                    style={menuItemStyle()}
                  >

                    <Text
                      style={styles.menuItemText}
                      maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                    >{translator.t(`views.account.notifications.alerts.caregiver.${n.value}`)}</Text>

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
                        trackColor={switchTrackColor()}
                        thumbColor={selected ? switchThumbColorSelected() : switchThumbColorUnselected()}
                        ios_backgroundColor={switchIosBackgroundColor()}
                        onValueChange={(value) => {
                          updateNotificationTypes(value, n.types);
                        }}
                        value={selected}
                        accessibilityLabel={translator.t('views.account.notifications.alerts.alertToggle', { type: translator.t(`views.account.notifications.alerts.caregiver.${n.value}`) })}
                        accessibilityLanguage={store.preferences.language || 'en'}
                      />
                    </View>

                  </View>
                );
              })}

            </View>
          }

        </ScrollView>

      </View>

    </View>
  );
});

Notifications.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    pop: PropTypes.func,
  }).isRequired,
};

export default Notifications;
