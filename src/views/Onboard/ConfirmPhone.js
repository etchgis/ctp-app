/* eslint-disable react-hooks/exhaustive-deps */
import React, { createRef, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView, PixelRatio, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '../../components/Button';
import { Colors, Devices, Typography } from '../../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useStore } from '../../stores/RootStore';
import config from '../../config';
import { useFontScale } from '../../utils/fontScaling';
import { isTablet } from 'react-native-device-info';
import { deviceMultiplier } from '../../styles/devices';
import translator from '../../models/translator';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: 65,
    paddingHorizontal: isTablet() ? 100 : 25,
  },
  scroll: {
    flex: 1,
  },
  backButton: {
    color: Colors.primary1,
    marginBottom: 43,
  },
  backButtonIcon: {
    color: Colors.primary1,
  },
  intro: {
    marginVertical: '50%',
    ...Typography.h2,
    color: Colors.primary1,
    textAlign: 'center',
  },
  title: {
    ...Typography.h4,
    color: Colors.primary1,
    textAlign: 'center',
    marginBottom: 60,
  },
  error: {
    ...Typography.h5,
    color: Colors.danger,
    marginVertical: 3,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 60,
  },
  inputContainer: {
    borderColor: Colors.primary1,
    borderWidth: 1,
    width: 40 * deviceMultiplier,
    height: 55 * deviceMultiplier,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainerFocused: {
    borderWidth: 2,
  },
  inputText: {
    ...Typography.h2,
  },
  hiddenCodeInput: {
    position: 'absolute',
    height: 0,
    width: 0,
    opacity: 0,
  },
  resendContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  resendText: {
    ...Typography.h5,
    color: Colors.primary1,
    marginBottom: 10,
  },
  resendButton: {
    width: PixelRatio.getPixelSizeForLayoutSize(isTablet() ? 100 : 50),
    height: 30,
    marginBottom: 60,
  },
  resendButtonLabel: {
    ...Typography.h4,
  },
  screenReaderInput: {
    borderColor: Colors.primary1,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 55 * deviceMultiplier,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 24 * deviceMultiplier,
    letterSpacing: 10,
  }
});

