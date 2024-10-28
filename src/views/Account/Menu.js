/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Colors, Typography } from '../../styles';
import Header from '../../components/Header';
import { useStore } from '../../stores/RootStore';
import { useIsUserExpired } from '../../utils/isUserExpired';
import { useFocusEffect } from '@react-navigation/native';
import config from '../../config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  menuTitle: {
    marginTop: 20,
    marginBottom: 10,
    ...Typography.h5,
  },
  menuItem: {
    marginVertical: 10,
    ...Typography.h4,
    color: Colors.primary1,
    fontWeight: 'bold',
  },
});

const AccountMenu = observer(({
  navigation,
}) => {
  console.log('AccountMenu render', Date.now());

  const store = useStore();
  // useIsUserExpired(store, navigation);
  const insets = useSafeAreaInsets();

  const [dependents, setDependents] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchDependents();
    }, [])
  );

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

  const logout = () => {
    Alert.alert(
      translator.t('views.account.menu.alerts.logout.title'),
      translator.t('views.account.menu.alerts.logout.message'),
      [
        {
          text: translator.t('views.account.menu.alerts.logout.buttons.no'),
          style: 'cancel',
        },
        {
          text: translator.t('views.account.menu.alerts.logout.buttons.yes'),
          onPress: () => {
            store.authentication.logout();
            store.mapManager.setCurrentMap('home');
            // store.mapManager.setCurrentIndoorMap('results');
            navigation.reset({
              index: 0,
              routes: [{ name: 'landing' }],
            });
          },
        },
      ],
    );
  };

  const leave = () => {
    store.authentication.logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'landing' }],
    });
  };

  const showWarning = () => {
    Alert.alert(
      translator.t('views.account.menu.alerts.warning.title'),
      translator.t('views.account.menu.alerts.warning.message'),
      [
        {
          text: translator.t('views.account.menu.alerts.warning.buttons.ok'),
          style: 'cancel',
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={translator.t('views.account.menu.header')}
        accessibilityLabel={translator.t('global.backLabelDefault')}
        accessibilityLanguage={store.preferences.language || 'en'}
        onBackPress={() => {
          navigation.pop();
        }}
      />

      <View
        style={styles.content}
      >
        <ScrollView
          style={{
            marginBottom: insets.bottom,
          }}
          contentContainerStyle={{
            paddingBottom: 100,
          }}
        >

          <Text
            style={styles.menuTitle}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >
            {translator.t('views.account.menu.account')}
          </Text>
          <Text
            style={styles.menuItem}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            onPress={() => {
              if (store.authentication.loggedIn) {
                navigation.push('account.profile');
              }
              else {
                showWarning();
              }
            }}
          >{translator.t('views.account.menu.profile')}</Text>
          <Text
            style={styles.menuItem}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            onPress={() => {
              if (store.authentication.loggedIn) {
                navigation.push('account.caregivers');
              }
              else {
                showWarning();
              }
            }}
          >{translator.t('views.account.menu.caregivers')}</Text>
          {dependents.length > 0 &&
            <Text
              style={styles.menuItem}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              onPress={() => {
                if (store.authentication.loggedIn) {
                  navigation.push('account.dependents');
                }
                else {
                  showWarning();
                }
              }}
            >{translator.t('views.account.menu.dependents')}</Text>
          }

          <Text
            style={styles.menuItem}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            onPress={() => {
              if (store.authentication.loggedIn) {
                navigation.push('account.favorites');
              }
              else {
                showWarning();
              }
            }}
          >{translator.t('views.account.menu.favorites')}</Text>

          <Text
            style={styles.menuItem}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            onPress={() => {
              if (Linking.canOpenURL) {
                Linking.openURL('https://paldirect.nfta.com/');
              }
            }}
          >NFTA Paratransit Access Line (PAL) Direct Users</Text>

          <Text
            style={styles.menuItem}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            onPress={() => {
              if (store.authentication.loggedIn) {
                navigation.push('account.feedback');
              }
              else {
                showWarning();
              }
            }}
          >{translator.t('views.account.menu.feedback')}</Text>

          <Text
            style={styles.menuItem}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            onPress={() => {
              navigation.push('account.termsAndConditions');
            }}
          >{translator.t('views.account.menu.termsAndConditions')}</Text>

          <Text
            style={styles.menuItem}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            onPress={() => {
              if (Linking.canOpenURL) {
                Linking.openURL(config.HELP);
              }
            }}
          >{translator.t('views.account.menu.help')}</Text>

          <Text
            style={styles.menuItem}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            onPress={logout}
          >{translator.t('views.account.menu.logOut')}</Text>

          <Text
            style={styles.menuTitle}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.account.menu.settings')}</Text>

          <Text
            style={styles.menuItem}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            onPress={() => {
              if (store.authentication.loggedIn) {
                navigation.push('account.tripPreferences');
              }
              else {
                showWarning();
              }
            }}
          >{translator.t('views.account.menu.preferences')}</Text>

          <Text
            style={styles.menuItem}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            onPress={() => {
              if (store.authentication.loggedIn) {
                navigation.push('account.accessibility');
              }
              else {
                showWarning();
              }
            }}
          >{translator.t('views.account.menu.accessibility')}</Text>

          <Text
            style={styles.menuItem}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            onPress={() => {
              if (store.authentication.loggedIn) {
                navigation.push('account.notifications');
              }
              else {
                showWarning();
              }
            }}
          >{translator.t('views.account.menu.notifications')}</Text>

          <Text
            style={styles.menuItem}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            onPress={() => {
              if (store.authentication.loggedIn) {
                navigation.push('account.password');
              }
              else {
                showWarning();
              }
            }}
          >{translator.t('views.account.menu.password')}</Text>


        </ScrollView>
      </View>
    </View >
  );
});

AccountMenu.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    pop: PropTypes.func,
  }).isRequired,
};

export default AccountMenu;
