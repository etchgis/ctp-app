/* eslint-disable react-hooks/exhaustive-deps */
import React, { createRef, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Colors, Devices, Typography } from '../../styles';
import Header from '../../components/Header';
import { useStore } from '../../stores/RootStore';
import { formatters, validators } from '../../utils';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { geocoder } from '../../services/transport';
import Modal from '../../components/Modal';
import { isTablet } from 'react-native-device-info';
import translator from '../../models/translator';

// TEMP
import jwtDecode from 'jwt-decode';
import moment from 'moment';
import config from '../../config';
import AddressSearch from '../../components/AddressSearch';
import { deviceMultiplier } from '../../styles/devices';
// TEMP

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 25,
    paddingTop: 65,
  },
  content: {
    flex: 1,
  },
  name: {
    ...Typography.h2,
    marginBottom: 7,
    fontWeight: 'bold',
  },
  phone: {
    ...Typography.h4,
    marginBottom: 4,
  },
  email: {
    ...Typography.h4,
    marginBottom: 50,
  },
  homeAddressLabel: {
    ...Typography.h6,
    marginBottom: 7,
  },
  addressTitle: {
    ...Typography.h4,
    marginBottom: 4,
  },
  addressDescription: {
    ...Typography.h4,
    marginBottom: 50,
  },
  editButton: {
    marginBottom: 8,
    alignSelf: 'center'
  },
  deleteAccountButton: {
    marginBottom: 80,
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
    alignSelf: 'center'
  },
  editContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
    height: Devices.screen.height,
    backgroundColor: Colors.white,
  },
  editKeyboardView: {
    position: 'relative',
    display: 'flex',
    flex: 1,
    paddingTop: Devices.isIphoneX ? 100 : 80,
    paddingHorizontal: 25,
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
  searchContainer: {
    position: 'absolute',
    top: Devices.screen.height,
    right: 0,
    left: 0,
    flex: 1,
    height: Devices.screen.height * 2,
    backgroundColor: Colors.white,
    paddingTop: Devices.isIphoneX ? 65 : 45,
  },
  searchResultContainer: {
    flexDirection: 'row',
    borderBottomColor: Colors.secondary2,
    borderBottomWidth: 1,
    height: 50,
    flex: 1,
    alignItems: 'center',
  },
  searchResultLeft: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultMiddle: {
    flex: 1,
  },
  searchResultRight: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultDistance: {
    ...Typography.h6,
    color: Colors.darker,
  },
  searchResultTitle: {
    ...Typography.h5,
    color: Colors.primary1,
  },
  searchResultDescription: {
    ...Typography.h6,
    color: Colors.primary2,
  },
  title: {
    ...Typography.h2,
    color: Colors.primary1,
    marginBottom: 150,
  },
  saveButton: {
    marginBottom: 80,
    alignSelf: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.dark,
    borderRadius: 8,
    marginBottom: 17,
    flexDirection: 'row',
  },
  cardLeft: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cardRight: {
    width: 40,
    paddingHorizontal: 24,
    paddingVertical: 12,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: Colors.primary1,
    ...Typography.h4,
    fontWeight: 'bold',
    marginBottom: 7,
  },
  cardText: {
    ...Typography.h5,
    marginBottom: 3,
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center'
  },
  favoritesTitle: {
    ...Typography.h3,
    marginBottom: 7,
    marginTop: 25,
  },
  deleteTitle: {
    ...Typography.h3,
    color: Colors.danger,
    marginBottom: 20,
  },
  deleteSubTitle: {
    ...Typography.h4,
    marginBottom: 20,
  },
  deleteConfirm: {
    ...Typography.h4,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
});