const ConfirmPhone = observer(({
  navigation,
}) => {

  // based off of https://github.com/thoughtbot/react-native-code-input-example
  const CODE_LENGTH = 6;
  const codeDigitArray = new Array(CODE_LENGTH).fill(0);

  const store = useStore();
  const currentFontScale = useFontScale();

  const [code, setCode] = useState('');
  const [showIntro, setShowIntro] = useState(false);
  const [inputContainerFocused, setInputContainerFocused] = useState(false);
  const [error, setError] = useState(undefined);
  const [screenReaderOn, setScreenReaderOn] = useState(false);

  const hiddenInputRef = createRef();

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then((screenReaderEnabled) => {
        setScreenReaderOn(screenReaderEnabled);
      });
  },[]);

  const inputContainerPress = () => {
    setInputContainerFocused(true);
    hiddenInputRef?.current?.focus();
  };

  const hiddenInputChangeText = (text) => {
    setCode(text);
  };

  const hiddenInputSubmitEditing = () => {
    setInputContainerFocused(false);
  };

  const codeDigitArrayToInputs = (value, idx) => {
    const emptyInputChar = ' ';
    const digit = code[idx] || emptyInputChar;

    const isCurrentDigit = idx === code.length;
    const isLastDigit = idx === CODE_LENGTH - 1;
    const isCodeFull = code.length === CODE_LENGTH;

    const isFocused = isCurrentDigit || (isLastDigit && isCodeFull);

    const containerStyle =
      inputContainerFocused && isFocused
        ? { ...styles.inputContainer, ...styles.inputContainerFocused }
        : styles.inputContainer;

    return (
      <View
        key={idx}
        style={containerStyle}
      >
        <Text
          adjustsFontSizeToFit
          style={styles.inputText}
        >
          {digit}
        </Text>
      </View>
    );
  };

  const submit = () => {
    store.display.showSpinner();
    setTimeout(() => {
      store.registration.confirm(code, 'sms')
        .then((result) => {
          if (result?.status === 'approved') {
            store.authentication.updateUserPhone(store.registration.phone)
              .then(() => {
                let profile = { ...store.authentication.user?.profile };
                profile.address = store.registration.address;
                // profile.caretakers = store.registration.caretakers;
                profile.onboarded = true;
                profile.preferences = store.registration.preferences;
                console.log('profile', profile.preferences);
                store.authentication.updateUserProfile(profile)
                  .then(async () => {
                    if (store.registration.address) {
                      let favorite;
                      favorite = { ...store.registration.address };
                      favorite.alias = 'HOME';
                      await store.favorites.addLocation(favorite);
                    }
                    if (store.registration.caretakers && store.registration.caretakers.length > 0) {
                      const accessToken = await store.authentication.fetchAccessToken();
                      const firstName = store.registration.caretakers[0].firstName;
                      const lastName = store.registration.caretakers[0].lastName;
                      const email = store.registration.caretakers[0].email;
                      await store.traveler.inviteCaregiver(email, firstName, lastName, accessToken);
                    }
                    store.display.hideSpinner();
                    store.authentication.setLoggedIn(true);
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'home' }],
                    });
                  })
                  .catch((e) => {
                    store.display.hideSpinner();
                    setError(e);
                  });
              })
              .catch((e) => {
                store.display.hideSpinner();
                setError(e);
              });
          }
          else {
            store.display.hideSpinner();
          }
        })
        .catch((e) => {
          if (e === 'invalid') {
            setError(translator.t('views.onboard.confirmPhone.errors.code'));
          }
          else {
            setError(translator.t('views.onboard.confirmPhone.errors.unknown'));
          }
          store.display.hideSpinner();
        });
    }, 1000);
  };

  const verify = () => {
    store.display.showSpinner();
    setCode('');
    setTimeout(() => {
      store.registration.verify('sms')
        .then((result) => {
          store.display.hideSpinner();
        })
        .catch((e) => {
          setError(e);
          store.display.hideSpinner();
        });
    }, 2000);
  };

  useEffect(() => {
    setShowIntro(true);
    setTimeout(() => {
      setShowIntro(false);
      verify();
    }, 1000);
  }, []);

  return (

    <KeyboardAvoidingView
      style={styles.container}
      behavior={Devices.isIphone ? 'padding' : 'height'}
    >

      <ScrollView style={styles.scroll}>

        {showIntro &&
          <Text
            style={styles.intro}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.onboard.confirmPhone.intro')}</Text>
        }

        {!showIntro &&
          <>

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

            <Text
              style={styles.error}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{error}</Text>

            <Text
              style={styles.title}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('global.mfa.confirm.title')}</Text>

            {!screenReaderOn &&
              <>
                <Pressable
                  style={styles.inputsContainer}
                  onPress={inputContainerPress}
                  accessibilityLabel={translator.t('global.mfa.confirm.inputLabel')}
                  accessibilityLanguage={store.preferences.language || 'en'}
                >
                  {codeDigitArray.map(codeDigitArrayToInputs)}
                </Pressable>

                <TextInput
                  ref={hiddenInputRef}
                  style={styles.hiddenCodeInput}
                  value={code}
                  onChangeText={hiddenInputChangeText}
                  onSubmitEditing={hiddenInputSubmitEditing}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  accessible={false}
                />
              </>
            }
            {screenReaderOn &&
              <TextInput
                style={styles.screenReaderInput}
                value={code}
                onChangeText={hiddenInputChangeText}
                onSubmitEditing={hiddenInputSubmitEditing}
                keyboardType="number-pad"
                returnKeyType="done"
                textContentType="oneTimeCode"
                maxLength={6}
              />
            }

            <View style={styles.resendContainer}>
              <Text
                style={styles.resendText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('global.mfa.confirm.resendText')}</Text>

              <Button
                label={translator.t('global.mfa.confirm.resendLabel')}
                buttonStyle={styles.resendButton}
                labelStyle={styles.resendButtonLabel}
                onPress={verify}
              />
            </View>

            <Button
              label={translator.t('global.submitLabel')}
              onPress={submit}
              width={isTablet() ? '50%' : '100%'}
              buttonStyle={{
                alignSelf: 'center'
              }}
            />

          </>
        }

      </ScrollView>

    </KeyboardAvoidingView>
  );
});

ConfirmPhone.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default ConfirmPhone;
