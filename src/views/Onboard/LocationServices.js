/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Button from '../../components/Button';
import { Colors, Devices, Typography } from '../../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { geolocation } from '../../models/geolocation';
import { useIsFirstRender } from '../../utils/isFirstRender';
import { checkMultiple, PERMISSIONS } from 'react-native-permissions';

const FOOTER_HEIGHT = 170;
const PADDING_TOP = 65;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: PADDING_TOP,
  },
  content: {
    height: Devices.screen.height - (FOOTER_HEIGHT + PADDING_TOP),
  },
  top: {
    flex: 1,
  },
  bottom: {
    flex: 1,
  },
  footer: {
    height: FOOTER_HEIGHT,
    display: 'flex',
    justifyContent: 'flex-start',
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
    marginBottom: 10,
  },
  subTitle: {
    ...Typography.h5,
    color: Colors.darker,
    marginBottom: 10,
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

const LocationServices = observer(({
  navigation,
}) => {
  const isFirstRender = useIsFirstRender();

  const [nextPressed, setNextPressed] = useState(false);

  useEffect(() => {
    if (isFirstRender) {
      // if a user closes the onboarding process after accept/deny location
      // services then prevent them having to tap twice
      checkMultiple([
        PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        PERMISSIONS.IOS.LOCATION_ALWAYS,
        PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      ])
        .then((statuses) => {
          if (statuses[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] === 'granted'
            || statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] === 'granted'
            || statuses[PERMISSIONS.IOS.LOCATION_ALWAYS] === 'granted'
            || statuses[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE] === 'granted') {
            setNextPressed(true);
          }
        });
    }
  }, []);

  const handleNext = () => {
    if (!nextPressed) {
      setNextPressed(true);
      geolocation.init();
    }
    else {
      navigation.navigate('onboard.contact');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Devices.isIphone ? 'padding' : 'height'}
      pointerEvents="box-none"
    >

      <ScrollView style={styles.scroll}>

        <View style={styles.content}>

          <View style={styles.top}>

            <Pressable
              style={styles.backButton}
              onPress={() => {
                navigation.pop();
              }}>
              <FontAwesomeIcon
                icon="chevron-left"
                size={20}
                style={styles.backButtonIcon} />
            </Pressable>

            <Image
              style={styles.logo}
              resizeMode="contain"
              source={require('../../../assets/images/ITS4US_Buffalo_Logo.png')}
            />

          </View>

          <View style={styles.bottom}>

            <Text style={styles.title}>[X] Requires Access to Your Location</Text>

            <Text style={styles.subTitle}>Before we start, we need location information to provide accurate route estimates, pricing, and tracking. Is this ok?</Text>

            <Text style={{
              ...styles.subTitle,
              fontWeight: 'bold',
            }}>When prompted, choose “while using the app” for best app experience.</Text>


          </View>

        </View>

        <View style={styles.footer}>

          <Button
            label="Next"
            onPress={handleNext}
          />

          <Button
            label="Skip"
            buttonStyle={{
              backgroundColor: Colors.white,
              borderColor: Colors.white,
            }}
            labelStyle={{
              color: Colors.primary1,
            }}
            onPress={() => {
              navigation.push('onboard.enhancedMobilityOptions');
            }}
          />

          <View style={styles.progressContainer}>
            <View style={styles.progressActive} />
            <View style={styles.progressInactive} />
            <View style={styles.progressInactive} />
            <View style={styles.progressInactive} />
            <View style={styles.progressInactive} />
          </View>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>
  );
});

LocationServices.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default LocationServices;
