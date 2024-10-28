/* eslint-disable react-hooks/exhaustive-deps */
import React, { createRef, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFontScale } from '../../utils/fontScaling';
import { deviceMultiplier } from '../../styles/devices';
import { isTablet } from 'react-native-device-info';
import translator from '../../models/translator';

const FOOTER_HEIGHT = 220;

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
    // marginBottom: 50,
  },
  subTitle: {
    ...Typography.h4,
    color: Colors.primary1,
    marginBottom: 30,
  },
  // top: {
  //   flex: 1
  // },
  bottom: {
    flex: 2,
    paddingHorizontal: isTablet() ? 75 : 0
  },
  footer: {
    flex: 1,
    height: 210,
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
  passwordRequirementContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
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
  resendText: {
    ...Typography.h6,
    color: Colors.medium,
    alignSelf: 'center'
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

const ChangePassword = observer(({
  navigation,
}) => {

  const store = useStore();
  const isFirstRender = useIsFirstRender();
  const insets = useSafeAreaInsets();
  const currentFontScale = useFontScale();

  const CODE_LENGTH = 6;
  const codeDigitArray = new Array(CODE_LENGTH).fill(0);
  const [inputContainerFocused, setInputContainerFocused] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordValid, setNewPasswordValid] = useState(false);
  const [reenterNewPassword, setReenterNewPassword] = useState('');
  const [reenterNewPasswordValid, setReenterNewPasswordValid] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [code, setCode] = useState('');
  const [error, setError] = useState(undefined);
  const [screenReaderOn, setScreenReaderOn] = useState(false);

  const hiddenInputRef = createRef();

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then((screenReaderEnabled) => {
        setScreenReaderOn(screenReaderEnabled);
      });
  }, []);

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
      setButtonDisabled(!(code.length === 6 && valid && reenterNewPasswordValid));
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
      setButtonDisabled(!(code.length === 6 && newPasswordValid && valid));
    }
  }, [reenterNewPassword]);

  useEffect(() => {
    if (!isFirstRender) {
      setButtonDisabled(!(code.length === 6 && newPasswordValid && reenterNewPasswordValid));
    }
  }, [code]);

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

  const verify = () => {
    store.display.showSpinner();
    setCode('');
    setTimeout(() => {
      store.authentication.recover()
        .then(() => {
          store.display.hideSpinner();
        })
        .catch(e => {
          store.display.hideSpinner();
          console.log(e);
        });
    }, 2000);
  };

  const handleChangePassword = () => {
    store.display.showSpinner();
    setTimeout(() => {
      store.authentication.confirm(code, store.authentication.recoveryDestination)
        .then((confirmed) => {
          if (confirmed) {
            store.authentication.resetPassword(newPassword)
              .then((changed) => {
                if (changed) {
                  store.authentication.login(store.authentication.email, newPassword, 'app', true)
                    .then((onboarded) => {
                      store.display.hideSpinner();
                      if (onboarded) {
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'home' }],
                        });
                      }
                      else {
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'onboard.contact' }],
                        });
                      }
                    })
                    .catch((e) => {
                      setError('Error logging back in');
                      store.display.hideSpinner();
                      console.log(e);
                    });
                }
                else {
                  setError('Error changing password');
                  store.display.hideSpinner();
                }
              })
              .catch(e => {
                setError('Error resetting password');
                store.display.hideSpinner();
                console.log(e);
              });
          }
          else {
            setError('Invalid code');
            store.display.hideSpinner();
          }
        })
        .catch(e => {
          setError('Error verifying user');
          store.display.hideSpinner();
          console.log(e);
        });
    }, 2000);
  };

  // useEffect(() => {
  //   setTimeout(() => {
  //     verify();
  //   }, 50);
  // }, []);

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

  const containerStyle = () => {
    return {
      ...styles.container,
      paddingTop: insets.top,
      paddingBottom: insets.bottom
    }
  }

  const contentStyle = () => {
    return {
      // height: Devices.screen.height - (insets.top + insets.bottom)
    }
  }

  return (

    <View style={containerStyle()}>

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
            size={36}
            style={styles.backButtonIcon} />
        </Pressable>

      </View>

      <ScrollView
        style={{
          flex: 1,
          paddingBottom: 100
          // marginTop: insets.top,
          // marginBottom: insets.bottom,
        }}
        contentContainerStyle={{
          paddingBottom: 300,
        }}
      >

        <View
          style={{
            flex: 1
          }}
        >

          <View
            style={styles.bottom}
          >

            <Text
              style={styles.title}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.recoverAccount.changePassword.title')}</Text>

            <Text
              style={styles.subTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.recoverAccount.changePassword.subTitle')}</Text>

            <Text maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{error}</Text>

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
                label={translator.t('views.recoverAccount.changePassword.newPasswordLabel')}
                placeholder={translator.t('views.recoverAccount.changePassword.newPasswordPlaceholder')}
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
                label={translator.t('views.recoverAccount.changePassword.reenterPasswordLabel')}
                placeholder={translator.t('views.recoverAccount.changePassword.reenterPasswordPlaceholder')}
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
              label={translator.t('views.recoverAccount.changePassword.changePasswordLabel')}
              disabled={buttonDisabled}
              onPress={handleChangePassword}
            />

            <Text
              style={styles.resendText}
            >
              <Text
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.recoverAccount.changePassword.newCode')}</Text>
              <Text
                onPress={verify}
                style={{ color: Colors.primary1, fontWeight: 'bold' }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.recoverAccount.changePassword.request')}</Text>
            </Text>

          </View>

        </View>

      </ScrollView>

    </View>

    // <View
    //   style={containerStyle()}
    // >

    //   <ScrollView
    //     style={styles.scroll}
    //   >

    //     <View
    //       style={contentStyle()}
    //     >

    //       <View
    //         style={styles.top}
    //       >

    //         <Pressable
    //           style={styles.backButton}
    //           accessibilityLabel={translator.t('global.backLabelDefault')}
    //           accessibilityLanguage={store.preferences.language || 'en'}
    //           onPress={() => {
    //             navigation.pop();
    //           }}>
    //           <FontAwesomeIcon
    //             icon="chevron-left"
    //             size={36}
    //             style={styles.backButtonIcon} />
    //         </Pressable>

    //         <Text
    //           style={styles.title}
    //           maxFontSizeMultiplier={config.MAX_FONT_SCALE}
    //         >{translator.t('views.recoverAccount.changePassword.title')}</Text>

    //       </View>

    //       <View
    //         style={styles.bottom}
    //       >

    //         <Text
    //           style={styles.subTitle}
    //           maxFontSizeMultiplier={config.MAX_FONT_SCALE}
    //         >{translator.t('views.recoverAccount.changePassword.subTitle')}</Text>

    //         <Text maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{error}</Text>

    //         {!screenReaderOn &&
    //           <>
    //             <Pressable
    //               style={styles.inputsContainer}
    //               onPress={inputContainerPress}
    //               accessibilityLabel={translator.t('global.mfa.confirm.inputLabel')}
    //               accessibilityLanguage={store.preferences.language || 'en'}
    //             >
    //               {codeDigitArray.map(codeDigitArrayToInputs)}
    //             </Pressable>

    //             <TextInput
    //               ref={hiddenInputRef}
    //               style={styles.hiddenCodeInput}
    //               value={code}
    //               onChangeText={hiddenInputChangeText}
    //               onSubmitEditing={hiddenInputSubmitEditing}
    //               keyboardType="number-pad"
    //               returnKeyType="done"
    //               textContentType="oneTimeCode"
    //               maxLength={6}
    //               accessible={false}
    //             />
    //           </>
    //         }
    //         {screenReaderOn &&
    //           <TextInput
    //             style={styles.screenReaderInput}
    //             value={code}
    //             onChangeText={hiddenInputChangeText}
    //             onSubmitEditing={hiddenInputSubmitEditing}
    //             keyboardType="number-pad"
    //             returnKeyType="done"
    //             textContentType="oneTimeCode"
    //             maxLength={6}
    //           />
    //         }

    //         <View style={styles.fieldContainer}>
    //           {newPasswordValid && newPassword.length > 0 &&
    //             <FontAwesomeIcon
    //               style={inputIconSuccessStyle()}
    //               icon="circle-check"
    //               size={18 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
    //             />
    //           }
    //           {!newPasswordValid && newPassword.length > 0 &&
    //             <FontAwesomeIcon
    //               style={inputIconInvalidStyle()}
    //               icon="circle-xmark"
    //               size={18 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
    //             />
    //           }
    //           <Input
    //             label={translator.t('views.recoverAccount.changePassword.newPasswordLabel')}
    //             placeholder={translator.t('views.recoverAccount.changePassword.newPasswordPlaceholder')}
    //             secureTextEntry
    //             value={newPassword}
    //             onChangeText={(text) => {
    //               setNewPassword(text);
    //             }}
    //             returnKeyType="done"
    //             inputStyle={{
    //               marginBottom: 26,
    //             }}
    //             textStyle={{
    //               paddingRight: 160,
    //             }}
    //           />
    //         </View>

    //         <View style={styles.fieldContainer}>
    //           {reenterNewPasswordValid && newPassword.length > 0 &&
    //             <FontAwesomeIcon
    //               style={inputIconSuccessStyle()}
    //               icon="circle-check"
    //               size={18 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
    //             />
    //           }
    //           {!reenterNewPasswordValid && newPassword.length > 0 &&
    //             <FontAwesomeIcon
    //               style={inputIconInvalidStyle()}
    //               icon="circle-xmark"
    //               size={18 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
    //             />
    //           }
    //           <Input
    //             label={translator.t('views.recoverAccount.changePassword.reenterPasswordLabel')}
    //             placeholder={translator.t('views.recoverAccount.changePassword.reenterPasswordPlaceholder')}
    //             secureTextEntry
    //             value={reenterNewPassword}
    //             onChangeText={(text) => {
    //               setReenterNewPassword(text);
    //             }}
    //             returnKeyType="done"
    //             inputStyle={{
    //               marginBottom: 26,
    //             }}
    //           />
    //         </View>

    //         <View style={styles.passwordRequirementContainer}>
    //           <View style={styles.passwordRequirement}>
    //             <Text
    //               style={{
    //                 ...styles.passwordRequirementTop,
    //                 // ...(passwordRequirements[0] ? styles.passwordRequirementFulfilled : null),
    //               }}
    //               maxFontSizeMultiplier={config.MAX_FONT_SCALE}
    //             >8 +</Text>
    //             <Text
    //               style={{
    //                 ...styles.passwordRequirementBottom,
    //                 // ...(passwordRequirements[0] ? styles.passwordRequirementFulfilled : null),
    //               }}
    //               maxFontSizeMultiplier={config.MAX_FONT_SCALE}
    //               numberOfLines={1}
    //             >{translator.t('global.passwordRequirements.characters')}</Text>
    //           </View>
    //           <View style={styles.passwordRequirement}>
    //             <Text
    //               style={{
    //                 ...styles.passwordRequirementTop,
    //                 // ...(passwordRequirements[1] ? styles.passwordRequirementFulfilled : null),
    //               }}
    //               maxFontSizeMultiplier={config.MAX_FONT_SCALE}
    //             >A-Z</Text>
    //             <Text
    //               style={{
    //                 ...styles.passwordRequirementBottom,
    //                 // ...(passwordRequirements[1] ? styles.passwordRequirementFulfilled : null),
    //               }}
    //               maxFontSizeMultiplier={config.MAX_FONT_SCALE}
    //               numberOfLines={1}
    //             >{translator.t('global.passwordRequirements.uppercase')}</Text>
    //           </View>
    //           <View style={styles.passwordRequirement}>
    //             <Text
    //               style={{
    //                 ...styles.passwordRequirementTop,
    //                 // ...(passwordRequirements[2] ? styles.passwordRequirementFulfilled : null),
    //               }}
    //               maxFontSizeMultiplier={config.MAX_FONT_SCALE}
    //             >a-z</Text>
    //             <Text
    //               style={{
    //                 ...styles.passwordRequirementBottom,
    //                 // ...(passwordRequirements[2] ? styles.passwordRequirementFulfilled : null),
    //               }}
    //               maxFontSizeMultiplier={config.MAX_FONT_SCALE}
    //               numberOfLines={1}
    //             >{translator.t('global.passwordRequirements.lowercase')}</Text>
    //           </View>
    //           <View style={styles.passwordRequirement}>
    //             <Text
    //               style={{
    //                 ...styles.passwordRequirementTop,
    //                 // ...(passwordRequirements[3] ? styles.passwordRequirementFulfilled : null),
    //               }}
    //               maxFontSizeMultiplier={config.MAX_FONT_SCALE}
    //             >0-9</Text>
    //             <Text
    //               style={{
    //                 ...styles.passwordRequirementBottom,
    //                 // ...(passwordRequirements[3] ? styles.passwordRequirementFulfilled : null),
    //               }}
    //               maxFontSizeMultiplier={config.MAX_FONT_SCALE}
    //               numberOfLines={1}
    //             >{translator.t('global.passwordRequirements.number')}</Text>
    //           </View>
    //         </View>

    //       </View>

    //       <View style={styles.footer}>

    //         <Button
    //           width={isTablet() ? '50%' : '100%'}
    //           buttonStyle={{
    //             alignSelf: 'center'
    //           }}
    //           label={translator.t('views.recoverAccount.changePassword.changePasswordLabel')}
    //           disabled={buttonDisabled}
    //           onPress={handleChangePassword}
    //         />

    //         <Text
    //           style={styles.resendText}
    //         >
    //           <Text
    //             maxFontSizeMultiplier={config.MAX_FONT_SCALE}
    //           >{translator.t('views.recoverAccount.changePassword.newCode')}</Text>
    //           <Text
    //             onPress={verify}
    //             style={{ color: Colors.primary1, fontWeight: 'bold' }}
    //             maxFontSizeMultiplier={config.MAX_FONT_SCALE}
    //           >{translator.t('views.recoverAccount.changePassword.request')}</Text>
    //         </Text>

    //       </View>

    //     </View>

    //   </ScrollView>

    // </View>
  );
});

ChangePassword.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default ChangePassword;
