/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Colors, Devices, Typography } from '../../styles';
import Header from '../../components/Header';
import { useStore } from '../../stores/RootStore';
import { validators } from '../../utils';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useFontScale } from '../../utils/fontScaling';
import config from '../../config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deviceMultiplier } from '../../styles/devices';
import { isTablet } from 'react-native-device-info';
import translator from '../../models/translator';

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 25,
    paddingTop: 65,
  },
  content: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.dark,
    borderRadius: 8,
    marginBottom: 17,
    position: 'relative',
  },
  cardTop: {
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 12,
  },
  name: {
    ...Typography.h2,
    marginBottom: 7,
    fontWeight: 'bold',
  },
  phone: {
    ...Typography.h4,
    marginBottom: 4,
    opacity: 0.7,
  },
  email: {
    ...Typography.h4,
    marginBottom: 4,
    opacity: 0.7,
  },
  status: {
    ...Typography.h5,
    marginBottom: 10,
    color: Colors.primary1,
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    top: 10,
    right: 10,
  },
  addContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
    height: Devices.screen.height,
    backgroundColor: Colors.white,
  },
  addKeyboardView: {
    position: 'relative',
    display: 'flex',
    flex: 1,
    paddingTop: Devices.isIphoneX ? 100 : 80,
    paddingHorizontal: 25,
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
  closeButton: {
    position: 'absolute',
    top: Devices.isIphone ? 65 : 45,
    right: 25,
    color: Colors.primary1,
    marginBottom: 43,
    zIndex: 10,
  },
  closeButtonIcon: {
    color: Colors.primary1,
  },
  addButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 19,
  },
  addButtonIcon: {
    color: Colors.primary1,
    marginRight: 10,
  },
  addButtonLabel: {
    ...Typography.h5,
    color: Colors.primary1,
    fontWeight: 'bold',
  },
  title: {
    ...Typography.h2,
    color: Colors.primary1,
    marginBottom: 150,
  },
  saveButton: {
    marginBottom: 80,
    alignSelf: 'center'
  },
  deleteTitle: {
    ...Typography.h3,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  deleteCaregiverName: {
    ...Typography.h3,
    marginBottom: 5,
  },
  deleteCaregiverEmail: {
    ...Typography.h3,
    marginBottom: 20,
  },
  deleteFooter: {
    width: '100%',
    alignItems: 'center',
  },
});

