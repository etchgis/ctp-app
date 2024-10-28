import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Button from './Button';
import { Colors, Typography } from '../styles';
import config from '../config';
import { useFontScale } from '../utils/fontScaling';
import { isTablet } from 'react-native-device-info';
import { deviceMultiplier } from '../styles/devices';
import translator from '../models/translator';
import { useStore } from '../stores/RootStore';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1001
  },
  button: {
    backgroundColor: Colors.primary3,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    maxHeight: (90 * deviceMultiplier) - 18,  // max height before overflow minus the padding
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.55,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 1003,
  },
  buttonLabel: {
    ...Typography.h4,
    marginHorizontal: 18,
    color: Colors.white,
    fontWeight: 'bold',
  },
  buttonLogo: {
    // width: 24,
    // height: 24,
    // borderRadius: 12,
  },
  buttonIcon: {
    color: Colors.white,
    marginLeft: 'auto',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 30,
    right: 0,
    left: 0,
    height: 450 * deviceMultiplier,
    backgroundColor: Colors.white,
    paddingTop: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 6,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 1002,
  },
  scroll: {
    marginBottom: 10,
    width: '100%',
  },
  favoriteListItem: {
    paddingVertical: 10,
    borderBottomColor: Colors.primary2,
    borderBottomWidth: 1,
  },
  favoriteListItemTitle: {
    ...Typography.h4,
    color: Colors.primary1,
    fontWeight: 'bold',
    marginBottom: 7,
  },
  favoriteListItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteListItemDetailText: {
    ...Typography.h6
  },
});

const ScheduleTripDropdown = ({
  // position,
  loggedIn,
  favoriteTrips,
  onFavoriteTripPress,
  onScheduleTripPress,
  onLayout,
}) => {

  const store = useStore();
  const currentFontScale = useFontScale();

  const [opened, setOpened] = useState(false);

  const containerStyle = {
    ...styles.container,
  };

  const buttonText = translator.t(loggedIn ? 'components.scheduleTripDropdown.buttonLabelLoggedIn' : 'components.scheduleTripDropdown.buttonLabelLoggedOut');

  const buttonLogoStyle = () => {
    return {
      ...styles.buttonLogo,
      width: 24 * Math.min(config.MAX_FONT_SCALE, currentFontScale),
      height: 24 * Math.min(config.MAX_FONT_SCALE, currentFontScale),
      borderRadius: 12 * Math.min(config.MAX_FONT_SCALE, currentFontScale),
    };
  };

  const handleOnLayout = (e) => {
    if (onLayout) {
      onLayout(e);
    }
  };

  const favoriteTripsArrayToList = () => {
    const list =
      favoriteTrips.map((t) => {
        return (
          <TouchableOpacity
            key={t.id}
            style={styles.favoriteListItem}
            onPress={() => {
              setOpened(false);
              onFavoriteTripPress && onFavoriteTripPress(t);
            }}
            accessible={true}
            accessibilityLabel={
              `${t.alias}, ${t.origin.alias || t.origin.text} ${translator.t('global.toLabel')} ${t.destination.alias || t.destination.text}`
            }
            accessibilityLanguage={store.preferences.language || 'en'}
            accessibilityRole="button"
          >
            <Text
              style={styles.favoriteListItemTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{t.alias}</Text>
            <View
              style={styles.favoriteListItemDetail}
            >
              <Text
                style={styles.favoriteListItemDetailText}
                numberOfLines={1}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{t.origin.alias || t.origin.text}</Text>
              <FontAwesomeIcon
                icon="arrow-right"
                size={12 * deviceMultiplier}
                style={{ marginHorizontal: 8, flex: 1 }}
              />
              <Text
                style={styles.favoriteListItemDetailText}
                numberOfLines={1}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{t.destination.alias || t.destination.text}</Text>
            </View>
          </TouchableOpacity>
        );
      });
    return (
      <ScrollView
        style={styles.scroll}
      >
        {list}
      </ScrollView>
    );
  };

  return (
    <View
      style={containerStyle}
      onLayout={handleOnLayout}
      accessible={true}
      accessibilityLabel={buttonText}
      accessibilityLanguage={store.preferences.language || 'en'}
      accessibilityRole={favoriteTrips.length === 0 ? 'button' : 'combobox'}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (favoriteTrips.length === 0) {
            setOpened(false);
            onScheduleTripPress && onScheduleTripPress();
          }
          else {
            setOpened(!opened);
          }
        }}
      >
        <Image
          style={buttonLogoStyle()}
          resizeMode="contain"
          source={require('../../assets/images/logo.png')}
        />
        <Text
          style={styles.buttonLabel}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          adjustsFontSizeToFit
        >{buttonText}</Text>
        <FontAwesomeIcon
          icon="chevron-down"
          style={styles.buttonIcon}
          size={16 * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
        />
      </TouchableOpacity>
      {opened &&
        <View
          style={styles.dropdownContainer}
        >
          {favoriteTripsArrayToList()}
          <Button
            label={translator.t('components.scheduleTripDropdown.buttonLabelLoggedIn')}
            buttonStyle={{
              zIndex: 1005,
            }}
            // width={250}
            onPress={() => {
              setOpened(false);
              onScheduleTripPress && onScheduleTripPress();
            }}
            accessibilityRole="button"
          />
        </View>
      }
    </View>
  );

};

ScheduleTripDropdown.propTypes = {
  loggedIn: PropTypes.bool,
  favoriteTrips: PropTypes.array,
  onScheduleTripPress: PropTypes.func,
  onFavoriteTripPress: PropTypes.func,
  onLayout: PropTypes.func,
};

ScheduleTripDropdown.defaultProps = {
  loggedIn: false,
  favoriteTrips: [],
};

export default ScheduleTripDropdown;