const Profile = observer(({
  navigation,
}) => {
  const store = useStore();
  const { user } = store.authentication;

  const [viewIndex, setViewIndex] = useState(0);
  const [firstName, setFirstName] = useState(user?.profile?.firstName);
  const [firstNameError, setFirstNameError] = useState(undefined);
  const [lastName, setLastName] = useState(user?.profile?.lastName);
  const [lastNameError, setLastNameError] = useState(undefined);
  const [selectedAddress, setSelectedAddress] = useState(user?.profile?.address);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState(null);
  const [deleteButtonDisabled, setDeleteButtonDisabled] = useState(true);

  const _viewValue = useRef(new Animated.Value(0)).current;
  const dummyInputRef = createRef();

  useEffect(() => {
    Animated.timing(_viewValue, {
      toValue: viewIndex,
      duration: 250,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [viewIndex]);

  const dummyRefFocus = () => {
    dummyInputRef.current.blur();
    setShowAddressSearch(true);
  };

  const handleCancelAddressSearch = () => {
    setShowAddressSearch(false);
  };

  const handleAddressSearchSelect = (result) => {
    let address = result;
    address.alias = 'HOME';
    setSelectedAddress(address);
    setShowAddressSearch(false);
  };

  const validate = () => {
    let isValid = true;
    setFirstNameError(undefined);
    setLastNameError(undefined);

    if (!validators.hasLengthGreaterThan(firstName, 0)) {
      setFirstNameError(translator.t('global.requiredError'));
      isValid = false;
    }
    if (!validators.hasLengthGreaterThan(lastName, 0)) {
      setLastName(translator.t('global.requiredError'));
      isValid = false;
    }
    return isValid;
  };

  const closePress = () => {
    Keyboard.dismiss();
    setViewIndex(0);
  };

  const savePress = () => {
    if (validate()) {
      store.display.showSpinner();
      setTimeout(() => {
        store.profile.updateProperty('firstName', firstName, false);
        store.profile.updateProperty('lastName', lastName, false);
        store.profile.updateProperty('address', selectedAddress)
          .then(() => {
            store.display.hideSpinner();
            closePress();
          })
          .catch((e) => {
            store.display.hideSpinner();
            closePress();
            console.log(e);
          });
      }, 1000);
    }
  };
  const deleteInputChange = (value) => {
    setDeleteText(value);
    setDeleteButtonDisabled(value !== 'DELETE MY ACCOUNT');
  };

  const confirmDeletePress = () => {
    if (!deleteButtonDisabled) {
      confirmDeleteAccount();
    }
  };

  const confirmDeleteAccount = () => {
    store.display.showSpinner();
    store.authentication.deleteAccount()
      .then(() => {
        setTimeout(() => {
          store.display.hideSpinner();
          store.authentication.logout();
          store.mapManager.setCurrentMap('home');
          navigation.reset({
            index: 0,
            routes: [{ name: 'landing' }],
          });
        }, 500);
      })
      .catch((e) => {
        console.log(e);
        store.display.hideSpinner();
      });
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

  const editViewStyle = () => {
    const top = _viewValue.interpolate({
      inputRange: [0, 1],
      outputRange: [Devices.screen.height, 0],
    });
    return {
      ...styles.editContainer,
      top,
    };
  };

  return (

    <>

      <Animated.View
        style={mainViewStyle()}
      >
        <Header
          title={translator.t('views.account.profile.header')}
          onBackPress={() => {
            navigation.pop();
          }}
          backLabel={translator.t('global.backLabel', { to: translator.t('views.account.menu.header') })}
        />

        <View style={styles.content}>

          <Text
            style={styles.name}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{user?.profile?.firstName} {user?.profile?.lastName}</Text>

          <Text
            style={styles.phone}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{formatters.phone.asDomestic(user?.phone ? user?.phone.slice(2) : '')}</Text>

          <Text
            style={styles.email} maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{user?.email}</Text>

          <Text
            style={styles.homeAddressLabel}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.account.profile.address')}</Text>

          <Text
            style={styles.addressTitle}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{user?.profile?.address?.title}</Text>

          <Text
            style={styles.addressDescription}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{user?.profile?.address?.description}</Text>

        </View>

        <Button
          width={(isTablet() ? '50%' : '100%')}
          label={translator.t('views.account.profile.editLabel')}
          buttonStyle={styles.editButton}
          onPress={() => {
            setViewIndex(1);
          }}
        />

        <Button
          width={(isTablet() ? '50%' : '100%')}
          label={translator.t('views.account.profile.deleteLabel')}
          buttonStyle={styles.deleteAccountButton}
          onPress={() => {
            setShowConfirmDelete(true);
          }}
        />

      </Animated.View>

      <Animated.View
        style={editViewStyle()}
      >

        <Pressable
          style={styles.closeButton}
          onPress={closePress}
          accessibilityLabel={translator.t('global.closeLabel')}
          accessibilityLanguage={store.preferences.language || 'en'}
        >
          <FontAwesomeIcon
            icon="xmark"
            size={24 * deviceMultiplier}
            style={styles.closeButtonIcon} />
        </Pressable>

        <KeyboardAvoidingView
          style={styles.editKeyboardView}
          behavior={Devices.isIphone ? 'padding' : 'height'}
        >

          <ScrollView>

            <View style={styles.content}>

              <Text
                style={styles.title}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.account.profile.editProfileTitle')}</Text>

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

              <Input
                ref={dummyInputRef}
                value={selectedAddress?.text}
                leftIconName="magnifying-glass"
                placeholder={translator.t('views.account.profile.addressInputPlaceholder')}
                onFocus={dummyRefFocus}
                inputStyle={{
                  marginBottom: 100,
                }}
              />

            </View>

            <Button
              width={(isTablet() ? '50%' : '100%')}
              label={translator.t('global.saveLabel')}
              buttonStyle={styles.saveButton}
              onPress={savePress}
            />

          </ScrollView>

        </KeyboardAvoidingView>

      </Animated.View>

      <AddressSearch
        show={showAddressSearch}
        onAddressSelect={handleAddressSearchSelect}
        onCancelPress={handleCancelAddressSearch}
      />

      <Modal
        show={showConfirmDelete}
        height={400}
      >
        <View>
          <Text
            style={styles.deleteTitle}
          >{translator.t('views.account.profile.deleteTitle')}</Text>
          <Text
            style={styles.deleteSubTitle}
          >{translator.t('views.account.profile.deleteSubTitle')}</Text>
          <Text
            style={styles.deleteConfirm}
          >{translator.t('views.account.profile.deleteConfirm')}</Text>
          <View style={{
            alignItems: 'center',
          }}>
            <Input
              value={deleteText}
              onChangeText={deleteInputChange}
              inputStyle={{
                marginHorizontal: 25,
                marginBottom: 20,
                width: '100%',
              }}
            />
            <Button
              label={translator.t('views.account.profile.deleteConfirmLabel')}
              width={250}
              buttonStyle={{
                backgroundColor: Colors.danger,
                borderColor: Colors.danger,
              }}
              disabledButtonStyle={{
                backgroundColor: '#E88185',
                borderColor: '#E88185',
              }}
              disabled={deleteButtonDisabled}
              onPress={confirmDeletePress}
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
              onPress={() => {
                setShowConfirmDelete(false);
              }}
            />
          </View>
        </View>
      </Modal>

    </>
  );
});

Profile.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    pop: PropTypes.func,
  }).isRequired,
};

export default Profile;
