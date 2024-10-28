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
import { formatters, validators } from '../../utils';
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
    marginBottom: 30,
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
  spacer: {
    height: 40,
    marginBottom: 14,
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

const Contact = observer(({
  navigation,
}) => {

  const store = useStore();
  const isFirstRender = useIsFirstRender();
  const currentFontScale = useFontScale();
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(undefined);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!isFirstRender) {
      setPhoneError(!validators.hasLengthEqualTo(phone, 12) ? translator.t('global.requiredError') : undefined);
    }
  }, [phone]);

  useEffect(() => {
    const valid = validators.hasLengthEqualTo(phone, 12);
    setIsValid(valid);
  }, [phoneError]);

  const handleNext = () => {
    if (isValid) {
      store.registration.updateProperty('phone', `+1${phone.replace(/-/g, '')}`);
      navigation.push('onboard.address');
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
  }

  const contentStyle = () => {
    return {
      height: Devices.screen.height - (insets.top + insets.bottom)
    }
  }

  return (
    <View
      style={containerStyle()}
    >

      <ScrollView style={styles.scroll}>

        <View style={contentStyle()}>

          <View style={styles.top}>

            <Pressable
              style={styles.backButton}
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'login' }],
                });
              }}>
              <FontAwesomeIcon
                icon="chevron-left"
                size={20 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                style={styles.backButtonIcon}
              />
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
            >{translator.t('views.onboard.contact.title')}</Text>

            <Text
              style={styles.subTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.onboard.contact.subTitle')}</Text>

            <Input
              placeholder={translator.t('global.emailPlaceholder')}
              label={translator.t('global.emailLabel')}
              keyboardType="email-address"
              value={store.authentication.user.email}
              returnKeyType="done"
              disabled
            />

            <View style={styles.fieldContainer}>
              {phoneError &&
                <Text
                  testID="phone-error-message"
                  style={errorStyle()}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{phoneError}</Text>
              }
              <Input
                placeholder={translator.t('views.onboard.contact.phonePlaceholder')}
                value={phone}
                onChangeText={(text) => {
                  setPhone(formatters.phone.asDomestic(text));
                }}
                inputSyle={{
                  marginBottom: 44,
                }}
                returnKeyType="done"
              />
            </View>

          </View>

          <View style={styles.footer}>

            <Button
              label={translator.t('global.nextLabel')}
              onPress={!isValid ? () => { } : handleNext}
              disabled={!isValid}
              width={isTablet() ? '50%' : '100%'}
              buttonStyle={{
                alignSelf: 'center'
              }}
            />

            <View style={styles.spacer} />

            <View style={styles.progressContainer}>
              <View style={styles.progressInactive} />
              <View style={styles.progressActive} />
              <View style={styles.progressInactive} />
              <View style={styles.progressInactive} />
              <View style={styles.progressInactive} />
            </View>

          </View>

        </View>

      </ScrollView>

    </View>
  );
});

Contact.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default Contact;
