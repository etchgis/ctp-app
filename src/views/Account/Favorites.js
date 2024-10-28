import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Colors, Typography } from '../../styles';
import Header from '../../components/Header';
import { useStore } from '../../stores/RootStore';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useFontScale } from '../../utils/fontScaling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import config from '../../config';
import { deviceMultiplier } from '../../styles/devices';
import { isTablet } from 'react-native-device-info';
import translator from '../../models/translator';

const styles = StyleSheet.create({
  container: {
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
  },
  favoritesTitle: {
    ...Typography.h3,
    marginBottom: 7,
    marginTop: 25,
  },
  deleteTitle: {
    ...Typography.h3,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
});

const Favorites = observer(({
  navigation,
}) => {
  const store = useStore();
  const currentFontScale = useFontScale();
  const insets = useSafeAreaInsets();

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState(null);
  const [favoriteType, setFavoriteType] = useState(null);

  const deletePress = (favorite, type) => {
    setFavoriteType(type);
    setSelectedFavorite(favorite);
    setShowConfirmDelete(true);
  };

  const confirmDeletePress = () => {
    if (favoriteType === 'location') {
      store.favorites.removeLocation(selectedFavorite.id);
    }
    else if (favoriteType === 'trip') {
      store.favorites.removeTrip(selectedFavorite.id);
    }
    setFavoriteType(null);
    setSelectedFavorite(null);
    setShowConfirmDelete(false);
  };

  const cancelDeletePress = () => {
    setFavoriteType(null);
    setSelectedFavorite(null);
    setShowConfirmDelete(false);
  };

  const favoritesArrayToCards = () => {
    const locations =
      (store.favorites.locations || []).map((l) => {
        return (
          <View
            key={l.id}
            style={styles.card}>
            <View
              style={styles.cardLeft}
            >
              <Text
                style={styles.cardTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{l.alias}</Text>
              <Text
                style={styles.cardText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{l.title}</Text>
              <Text
                style={styles.cardText}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{l.description}</Text>
            </View>
            <View
              style={styles.cardRight}
            >
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  deletePress(l, 'location');
                }}
                accessibilityLabel={translator.t('views.account.favorites.delete', { type: 'favorite location' })}
                accessibilityLanguage={store.preferences.language || 'en'}
              >
                <FontAwesomeIcon
                  icon="trash"
                  size={16 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                  color={Colors.danger}
                />
              </TouchableOpacity>
            </View>
          </View>
        );
      });
    const trips = (
      (store.favorites.trips || []).map((t) => {
        return (
          <View
            key={t.id}
            style={styles.card}>
            <View
              style={styles.cardLeft}
            >
              <Text
                style={styles.cardTitle}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{t.alias}</Text>
              <View style={styles.row}>
                <Text
                  style={styles.cardText}
                  numberOfLines={1}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{t.origin.alias || t.origin.text}</Text>
                <FontAwesomeIcon
                  icon="arrow-right"
                  size={12 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                  style={{ marginHorizontal: 8 }}
                />
                <Text
                  style={styles.cardText}
                  numberOfLines={1}
                  maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                >{t.destination.alias || t.destination.text}</Text>
              </View>
            </View>
            <View
              style={styles.cardRight}
            >
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  deletePress(t, 'trip');
                }}
                accessibilityLabel={translator.t('views.account.favorites.delete', { type: 'favorite trip' })}
                accessibilityLanguage={store.preferences.language || 'en'}
              >
                <FontAwesomeIcon
                  icon="trash"
                  size={16 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
                  color={Colors.danger}
                />
              </TouchableOpacity>
            </View>
          </View>
        );
      })
    );
    return (
      <ScrollView
        style={{
          marginBottom: insets.bottom,
        }}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      >
        {store.favorites.locations.length > 0 &&
          <>
            <Text
              style={styles.favoritesTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.favorites.locations')}</Text>
            {locations}
          </>
        }
        {store.favorites.trips.length > 0 &&
          <>
            <Text
              style={styles.favoritesTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.favorites.trips')}</Text>
            {trips}
          </>
        }
      </ScrollView>
    );
  };

  return (
    <>
      <View
        style={styles.container}
      >
        <Header
          title={translator.t('views.account.favorites.header')}
          onBackPress={() => {
            navigation.pop();
          }}
          backLabel={translator.t('global.backLabel', { to: translator.t('views.account.menu.header') })}
        />
        <View style={styles.content}>

          {favoritesArrayToCards()}

        </View>

      </View>

      <Modal
        show={showConfirmDelete}
        height={isTablet() ? 250 : 200}
      >
        <Text
          style={styles.deleteTitle}
        >{translator.t('views.account.favorites.deleteConfirm', { type: translator.t(`global.${favoriteType}`) })}</Text>
        <Button
          label={translator.t('global.deleteLabel')}
          width={150}
          onPress={confirmDeletePress}
          buttonStyle={{
            alignSelf: 'center'
          }}
        />
        <Button
          label={translator.t('global.cancelLabel')}
          width={150}
          buttonStyle={{
            backgroundColor: Colors.white,
            borderColor: Colors.white,
            alignSelf: 'center'
          }}
          labelStyle={{
            color: Colors.primary1,
          }}
          onPress={cancelDeletePress}
        />
      </Modal>

    </>
  );
});

Favorites.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    pop: PropTypes.func,
  }).isRequired,
};

export default Favorites;
