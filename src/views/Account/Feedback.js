import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PropTypes from 'prop-types';
import translator from '../../models/translator';
import Header from '../../components/Header';
import { Colors, Typography } from '../../styles';
import { deviceMultiplier } from '../../styles/devices';
import { isTablet } from 'react-native-device-info';
import Button from '../../components/Button';
import Popup from '../../components/Popup';
import { Picker } from '@react-native-picker/picker';
import config from '../../config';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import feedback from '../../services/transport/feedback';
import { useStore } from '../../stores/RootStore';

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
  disclaimerLabel: {
    ...Typography.h4,
    marginBottom: 20
  },
  categoryButton: {
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: Colors.secondary2,
    minHeight: 40 * deviceMultiplier,
  },
  categoryLabel: {
    ...Typography.h3,
    color: Colors.primary1,
    marginHorizontal: 5
  },
  categoryLabelIcon: {
    marginHorizontal: 5
  },
  input: {
    borderColor: Colors.primary1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    minHeight: 80 * deviceMultiplier,
  },
  submitButton: {
    marginBottom: 8,
    alignSelf: 'center'
  },
})

const Feedback = ({
  navigation
}) => {

  const store = useStore();
  const [selectedCategory, setSelectedCategory] = useState(config.FEEDBACK.categories[0]);
  const [comment, setComment] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleOnSubmitPress = async () => {
    const accessToken = await store.authentication.fetchAccessToken();
    feedback.add(
      comment,
      'general',
      store.authentication.email,
      store.profile.firstName,
      selectedCategory,
      null,
      null,
      accessToken
    );
    setComment('');
    setSelectedCategory(config.FEEDBACK.categories[0]);
    Alert.alert(
      translator.t('views.account.feedback.alert.title'),
      translator.t('views.account.feedback.alert.message'),
      [
        {
          text: translator.t('views.account.feedback.alert.buttons.dismiss'),
          style: 'default',
          onPress: () => {
            navigation.pop();
          },
        }
      ]
    );
  }

  return (
    <>

      <View
        style={styles.container}
      >
        <Header
          title={translator.t('views.account.feedback.header')}
          onBackPress={() => {
            navigation.pop();
          }}
          backLabel={translator.t('global.backLabel', { to: translator.t('views.account.menu.header') })}
        />
        <View
          style={styles.content}
        >
          <Text
            style={styles.disclaimerLabel}
          >{translator.t('views.account.feedback.disclaimer')}</Text>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => {
              setShowCategoryPicker(true);
            }}
          >
            <Text
              style={styles.categoryLabel}
            >{translator.t(`views.account.feedback.categories.${selectedCategory}`)}</Text>
            <FontAwesomeIcon
              icon="chevron-down"
              style={styles.categoryLabelIcon}
              color={Colors.primary1}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={translator.t('views.account.feedback.inputPlaceholder')}
            multiline
            numberOfLines={10}
            value={comment}
            onChangeText={(text) => setComment(text)}
          />
          <Button
            width={(isTablet() ? '50%' : '100%')}
            label={translator.t('global.submitLabel')}
            buttonStyle={styles.submitButton}
            onPress={handleOnSubmitPress}
          />
        </View>
      </View>

      <Popup
        title={translator.t('views.account.feedback.popUpTitle')}
        titleStyle={{
          marginBottom: 20,
          fontWeight: 'bold'
        }}
        label={translator.t(`views.account.feedback.categories.${selectedCategory}`)}
        labelStyle={{
          marginBottom: 0,
          ...Typography.h2,
          color: Colors.primary1,
        }}
        show={showCategoryPicker}
        onClosePress={() => {
          setShowCategoryPicker(false);
        }}
      >
        <Picker
          style={{
            width: '100%',
          }}
          selectedValue={selectedCategory}
          onValueChange={(value) => {
            setSelectedCategory(value);
          }}>
          {config.FEEDBACK.categories.map((c) => {
            return (
              <Picker.Item
                key={c}
                label={translator.t(`views.account.feedback.categories.${c}`)}
                value={c}
              />
            );
          })}
        </Picker>
      </Popup>

    </>
  );

}

Feedback.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    pop: PropTypes.func,
  }).isRequired,
};

export default Feedback;