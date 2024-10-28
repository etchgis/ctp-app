/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors, Devices, Typography } from '../../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useStore } from '../../stores/RootStore';
import { validators } from '../../utils';
import { useIsFirstRender } from '../../utils/isFirstRender';
import config from '../../config';
import { useFontScale } from '../../utils/fontScaling';
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
    // height: 180,
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
  },
  subTitle: {
    ...Typography.h5,
    color: Colors.dark,
    marginBottom: 20,
  },
  fieldContainer: {
    position: 'relative',
  },
  error: {
    ...Typography.h6,
    position: 'absolute',
    top: -7,
    left: 14,
    color: Colors.danger,
    fontWeight: 'bold',
    backgroundColor: Colors.white,
    zIndex: 10,
    paddingHorizontal: 4,
  },
  topError: {
    ...Typography.h5,
    color: Colors.danger,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
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
});

const Caregiver = observer(({
  navigation,
}) => {

  const store = useStore();
  const isFirstRender = useIsFirstRender();
  const currentFontScale = useFontScale();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [firstNameError, setFirstNameError] = useState(undefined);
  const [lastName, setLastName] = useState('');
  const [lastNameError, setLastNameError] = useState(undefined);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(undefined);
  // const [error, setError] = useState(undefined);

  useEffect(() => {
    if (!isFirstRender /*&& error*/) {
      setFirstNameError(firstName.length === 0 ? translator.t('views.onboard.caregiver.firstNameError') : undefined);
    }
  }, [firstName]);

  useEffect(() => {
    if (!isFirstRender /*&& error*/) {
      setLastNameError(lastName.length === 0 ? translator.t('views.onboard.caregiver.lastNameError') : undefined);
    }
  }, [lastName]);

  useEffect(() => {
    if (!isFirstRender /*&& error*/) {
      setEmailError(!validators.isEmail(email) ? translator.t('views.onboard.caregiver.emailError') : undefined);
    }
  }, [email]);

  const validate = () => {
    let isValid = true;

    setFirstNameError(undefined);
    setLastNameError(undefined);
    setEmailError(undefined);
    // setError(undefined);

    if (firstName.length === 0) {
      isValid = false;
      setFirstNameError(translator.t('views.onboard.caregiver.firstNameError'));
    }

    if (lastName.length === 0) {
      isValid = false;
      setLastNameError(translator.t('views.onboard.caregiver.lastNameError'));
    }

    if (!validators.isEmail(email)) {
      isValid = false;
      setEmailError(translator.t('views.onboard.caregiver.emailError'));
    }

    // if (!isValid) {
    //   setError('Please fix the information below or press Skip if you wish to add this later.');
    // }

    return isValid;
  };

  const handleNext = () => {
    if (validate()) {
      var caretaker = {
        firstName,
        lastName,
        email,
      };
      store.registration.updateProperty('caretakers', [caretaker]);
      navigation.push('onboard.enhancedMobilityOptions');
    }
  };

  const errorStyle = () => {
    return {
      ...styles.error,
      top: -7 * Math.min(config.MAX_FONT_SCALE, currentFontScale),
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
              accessibilityLanguage={store.preferences.language || 'en'}
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
            >{translator.t('views.onboard.caregiver.title')}</Text>

            <Text
              style={styles.subTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.onboard.caregiver.subTitle')}</Text>

            {/* <Text
              style={styles.topError}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{error}</Text> */}

            <View style={styles.fieldContainer}>
              {firstNameError &&
                <Text
                  testID="first-name-error-message"
                  style={errorStyle()}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{firstNameError}</Text>
              }
              <Input
                placeholder={translator.t('global.firstNamePlaceholder')}
                keyboardType="default"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                }}
                returnKeyType="done"
              />
            </View>

            <View style={styles.fieldContainer}>
              {lastNameError &&
                <Text
                  testID="last-name-error-message"
                  style={errorStyle()}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{lastNameError}</Text>
              }
              <Input
                placeholder={translator.t('global.lastNamePlaceholder')}
                keyboardType="default"
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                }}
                returnKeyType="done"
              />
            </View>

            <View style={styles.fieldContainer}>
              {emailError &&
                <Text
                  testID="email-error-message"
                  style={errorStyle()}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{emailError}</Text>
              }
              <Input
                placeholder={translator.t('global.emailPlaceholder')}
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                }}
                returnKeyType="done"
              />
            </View>

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
                navigation.push('onboard.enhancedMobilityOptions');
              }}
            />

            <View style={styles.progressContainer}>
              <View style={styles.progressInactive} />
              <View style={styles.progressInactive} />
              <View style={styles.progressInactive} />
              <View style={styles.progressActive} />
              <View style={styles.progressInactive} />
            </View>

          </View>

        </View>

      </ScrollView>

    </View>
  );
});

Caregiver.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default Caregiver;
