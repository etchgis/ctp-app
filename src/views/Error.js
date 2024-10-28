import React from 'react';
import {
  StyleSheet, Text, View,
} from 'react-native';
import PropTypes from 'prop-types';
import { Colors, Typography } from '../styles';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 0,
    bottom: 100,
    left: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    opacity: 0.05,
    position: 'absolute',
    top: 200,
    width: 300,
  },
  loadingText: {
    ...Typography.h1,
    color: Colors.white,
  },
});

const Error = ({

}) => {

  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>Error</Text>
    </View>
  );
};

Error.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
  }).isRequired,
};

export default Error;
