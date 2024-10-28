/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Colors, Devices, Typography } from '../../styles';
import Header from '../../components/Header';
import { useStore } from '../../stores/RootStore';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useIsFirstRender } from '../../utils/isFirstRender';
import { validators } from '../../utils';
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
  },
  content: {
    flex: 1,
  },
  line: {
    borderTopColor: Colors.light,
    borderTopWidth: 1,
    marginTop: 23,
    marginBottom: 33,
  },
  passwordRequirementContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 90,
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
  fieldContainer: {
    position: 'relative',
  },
  inputIconSuccess: {
    position: 'absolute',
    right: 12,
    color: Colors.success,
  },
  inputIconInvalid: {
    position: 'absolute',
    right: 12,
    color: Colors.danger,
  },
  error: {
    ...Typography.h5,
    color: Colors.danger,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

const Password = observer(({
  navigation,
}) => {
  const store = useStore();
  const isFirstRender = useIsFirstRender();
  const currentFontScale = useFontScale();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState(undefined);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordValid, setNewPasswordValid] = useState(false);
  const [reenterNewPassword, setReenterNewPassword] = useState('');
  const [reenterNewPasswordValid, setReenterNewPasswordValid] = useState(false);

  useEffect(() => {
    if (!isFirstRender) {
      let valid = true;
      if (!validators.hasLengthGreaterThan(newPassword, 7) ||
        !validators.hasUpperCase(newPassword) ||
        !validators.hasLowerCase(newPassword) ||
        !validators.hasNumber(newPassword)) {
        valid = false;
      }
      setNewPasswordValid(valid);
    }
  }, [newPassword]);

  useEffect(() => {
    if (!isFirstRender) {
      let valid = true;
      if (!validators.hasLengthGreaterThan(reenterNewPassword, 7) ||
        !validators.hasUpperCase(reenterNewPassword) ||
        !validators.hasLowerCase(reenterNewPassword) ||
        !validators.hasNumber(reenterNewPassword) ||
        newPassword !== reenterNewPassword) {
        valid = false;
      }
      setReenterNewPasswordValid(valid);
    }
  }, [reenterNewPassword]);

  const confirmPress = () => {
    if (newPasswordValid && reenterNewPasswordValid) {
      store.display.showSpinner();
      setTimeout(() => {
        store.authentication.updateUserPassword(currentPassword, newPassword)
          .then(() => {
            setCurrentPassword('');
            setCurrentPasswordError(undefined);
            store.display.hideSpinner();
            navigation.pop();
          })
          .catch((e) => {
            setCurrentPassword('');
            const error = store.authentication.error === 'Unauthorized' ?
              'Current password is incorrect' :
              store.authentication.error;
            setCurrentPasswordError(error);
            store.display.hideSpinner();
          });
      }, 1000);
    }
  };

  const inputIconSuccessStyle = () => {
    return {
      ...styles.inputIconSuccess,
      bottom: (isTablet() ? 53 : 47) - (10 * Math.min(config.MAX_FONT_SCALE, currentFontScale)),
    };
  };

  const inputIconInvalidStyle = () => {
    return {
      ...styles.inputIconInvalid,
      bottom: (isTablet() ? 53 : 47) - (10 * Math.min(config.MAX_FONT_SCALE, currentFontScale)),
    };
  };

  return (
    <>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Devices.isIphone ? 'padding' : 'height'}
      >

        <ScrollView
          style={{
            marginTop: insets.top,
            marginBottom: insets.bottom,
          }}
          contentContainerStyle={{
            paddingBottom: 100,
          }}
        >

          <Header
            title={translator.t('views.account.password.header')}
            onBackPress={() => {
              navigation.pop();
            }}
            backLabel={translator.t('global.backLabel', { to: translator.t('views.account.menu.header') })}
          />

          <Input
            placeholder={translator.t('views.account.password.currentPasswordPlaceholder')}
            label={translator.t('views.account.password.currentPasswordLabel')}
            secureTextEntry
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
            }}
            returnKeyType="done"
          />

          <Text
            style={styles.error}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{currentPasswordError}</Text>

          <View style={styles.line} />

          <View style={styles.fieldContainer}>
            {newPasswordValid && newPassword.length > 0 &&
              <FontAwesomeIcon
                style={inputIconSuccessStyle()}
                icon="circle-check"
                size={18 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
              />
            }
            {!newPasswordValid && newPassword.length > 0 &&
              <FontAwesomeIcon
                style={inputIconInvalidStyle()}
                icon="circle-xmark"
                size={18 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
              />
            }
            <Input
              placeholder={translator.t('global.passwordPlaceholder')}
              label={translator.t('global.passwordLabel')}
              secureTextEntry
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
              }}
              returnKeyType="done"
              inputStyle={{
                marginBottom: 26,
              }}
              textStyle={{
                paddingRight: 160,
              }}
            />
          </View>

          <View style={styles.fieldContainer}>
            {reenterNewPasswordValid && newPassword.length > 0 &&
              <FontAwesomeIcon
                style={inputIconSuccessStyle()}
                icon="circle-check"
                size={18 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
              />
            }
            {!reenterNewPasswordValid && newPassword.length > 0 &&
              <FontAwesomeIcon
                style={inputIconInvalidStyle()}
                icon="circle-xmark"
                size={18 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
              />
            }
            <Input
              placeholder={translator.t('views.account.password.reenterPasswordPlaceholder')}
              label={translator.t('views.account.password.reenterPasswordLabel')}
              secureTextEntry
              value={reenterNewPassword}
              onChangeText={(text) => {
                setReenterNewPassword(text);
              }}
              returnKeyType="done"
              inputStyle={{
                marginBottom: 26,
              }}
            />
          </View>

          <View style={styles.passwordRequirementContainer}>
            <View style={styles.passwordRequirement}>
              <Text
                style={{
                  ...styles.passwordRequirementTop,
                  // ...(passwordRequirements[0] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >8 +</Text>
              <Text
                style={{
                  ...styles.passwordRequirementBottom,
                  // ...(passwordRequirements[0] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                numberOfLines={1}
              >{translator.t('global.passwordRequirements.characters')}</Text>
            </View>
            <View style={styles.passwordRequirement}>
              <Text
                style={{
                  ...styles.passwordRequirementTop,
                  // ...(passwordRequirements[1] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >A-Z</Text>
              <Text
                style={{
                  ...styles.passwordRequirementBottom,
                  // ...(passwordRequirements[1] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                numberOfLines={1}
              >{translator.t('global.passwordRequirements.uppercase')}</Text>
            </View>
            <View style={styles.passwordRequirement}>
              <Text
                style={{
                  ...styles.passwordRequirementTop,
                  // ...(passwordRequirements[2] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >a-z</Text>
              <Text
                style={{
                  ...styles.passwordRequirementBottom,
                  // ...(passwordRequirements[2] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                numberOfLines={1}
              >{translator.t('global.passwordRequirements.lowercase')}</Text>
            </View>
            <View style={styles.passwordRequirement}>
              <Text
                style={{
                  ...styles.passwordRequirementTop,
                  // ...(passwordRequirements[3] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >0-9</Text>
              <Text
                style={{
                  ...styles.passwordRequirementBottom,
                  // ...(passwordRequirements[3] ? styles.passwordRequirementFulfilled : null),
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                numberOfLines={1}
              >{translator.t('global.passwordRequirements.number')}</Text>
            </View>
          </View>

          <Button
            width={isTablet() ? '50%' : '100%'}
            buttonStyle={{
              alignSelf: 'center'
            }}
            label={translator.t('global.submitLabel')}
            onPress={confirmPress}
            disabled={currentPassword.length === 0 || !newPasswordValid || !reenterNewPasswordValid}
          />

          <Button
            width={isTablet() ? '50%' : '100%'}
            label={translator.t('global.cancelLabel')}
            buttonStyle={{
              backgroundColor: Colors.white,
              borderColor: Colors.white,
              alignSelf: 'center'
            }}
            labelStyle={{
              color: Colors.primary1,
            }}
            onPress={() => {
              navigation.pop();
            }}
          />

        </ScrollView>

      </KeyboardAvoidingView>

    </>
  );
});

Password.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    pop: PropTypes.func,
  }).isRequired,
};

export default Password;
