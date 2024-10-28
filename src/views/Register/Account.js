/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors, Devices, Typography } from '../../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useStore } from '../../stores/RootStore';
import { validators } from '../../utils';
import { useIsFirstRender } from '../../utils/isFirstRender';
import CheckBox from '@react-native-community/checkbox';
import Modal from '../../components/Modal';
import config from '../../config';
import { useFontScale } from '../../utils/fontScaling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deviceMultiplier } from '../../styles/devices';
import { isTablet } from 'react-native-device-info';
import translator from '../../models/translator';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 65,
  },
  backButton: {
    color: Colors.primary1,
    marginBottom: 43,
  },
  backButtonIcon: {
    color: Colors.primary1,
  },
  title: {
    ...Typography.h1,
    color: Colors.primary1,
    marginBottom: 32,
  },
  fieldContainer: {
    position: 'relative',
  },
  error: {
    ...Typography.h6,
    position: 'absolute',
    // top: -7,
    left: 14,
    color: Colors.danger,
    fontWeight: 'bold',
    backgroundColor: Colors.white,
    zIndex: 10,
    paddingHorizontal: 4,
  },
  passwordRequirementContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  passwordRequirement: {
    display: 'flex',
    alignItems: 'center',
  },
  passwordRequirementTop: {
    ...Typography.h3,
    color: Colors.danger,
    fontWeight: 'bold',
  },
  passwordRequirementBottom: {
    ...Typography.h6,
    color: Colors.danger,
    fontWeight: 'bold',
    maxWidth: 80 * deviceMultiplier,
  },
  passwordRequirementFulfilled: {
    color: Colors.medium,
  },
  checkBoxContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    marginTop: 20,
    paddingVertical: 5,
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
    color: Colors.black,
    ...Typography.h6,
  },
  termsContainer: {
    marginBottom: 15,
    height: 2000,
  },
  termsTitle: {
    ...Typography.h4,
    color: Colors.primary1,
    marginTop: 20,
    marginBottom: 10,
  },
  termsTitleSmall: {
    ...Typography.h6,
    color: Colors.primary1,
    marginTop: 10,
    marginBottom: 10,
  },
  termsText: {
    ...Typography.h6
  },
  termsTextListItemn: {
    ...Typography.h6,
    marginLeft: 10
  },
  termsTitle: {
    ...Typography.h4,
    color: Colors.primary1,
    marginBottom: 10,
    marginTop: 20,
  },
  close: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 100,
  },
  accountLabel: {
    color: Colors.medium,
    ...Typography.h5,
    alignSelf: 'center',
  },
  signUpLabel: {
    color: Colors.primary1,
  },
});

