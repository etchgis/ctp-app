import React, { createRef, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors, Devices, Typography } from '../../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useStore } from '../../stores/RootStore';
import { geocoder } from '../../services/transport';
import config from '../../config';
import AddressSearch from '../../components/AddressSearch';
import { useFontScale } from '../../utils/fontScaling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deviceMultiplier } from '../../styles/devices';
import { isTablet } from 'react-native-device-info';
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
    marginBottom: 30,
  },
  error: {
    ...Typography.h5,
    color: Colors.danger,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    position: 'absolute',
    top: Devices.screen.height,
    right: 0,
    left: 0,
    height: Devices.screen.height,
    backgroundColor: Colors.white,
    paddingTop: Devices.isIphoneX ? 65 : 45,
  },
  searchResultContainer: {
    flexDirection: 'row',
    borderBottomColor: Colors.secondary2,
    borderBottomWidth: 1,
    height: 50,
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
  selectedAddressContainer: {
    height: 150,
  },
  selectedAddress: {
    backgroundColor: Colors.secondary2,
    padding: 16,
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

const Address = observer(({
  navigation,
}) => {

  const store = useStore();
  const currentFontScale = useFontScale();
  const insets = useSafeAreaInsets();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [error, setError] = useState(undefined);

  const dummyInputRef = createRef();

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
    setSelectedAddress(result);
    setShowAddressSearch(false);
  };

  const handleNext = () => {
    if (selectedAddress !== null) {
      store.registration.updateProperty('address', selectedAddress);
      navigation.push('onboard.caregiver');
    }
    else {
      setError(translator.t('views.onboard.address.error'));
    }
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
              >{translator.t('views.onboard.address.title')}</Text>

              <Text
                style={styles.subTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t('views.onboard.address.subTitle')}</Text>

              <Input
                ref={dummyInputRef}
                leftIconName="magnifying-glass"
                placeholder={translator.t('views.onboard.address.addressInputPlaceholder')}
                onFocus={dummyRefFocus}
              />

              <View style={styles.selectedAddressContainer}>
                {!selectedAddress && error &&
                  <Text
                    testID="address-error-message"
                    style={styles.error}
                  >
                    {error}
                  </Text>
                }
                {selectedAddress && !error &&
                  <ScrollView
                    contentContainerStyle={{
                      paddingBottom: 50,
                    }}
                  >
                    <View style={styles.selectedAddress}>
                      <Text
                        style={{ marginBottom: 4 }}
                        maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                      >{translator.t('views.onboard.address.selectedAddress')}</Text>
                      <Text
                        style={{ fontWeight: 'bold' }}
                        maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                      >{selectedAddress.title}</Text>
                      {selectedAddress.description &&
                        <Text
                          style={{ fontWeight: 'bold' }}
                          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                        >{selectedAddress.description}</Text>
                      }
                    </View>
                  </ScrollView>
                }
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
                  navigation.push('onboard.caregiver');
                }}
              />

              <View style={styles.progressContainer}>
                <View style={styles.progressInactive} />
                <View style={styles.progressInactive} />
                <View style={styles.progressActive} />
                <View style={styles.progressInactive} />
                <View style={styles.progressInactive} />
              </View>

            </View>

          </View>

        </ScrollView>

      </View>

      <AddressSearch
        show={showAddressSearch}
        onAddressSelect={handleAddressSearchSelect}
        onCancelPress={handleCancelAddressSearch}
      />

    </>
  );
});

Address.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default Address;
