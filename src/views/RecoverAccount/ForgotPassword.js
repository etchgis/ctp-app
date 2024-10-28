/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors, Devices, Typography } from '../../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Modal from '../../components/Modal';
import { useStore } from '../../stores/RootStore';
import CheckBox from '@react-native-community/checkbox';
import { validators } from '../../utils';
import config from '../../config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isTablet } from 'react-native-device-info';
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
    paddingHorizontal: 25,
  },
  scroll: {
    flex: 1,
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
  top: {
    flex: 1
  },
  bottom: {
    flex: 2,
    paddingHorizontal: isTablet() ? 75 : 0
  },
  footer: {
    height: 210,
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
  },
  checkBoxText: {
    ...Typography.h6,
    fontWeight: 'bold',
  },
});

const ForgotPassword = observer(({
  navigation,
}) => {

  const store = useStore();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [mfaChoice, setMfaChoice] = useState(null);
  const [showMfaChoice, setShowMfaChoice] = useState(false);
  const [submitButtonDisabled, setSubmitButtonDisabled] = useState(false);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(true);

  const emailTextChange = (value) => {
    setEmail(value);
    setSubmitButtonDisabled(!validators.isEmail(value));
  };

  const handleCancelForgotPassword = () => {
    store.authentication.updateEmail(null);
    store.authentication.updateMfa(null);
    navigation.pop();
  };

  const handleSubmit = () => {
    setShowMfaChoice(true);
  };

  const handleNext = () => {
    store.display.showSpinner();
    store.authentication.updateEmail(email);
    store.authentication.updateMfa(mfaChoice);
    setShowMfaChoice(false);
    setMfaChoice(null);
    setNextButtonDisabled(true);
    store.authentication.recover()
      .then(() => {
        store.display.hideSpinner();
        navigation.push('changePassword');
      })
      .catch(e => {
        store.display.hideSpinner();
        console.log(e);
      });
  };

  const handleCancelMfaChoice = () => {
    setShowMfaChoice(false);
    setMfaChoice(null);
    setNextButtonDisabled(true);
  };

  const updateMfaChoice = (value) => {
    setMfaChoice(value);
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

  const containerStyle = () => {
    return {
      ...styles.container,
      paddingTop: insets.top,
      paddingBottom: insets.bottom
    }
  }

  const contentStyle = () => {
    return {
      height: Devices.screen.height - (insets.top + insets.bottom)
    }
  }

  return (

    <>

      <View
        style={containerStyle()}
      >

        <ScrollView
          style={styles.scroll}
        >

          <View
            style={contentStyle()}
          >

            <View
              style={styles.top}
            >

              <Pressable
                style={styles.backButton}
                accessibilityLabel={translator.t('global.backLabelDefault')}
                onPress={() => {
                  navigation.pop();
                }}>
                <FontAwesomeIcon
                  icon="chevron-left"
                  size={36}
                  style={styles.backButtonIcon} />
              </Pressable>

              <Text
                style={styles.title}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.recoverAccount.forgotPassword.title')}</Text>

            </View>

            <View
              style={styles.bottom}
            >

              <Input
                placeholder={translator.t('global.emailPlaceholder')}
                label={translator.t('global.emailLabel')}
                keyboardType="email-address"
                value={email}
                onChangeText={emailTextChange}
                inputStyle={{
                  marginBottom: 100,
                }}
              />

            </View>

            <View
              style={styles.footer}
            >

              <Button
                label={translator.t('global.submitLabel')}
                onPress={handleSubmit}
                disabled={submitButtonDisabled}
                width={isTablet() ? '50%' : '100%'}
                buttonStyle={{
                  alignSelf: 'center'
                }}
              />

              <Button
                label={translator.t('global.cancelLabel')}
                width={isTablet() ? '50%' : '100%'}
                buttonStyle={{
                  backgroundColor: Colors.white,
                  borderColor: Colors.white,
                  alignSelf: 'center'
                }}
                labelStyle={{
                  color: Colors.primary1,
                }}
                onPress={handleCancelForgotPassword}
              />

            </View>

          </View>

        </ScrollView>

      </View>

      <Modal
        show={showMfaChoice}
        height={isTablet() ? 510 : 450}
      >
        <View>
          <Text
            style={styles.modalTitle}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.recoverAccount.forgotPassword.modalTitle')}</Text>
          <Text
            style={styles.modalSubTitle}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.recoverAccount.forgotPassword.modalSubTitle')}</Text>
          <Text
            style={styles.modalConfirm}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.recoverAccount.forgotPassword.modalConfirm')}</Text>

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
              onPress={handleCancelMfaChoice}
            />
          </View>
        </View>
      </Modal>

    </>
  );
});

ForgotPassword.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default ForgotPassword;
