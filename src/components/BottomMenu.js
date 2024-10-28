import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Button from './Button';
import { Colors, Devices, Typography } from '../styles';
import { useRoute } from '@react-navigation/native';
import { useStore } from '../stores/RootStore';
import { isTablet } from 'react-native-device-info';
import translator from '../models/translator';

const ADDITIONAL_ANDROID_PADDING = Devices.isAndroid ? 10 : 0;

const styles = StyleSheet.create({
  container: {
    height: (isTablet() ? 90 : 45) + ADDITIONAL_ANDROID_PADDING,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -15,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 100,
    paddingTop: 5,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 13,
    height: isTablet() ? 60 : 30,
    width: isTablet() ? 60 : 30,
  },
});

const BottomMenu = ({
  navigation,
  loggedIn,
}) => {

  const store = useStore();
  const route = useRoute();

  return (
    <View style={styles.container}>
      {loggedIn &&
        <>
          <Pressable
            style={styles.button}
            onPress={() => {
              if (route.name !== 'schedule') {
                store.mapManager.setCurrentMap('schedule');
                store.mapManager.setCurrentIndoorMap('results');
                navigation.push('schedule');
              }
            }}
            accessibilityLabel={translator.t('components.bottomMenu.schedule')}
            accessibilityLanguage={store.preferences.language || 'en'}
          >
            <FontAwesomeIcon
              icon="calendar-day"
              size={isTablet() ? 42 : 26}
              color={route.name === 'schedule' ? Colors.medium : Colors.primary1}
            />
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => {
              if (route.name !== 'home') {
                store.mapManager.setCurrentMap('home');
                store.mapManager.setCurrentIndoorMap('results');
                navigation.push('home');
              }
            }}
            accessibilityLabel={translator.t('components.bottomMenu.home')}
            accessibilityLanguage={store.preferences.language || 'en'}
          >
            <FontAwesomeIcon
              icon="map"
              size={isTablet() ? 42 : 26}
              color={route.name === 'home' ? Colors.primary2 : Colors.primary1}
            />
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => {
              if (route.name !== 'account.menu') {
                navigation.push('account.menu');
              }
              // store.display.showSideMenu();
            }}
            accessibilityLabel={translator.t('components.bottomMenu.profile')}
            accessibilityLanguage={store.preferences.language || 'en'}
          >
            <FontAwesomeIcon
              icon="user"
              size={isTablet() ? 42 : 26}
              color={route.name === 'account.menu' ? Colors.primary2 : Colors.primary1}
            />
          </Pressable>
        </>
      }
      {!loggedIn &&
        <>
          <Button
            label={translator.t('global.signUpLabel')}
            buttonStyle={{
              width: 100,
              height: 30,
              marginBottom: 0,
            }}
            labelStyle={{
              ...Typography.h4,
            }}
            onPress={() => {
              navigation.push('register.account');
            }}
          />
          <Pressable
            style={styles.button}
            onPress={() => {
              navigation.push('landing');
            }}
          >
            <FontAwesomeIcon
              icon="right-from-bracket"
              size={26}
              color={Colors.primary1}
            />
          </Pressable>
        </>
      }
    </View>
  );
};

BottomMenu.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
  loggedIn: PropTypes.bool,
};

BottomMenu.defaultProps = {
  loggedIn: false,
};

export default BottomMenu;
