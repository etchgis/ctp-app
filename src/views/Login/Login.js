/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView, PixelRatio, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors, Devices, Typography } from '../../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useStore } from '../../stores/RootStore';
import Modal from '../../components/Modal';
import CheckBox from '@react-native-community/checkbox';
import { isTablet } from 'react-native-device-info';
import config from '../../config';
import { deviceMultiplier } from '../../styles/devices';
import translator from '../../models/translator';

const MFA_CHOICES = [{
  'label': 'global.mfa.verify.sms',
  'value': 'sms',
}, {
  'label': 'global.mfa.verify.call',
  'value': 'call',
}, {
  'label': 'global.mfa.verify.email',
  'value': 'email',
}];

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
  },
  forgotPassword: {
    color: Colors.primary1,
    alignSelf: 'flex-end',
    textDecorationLine: 'underline',
    marginBottom: 35,
    ...Typography.h6,
  },
  error: {
    ...Typography.h4,
    ...Typography.book,
    color: Colors.danger,
    marginBottom: 37,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.primary1,
    marginBottom: 20,
  },
  modalSubTitle: {
    ...Typography.h4,
    marginBottom: 20,
  },
  modalConfirm: {
    ...Typography.h4,
    fontWeight: 'bold',
    marginBottom: 20,
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
    marginBottom: Devices.isAndroid ? 10 : 0,
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
    // color: Colors.dark,
    fontWeight: 'bold',
    ...Typography.h6,
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

const Login = observer(({
  navigation,
}) => {
  const store = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showMfaChoice, setShowMfaChoice] = useState(false);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(true);
  const [mfaChoice, setMfaChoice] = useState(null);

  useEffect(() => {
    if (navigation) {
      // clear any error messages
      const unsubscribe = navigation.addListener('focus', () => {
        store.authentication.clearError();
      });
      return unsubscribe;
    }
  }, [navigation]);

  const authenticate = () => {
    Keyboard.dismiss();
    if (email.length === 0 || password.length === 0) {
      setError(translator.t('views.login.login.error'));
    }
    else {
      store.display.showSpinner();
      store.authentication.login(email, password, 'app', false)
        .then((onboarded) => {
          setError(undefined);
          store.display.hideSpinner();
          if (onboarded) {
            setShowMfaChoice(true);
          }
          else {
            navigation.navigate('onboard.contact');
          }
        }).catch((e) => {
          console.log(e);
          store.display.hideSpinner();
          setError(store.authentication.error);
        });
    }
  };

  const handleNext = () => {
    navigation.navigate('login.confirm');
  };

  const handleCancel = () => {
    setShowMfaChoice(false);
    setNextButtonDisabled(true);
    store.authentication.reset();
  };

  const updateMfaChoice = (value) => {
    setMfaChoice(value);
    store.authentication.updateMfa(value);
    setNextButtonDisabled(!value);
  };

  const mfaToCheckboxes = () => {
    return MFA_CHOICES.map((m, i) => {
      return (
        <View
          key={i}
          style={styles.checkBoxContainer}
        >
          <CheckBox
            value={mfaChoice === m.value}
            onValueChange={(checked) => {
              updateMfaChoice(checked ? m.value : null);
            }}
            boxType="square"
            style={styles.checkBox}
            accessibilityLabel={translator.t(m.label)}
          />
          <Text
            style={styles.checkBoxText}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            accessible={false}
          >{translator.t(m.label)}</Text>
        </View>
      );
    });
  };

  return (
    <>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Devices.isIphone ? 'padding' : 'height'}
      >

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 100 }}
        >

          <Pressable
            style={styles.backButton}
            accessibilityLabel={translator.t('global.backLabelDefault')}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'landing' }],
              });
            }}>
            <FontAwesomeIcon
              icon="chevron-left"
              size={36 * deviceMultiplier}
              style={styles.backButtonIcon}
            />
          </Pressable>

          <Text
            style={{ ...styles.title }}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.login.login.title')}</Text>

          <Text
            testID="login-error-message"
            style={styles.error}
          >{error}</Text>

          <Input
            placeholder={translator.t('global.emailPlaceholder')}
            label={translator.t('global.emailLabel')}
            keyboardType="email-address"
            autoComplete="username"
            returnKeyType="done"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
            }}
          />

          <Input
            placeholder={translator.t('global.passwordPlaceholder')}
            label={translator.t('global.passwordLabel')}
            inputSyle={{
              marginBottom: 10,
            }}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
            }}
          />

          <Text
            onPress={() => {
              navigation.push('forgotPassword');
            }}
            style={styles.forgotPassword}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.login.login.forgotPassword')}</Text>

          <Button
            label={translator.t('global.logInLabel')}
            width={isTablet() ? '50%' : '100%'}
            buttonStyle={{
              marginBottom: 40,
              marginTop: 35,
              alignSelf: 'center',
            }}
            onPress={authenticate}
          />

          <Text
            style={styles.accountLabel}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >
            <Text>{translator.t('views.login.login.noAccount')}{' '}</Text>
            <Text
              onPress={() => {
                navigation.replace('register.account');
              }}
              style={styles.signUpLabel}
            >{translator.t('global.signUpLabel')}</Text>
          </Text>

        </ScrollView>

      </KeyboardAvoidingView>

      <Modal
        show={showMfaChoice}
        height={isTablet() ? 450 : 370}
      >
        <View>
          <Text
            style={styles.modalTitle}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('global.mfa.verify.title')}</Text>
          <Text
            style={styles.modalConfirm}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('global.mfa.verify.subTitle')}</Text>

          <View
            style={{
              marginLeft: 20,
              marginBottom: 20,
            }}
          >
            {mfaToCheckboxes()}
          </View>

          <View style={{
            alignItems: 'center',
          }}>

            <Button
              label={translator.t('global.nextLabel')}
              width={250}
              disabled={nextButtonDisabled}
              onPress={handleNext}
            />
            <Button
              label={translator.t('global.cancelLabel')}
              width={250}
              buttonStyle={{
                backgroundColor: Colors.white,
                borderColor: Colors.white,
              }}
              labelStyle={{
                color: Colors.primary1,
              }}
              onPress={handleCancel}
            />
          </View>
        </View>
      </Modal>

    </>
  );
});

Login.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    addListener: PropTypes.func,
  }),
};

export default Login;