const Account = observer(({
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
  const [password, setPassword] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState([false, false, false, false]);
  const [terms, setTerms] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // clear any error messages
    const unsubscribe = navigation.addListener('focus', () => {
      store.authentication.clearError();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!isFirstRender) {
      setFirstNameError(firstName.length === 0 ? translator.t('global.requiredError') : undefined);
    }
  }, [firstName]);

  useEffect(() => {
    if (!isFirstRender) {
      setLastNameError(lastName.length === 0 ? translator.t('global.requiredError') : undefined);
    }
  }, [lastName]);

  useEffect(() => {
    if (!isFirstRender) {
      setEmailError(!validators.isEmail(email) ? translator.t('views.register.account.emailError') : undefined);
    }
  }, [email]);

  useEffect(() => {
    let pr = [true, true, true, true];
    if (!validators.hasLengthGreaterThan(password, 7)) {
      pr[0] = false;
    }
    if (!validators.hasUpperCase(password)) {
      pr[1] = false;
    }
    if (!validators.hasLowerCase(password)) {
      pr[2] = false;
    }
    if (!validators.hasNumber(password)) {
      pr[3] = false;
    }
    setPasswordRequirements(pr);
  }, [password]);

  useEffect(() => {
    const valid = firstName.length > 0 &&
      lastName.length > 0 &&
      validators.isEmail(email) &&
      passwordRequirements.indexOf(false) === -1 &&
      terms;
    setIsValid(valid);
  }, [firstNameError, lastNameError, emailError, passwordRequirements, terms]);

  const handleNext = () => {
    if (isValid) {
      store.registration.updateProperty('firstName', firstName);
      store.registration.updateProperty('lastName', lastName);
      store.registration.updateProperty('email', email);
      store.registration.updateProperty('password', password);
      store.registration.updateProperty('terms', terms);
      store.registration.updateProperty('consent', consent);
      store.registration.updateProperty('phone', '+15555555555');
      store.registration.updateProperty('organization', config.ORGANIZATION);
      store.display.showSpinner();
      store.registration.register()
        .then(() => {
          store.display.hideSpinner();
          navigation.push('register.confirm');
        })
        .catch((e) => {
          store.display.hideSpinner();
          if (e === 'Conflict') {
            Alert.alert(
              'Warning',
              'A user with that email already exists.  Please try with a different email.',
              [
                {
                  text: 'OK',
                  style: 'cancel',
                },
              ],
            );
          }
          else {
            Alert.alert(
              'Warning',
              'Unknown error, please try again.',
              [
                {
                  text: 'OK',
                  style: 'cancel',
                },
              ],
            );
          }
        });
    }
  };

  const errorStyle = () => {
    return {
      ...styles.error,
      top: -7 * Math.min(config.MAX_FONT_SCALE, currentFontScale),
    };
  };

  return (

    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Devices.isIphone ? 'padding' : 'height'}
        pointerEvents="box-none"
      >

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 100 }}
        >

          <Pressable
            style={styles.backButton}
            accessibilityLabel={translator.t('global.backLabelDefault')}
            onPress={() => {
              navigation.pop();
            }}>
            <FontAwesomeIcon
              icon="chevron-left"
              size={36 * deviceMultiplier}
              style={styles.backButtonIcon} />
          </Pressable>

          <Text
            style={{ ...styles.title }}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.register.account.title')}</Text>

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

          <Input
            placeholder={translator.t('global.passwordPlaceholder')}
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
            }}
            returnKeyType="done"
            inputStyle={{
              marginBottom: 8,
            }}
          />
          <View style={styles.passwordRequirementContainer}>
            <View style={styles.passwordRequirement}>
              <Text
                style={{
                  ...styles.passwordRequirementTop,
                  ...(passwordRequirements[0] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >8 +</Text>
              <Text
                style={{
                  ...styles.passwordRequirementBottom,
                  ...(passwordRequirements[0] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                numberOfLines={1}
              >{translator.t('global.passwordRequirements.characters')}</Text>
            </View>
            <View style={styles.passwordRequirement}>
              <Text
                style={{
                  ...styles.passwordRequirementTop,
                  ...(passwordRequirements[1] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >A-Z</Text>
              <Text
                style={{
                  ...styles.passwordRequirementBottom,
                  ...(passwordRequirements[1] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                numberOfLines={1}
              >{translator.t('global.passwordRequirements.uppercase')}</Text>
            </View>
            <View style={styles.passwordRequirement}>
              <Text
                style={{
                  ...styles.passwordRequirementTop,
                  ...(passwordRequirements[2] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >a-z</Text>
              <Text
                style={{
                  ...styles.passwordRequirementBottom,
                  ...(passwordRequirements[2] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                numberOfLines={1}
              >{translator.t('global.passwordRequirements.lowercase')}</Text>
            </View>
            <View style={styles.passwordRequirement}>
              <Text
                style={{
                  ...styles.passwordRequirementTop,
                  ...(passwordRequirements[3] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >0-9</Text>
              <Text
                style={{
                  ...styles.passwordRequirementBottom,
                  ...(passwordRequirements[3] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                numberOfLines={1}
              >{translator.t('global.passwordRequirements.number')}</Text>
            </View>
          </View>

          <TouchableOpacity
            testID="terms-and-conditions"
            style={styles.checkBoxContainer}
            onPress={() => {
              setShowTerms(true);
            }}
          >
            <CheckBox
              value={terms}
              boxType="square"
              style={styles.checkBox}
              disabled={terms ? false : true}
            />
            <Text
              style={styles.checkBoxText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.register.account.checkBoxText1')}
              <Text
                style={{ color: Colors.primary1 }}
              >{translator.t('views.register.account.checkBoxText2')}</Text>
            </Text>
          </TouchableOpacity>

          <Button
            width={isTablet() ? '50%' : '100%'}
            label={translator.t('views.register.account.buttonLabel')}
            buttonStyle={{
              marginBottom: 20,
              alignSelf: 'center',
            }}
            onPress={!isValid ? () => { } : handleNext}
            disabled={!isValid}
          />

          <Text
            style={styles.accountLabel}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >
            <Text>{translator.t('views.register.account.accountLabel')}</Text>
            <Text
              onPress={() => {
                navigation.replace('login');
              }}
              style={styles.signUpLabel}
            >{translator.t('global.logInLabel')}</Text>
          </Text>

        </ScrollView>

      </KeyboardAvoidingView>

      <Modal
        show={showTerms}
      >
        <Pressable
          testID="terms-and-conditions-close"
          style={styles.close}
          onPress={() => {
            setShowTerms(false);
          }}
        >
          <FontAwesomeIcon
            icon="xmark"
            size={24}
            color={Colors.primary1}
          />
        </Pressable>
        <Text
          style={styles.termsTitle}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{translator.t('views.account.termsAndConditions.header')}</Text>
        <View>
          <ScrollView
            keyboardShouldPersistTaps="always"
          >
            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.headerText')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.availability')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.availabilityText')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.liability')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.liabilityText')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.privacy')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.privacyText')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.changesToApp')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.changesToAppText')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.ownership')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.ownershipText')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.liabilityLimitation')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.liabilityLimitationText')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.disclaimer')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.disclaimerText')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.indemnification')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.indemnificationText')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.miscellaneous')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.miscellaneousText')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.changesToTerms')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.termsAndConditions.changesToTermsText')}</Text>
              <View
                style={{
                  height: 2,
                  borderTopWidth: 1,
                  borderTopColor: Colors.primary1,
                  marginVertical: 15
                }} />
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.title')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.header')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.headerText')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.info1')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.info1Text')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q1')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a1')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q2')}</Text>
              <Text
                style={styles.termsTextListItemn}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >
                {translator.t('views.account.consent.a2a')}</Text>
              <Text
                style={styles.termsTextListItemn}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a2b')}</Text>
              <Text
                style={styles.termsTextListItemn}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a2c')}</Text>
              <Text
                style={styles.termsTextListItemn}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a2d')}</Text>
              <Text
                style={styles.termsTextListItemn}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a2e')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q3')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a3')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q4')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a4')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q5')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a5')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q6')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a6')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q7')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a7')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.info2')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.info2Text')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q8')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >
                {translator.t('views.account.consent.a8a')}</Text>
              <Text
                style={{ ...styles.termsTextListItemn, marginTop: 10 }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a8b')}</Text>
              <Text
                style={styles.termsTextListItemn}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a8c')}</Text>
              <Text
                style={styles.termsTextListItemn}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a8d')}</Text>
              <Text
                style={styles.termsTextListItemn}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a8e')}</Text>
              <Text
                style={styles.termsTextListItemn}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a8f')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q9')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a9')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q10')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a10')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q11')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a11')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q12')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a12')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q13')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a13')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q14')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.a14')}</Text>
              <Text
                style={styles.termsTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q15')}</Text>
              <Text
                style={styles.termsTitleSmall}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q15q1')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q15a1')}</Text>
              <Text
                style={styles.termsTitleSmall}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q15q2')}</Text>
              <Text
                style={styles.termsText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.consent.q15a2')}</Text>
              <View
                style={{
                  height: 2,
                  borderTopWidth: 1,
                  borderTopColor: Colors.primary1,
                  marginVertical: 15
                }} />
              <View style={styles.checkBoxContainer}>
                <CheckBox
                  value={terms}
                  boxType="square"
                  style={styles.checkBox}
                  onValueChange={(value) => {
                    setTerms(value);
                  }}
                />
                <Text
                  style={styles.checkBoxText}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >
                  {translator.t('views.register.account.checkBoxText1')}
                  {translator.t('views.register.account.checkBoxText2')}
                </Text>
              </View>
              <View style={{
                ...styles.checkBoxContainer,
                paddingHorizontal: 20,
                alignItems:'flex-start'
              }}
              >
                <CheckBox
                  value={consent}
                  boxType="square"
                  style={{
                    ...styles.checkBox,
                  }}
                  onValueChange={(value) => {
                    setConsent(value);
                  }}
                />
                <Text
                  style={styles.checkBoxText}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >
                  {translator.t('views.account.consent.confirm')}
                </Text>
              </View>
              <Button
                width={isTablet() ? '50%' : '100%'}
                label={translator.t('global.closeLabel')}
                buttonStyle={{
                  marginBottom: 20,
                  alignSelf: 'center',
                }}
                onPress={() => {
                  setShowTerms(false);
                }}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

    </>
  );
});

Account.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }),
};

export default Account;