const Caregivers = observer(({
  navigation,
}) => {

  const store = useStore();
  const currentFontScale = useFontScale();
  const insets = useSafeAreaInsets();

  const [viewIndex, setViewIndex] = useState(0);
  const [caregivers, setCaregivers] = useState(store.traveler.caregivers || []);
  const [firstName, setFirstName] = useState('');
  const [firstNameError, setFirstNameError] = useState(undefined);
  const [lastName, setLastName] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const _viewValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(_viewValue, {
      toValue: viewIndex,
      duration: 250,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [viewIndex]);

  useEffect(() => {
    fetchCaregivers();
  }, [navigation]);

  const fetchCaregivers = () => {
    setRefreshing(true);
    store.authentication.fetchAccessToken()
      .then((accessToken) => {
        store.traveler.getCaregivers(accessToken)
          .then(results => {
            setCaregivers(results);
            setRefreshing(false);
          })
          .catch((e) => {
            console.log('get caregivers error', e);
            setRefreshing(false);
          });
      })
      .catch((e) => {
        console.log('fetch access token error', e);
        setRefreshing(false);
      });
  };

  const addPress = () => {
    setFirstName(undefined);
    setLastName(undefined);
    setEmail(undefined);
    setViewIndex(1);
  };

  const savePress = () => {
    if (validate()) {
      store.display.showSpinner();
      setTimeout(() => {
        store.authentication.fetchAccessToken()
          .then((accessToken) => {
            store.traveler.inviteCaregiver(email, firstName, lastName, accessToken)
              .then(result => {
                console.log(result);
                setCaregivers(store.traveler.caregivers);
                store.display.hideSpinner();
                closePress();
              })
              .catch((e) => {
                store.display.hideSpinner();
                closePress();
                console.log('invite caregiver error', e);
              });
          })
          .catch((e) => {
            store.display.hideSpinner();
            closePress();
            console.log('fetch access token error', e);
          });
      }, 1000);
    }
  };

  const handleDeleteCaregiverPress = (caregiver) => {
    setSelectedCaregiver(caregiver);
    setShowConfirmDelete(true);
  };

  const confirmDeletePress = () => {
    setShowConfirmDelete(false);
    store.display.showSpinner();
    store.authentication.fetchAccessToken()
      .then((accessToken) => {
        store.traveler.deleteCaregiver(selectedCaregiver.id, accessToken)
          .then(() => {
            setTimeout(() => {
              setCaregivers(store.traveler.caregivers);
              store.display.hideSpinner();
              setSelectedCaregiver(null);
            }, 750);
          })
          .catch((e) => {
            setTimeout(() => {
              store.display.hideSpinner();
              setSelectedCaregiver(null);
            }, 750);
            console.log('delete caregiver error', e);
          });
      })
      .catch((e) => {
        setTimeout(() => {
          store.display.hideSpinner();
          setSelectedCaregiver(null);
        }, 750);
        console.log('fetch access token error', e);
      });
  };

  const cancelDeletePress = () => {
    setSelectedCaregiver(null);
    setShowConfirmDelete(false);
  };

  const closePress = () => {
    setViewIndex(0);

    setFirstName(undefined);
    setFirstNameError(undefined);

    setLastName(undefined);
    setLastNameError(undefined);

    setEmail(undefined);
    setEmailError(undefined);
  };

  const validate = () => {
    let isValid = true;
    setFirstNameError(undefined);
    setLastNameError(undefined);
    setEmailError(undefined);

    if (!validators.hasLengthGreaterThan(firstName, 0)) {
      setFirstNameError(translator.t('global.requiredError'));
      isValid = false;
    }
    if (!validators.hasLengthGreaterThan(lastName, 0)) {
      setLastNameError(translator.t('global.requiredError'));
      isValid = false;
    }
    if (!validators.isEmail(email)) {
      setEmailError(translator.t('views.account.caregivers.emailError'));
      isValid = false;
    }
    return isValid;
  };

  const mainViewStyle = () => {
    const opacity = _viewValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    });
    return {
      ...styles.mainContainer,
      opacity,
    };
  };

  const addViewStyle = () => {
    const top = _viewValue.interpolate({
      inputRange: [0, 1],
      outputRange: [Devices.screen.height, 0],
    });
    return {
      ...styles.addContainer,
      top,
    };
  };

  return (
    <>

      <Animated.View
        style={mainViewStyle()}
      >
        <Header
          title={translator.t('views.account.caregivers.header')}
          onBackPress={() => {
            navigation.pop();
          }}
          backLabel={translator.t('global.backLabel', { to: translator.t('views.account.menu.header') })}
        />
        <View style={styles.content}>

          <Pressable
            style={styles.addButton}
            onPress={addPress}>
            <FontAwesomeIcon
              icon="plus"
              size={18 * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
              style={styles.addButtonIcon}
            />
            <Text
              style={styles.addButtonLabel}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.caregivers.invite')}</Text>
          </Pressable>

          <ScrollView
            style={{
              marginBottom: insets.bottom,
            }}
            contentContainerStyle={{
              paddingBottom: 100,
            }}
            refreshControl={
              <RefreshControl
                colors={[Colors.primary3]}
                tintColor={Colors.primary3}
                refreshing={refreshing}
                onRefresh={fetchCaregivers}
              />
            }
          >

            {caregivers
              .filter(c => c.status !== 'denied')
              .map((c, i) => {
                let name = c.name;
                if (c.firstName || c.lastName) {
                  name = `${c.firstName} ${c.lastName}`;
                }
                return (
                  <View
                    key={i}
                    style={styles.card}>
                    <View style={styles.cardTop}>
                      {c.status === 'pending' &&
                        <Text
                          style={styles.status}
                          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                        >{translator.t('views.account.caregivers.pending')}</Text>
                      }
                      {c.status === 'received' &&
                        <Text
                          style={styles.status}
                          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                        >{translator.t('views.account.caregivers.received')}</Text>
                      }
                      {c.status === 'approved' &&
                        <FontAwesomeIcon
                          style={styles.status}
                          icon="check-circle"
                          size={18 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                        />
                      }
                      <Text style={styles.name} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{name}</Text>
                      <Text style={styles.email} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{c.email}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        handleDeleteCaregiverPress(c);
                      }}
                      accessibilityLabel={translator.t('views.account.caregivers.delete')}
                      accessibilityLanguage={store.preferences.language || 'en'}
                    >
                      <FontAwesomeIcon
                        icon="trash"
                        size={16 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                        color={Colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })
            }

          </ScrollView>

        </View>

      </Animated.View>

      <Animated.View
        style={addViewStyle()}
      >

        <Pressable
          style={styles.closeButton}
          onPress={closePress}>
          <FontAwesomeIcon
            icon="xmark"
            size={24 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
            style={styles.closeButtonIcon}
          />
        </Pressable>

        <KeyboardAvoidingView
          style={styles.addKeyboardView}
          behavior={Devices.isIphone ? 'padding' : 'height'}
        >

          <ScrollView>

            <View style={styles.content}>

              <Text
                style={styles.title}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.caregivers.invite')}</Text>

              <View style={styles.fieldContainer}>
                {firstNameError &&
                  <Text
                    testID="first-name-error-message"
                    style={styles.error}
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
                    style={styles.error}
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
                    style={styles.error}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  >{emailError}</Text>
                }
                <Input
                  placeholder={translator.t('global.emailPlaceholder')}
                  keyboardType="default"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                  }}
                  returnKeyType="done"
                />
              </View>

            </View>

            <Button
              width={isTablet() ? '50%' : '100%'}
              label={translator.t('views.account.caregivers.inviteLabel')}
              buttonStyle={styles.saveButton}
              onPress={savePress}
            />

          </ScrollView>

        </KeyboardAvoidingView>

      </Animated.View>

      <Modal
        show={showConfirmDelete}
        height={isTablet() ? 330 : 270}
      >
        <Text
          style={styles.deleteTitle}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{translator.t('views.account.caregivers.deleteConfirm')}</Text>
        <Text
          style={styles.deleteCaregiverName}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{selectedCaregiver?.name || (`${selectedCaregiver?.firstName} ${selectedCaregiver?.lastName}`)}</Text>
        <Text
          style={styles.deleteCaregiverEmail}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{selectedCaregiver?.email}</Text>
        <View style={styles.deleteFooter}>
          <Button
            label={translator.t('global.deleteLabel')}
            width={150}
            onPress={confirmDeletePress}
          />
          <Button
            label={translator.t('global.cancelLabel')}
            width={150}
            buttonStyle={{
              backgroundColor: Colors.white,
              borderColor: Colors.white,
              marginBottom: 0,
            }}
            labelStyle={{
              color: Colors.primary1,
            }}
            onPress={cancelDeletePress}
          />
        </View>
      </Modal>

    </>
  );
});

Caregivers.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    pop: PropTypes.func,
  }).isRequired,
};

export default Caregivers;
