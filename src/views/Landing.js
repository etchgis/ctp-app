/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import {
  Image, NativeModules, StyleSheet, View,
} from 'react-native';
import PropTypes from 'prop-types';
import Button from './../components/Button';
import { Colors, Devices } from '../styles';
import { useStore } from '../stores/RootStore';
import { geolocation } from '../models/geolocation';
import { isTablet } from 'react-native-device-info';
import translator from '../models/translator';
import { autorun } from 'mobx';
import jwtDecode from 'jwt-decode';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 25,
  },
  top: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 300,
    top: 100,
  },
});

const Landing = ({
  navigation,
}) => {

  const store = useStore();

  const [loading, setLoading] = useState(true);

  const autorunDisposerRef = useRef(null);

  useEffect(() => {
    geolocation.init();
    let language = Devices.isIphone ? NativeModules.SettingsManager.settings.AppleLocale : NativeModules.I18nManager.localeIdentifier;
    language = language.substring(0, 2);
    translator.configure(language === 'es' ? 'es' : 'en', false);
  }), [];

  useEffect(() => {
    autorunDisposerRef.current = autorun(() => {
      if (store.isLoaded) {
        proceed();
      }
    });
  }, []);

  const validateJWT = (token) => {
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp > Date.now() / 1000) {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const proceed = () => {
    if (autorunDisposerRef.current) {
      autorunDisposerRef.current();
      autorunDisposerRef.current = null;
    }
    store.authentication.fetchAccessToken()
      .then((aToken) => {
        let valid = validateJWT(store.authentication.user.refreshToken);
        translator.configure(store.preferences.language, false);
        if (store.profile.onboarded && valid) {
          store.authentication.setLoggedIn(true);
          navigation.navigate('home');
        }
        else {
          setLoading(false);
          // store.authentication.reset();
          // store.registration.reset();
        }
      })
      .catch((e) => {
        console.log(e, 'log back in');
        setLoading(false);
      });
  }

  return (
    <View style={styles.container}>

      <View style={styles.top}>
        <Image
          style={styles.logo}
          resizeMode="contain"
          source={require('../../assets/images/ITS4US_Buffalo_Logo.png')}
        />
      </View>

      <View style={styles.bottom}>
        {!loading &&
          <>
            <Button
              width={isTablet() ? '50%' : '100%'}
              label={translator.t('global.logInLabel')}
              onPress={() => {
                navigation.push('login');
              }}
            />
            <Button
              width={isTablet() ? '50%' : '100%'}
              buttonStyle={{
                backgroundColor: Colors.white,
                borderColor: Colors.primary1,
                borderWidth: 1,
              }}
              label={translator.t('global.signUpLabel')}
              labelStyle={{
                color: Colors.primary1,
              }}
              onPress={() => {
                navigation.push('register.account');
              }}
            />
            <Button
              width="100%"
              buttonStyle={{
                backgroundColor: Colors.white,
                borderColor: Colors.white,
                borderWidth: 1,
              }}
              label={translator.t('views.landing.guestLabel')}
              labelStyle={{
                color: Colors.primary1,
              }}
              onPress={() => {
                store.mapManager.setCurrentMap('home');
                store.mapManager.setCurrentIndoorMap('results');
                navigation.push('home');
              }}
            />
          </>
        }
      </View>

    </View>
  );
};

Landing.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default Landing;
