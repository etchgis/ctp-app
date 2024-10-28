import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Colors, Typography } from '../../styles';
import Header from '../../components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import config from '../../config';
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
  termsTitle: {
    ...Typography.h4,
    color: Colors.primary1,
    marginTop: 20,
    marginBottom: 10,
  },
  termsText: {
    ...Typography.h5
  }
});

const TermsAndConditions = observer(({
  navigation,
}) => {

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Header
        title={translator.t('views.account.termsAndConditions.header')}
        onBackPress={() => {
          navigation.pop();
        }}
        backLabel={translator.t('global.backLabel', { to: translator.t('views.account.menu.header') })}
      />
      <View style={styles.content}>

        <ScrollView
          keyboardShouldPersistTaps="always"
          style={{
            marginBottom: insets.bottom,
          }}
          contentContainerStyle={{
            paddingBottom: 100,
          }}
        >
          <Pressable>
            <Text
              style={styles.termsText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.headerText')}</Text>
            <Text
              style={styles.termsTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.availability')}</Text>
            <Text
              style={styles.termsText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.availabilityText')}</Text>
            <Text
              style={styles.termsTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.liability')}</Text>
            <Text
              style={styles.termsText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.liabilityText')}</Text>
            <Text
              style={styles.termsTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.privacy')}</Text>
            <Text
              style={styles.termsText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.privacyText')}</Text>
            <Text
              style={styles.termsTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.changesToApp')}</Text>
            <Text
              style={styles.termsText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.changesToAppText')}</Text>
            <Text
              style={styles.termsTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.ownership')}</Text>
            <Text
              style={styles.termsText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.ownershipText')}</Text>
            <Text
              style={styles.termsTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.liabilityLimitation')}</Text>
            <Text
              style={styles.termsText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.liabilityLimitationText')}</Text>
            <Text
              style={styles.termsTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.disclaimer')}</Text>
            <Text
              style={styles.termsText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.disclaimerText')}</Text>
            <Text
              style={styles.termsTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.indemnification')}</Text>
            <Text
              style={styles.termsText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.indemnificationText')}</Text>
            <Text
              style={styles.termsTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.miscellaneous')}</Text>
            <Text
              style={styles.termsText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.miscellaneousText')}</Text>
            <Text
              style={styles.termsTitle}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.changesToTerms')}</Text>
            <Text
              style={styles.termsText}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE}
            >{translator.t('views.account.termsAndConditions.changesToTermsText')}</Text>
          </Pressable>
        </ScrollView>

      </View>

    </View>
  );
});

TermsAndConditions.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    pop: PropTypes.func,
  }).isRequired,
};

export default TermsAndConditions;
