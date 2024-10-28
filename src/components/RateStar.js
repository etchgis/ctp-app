/**
 * Provides a 5-star rating component.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
// import { View, Button, Icon } from 'native-base';
import { Colors } from '../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  starButton: {
    height: 'auto',
    marginHorizontal: 6,
  },
  starIcon: {
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
});

const RateStar = ({
  rating,
  fontSize,
  onRatingChange
}) => {

  const _fontSize = fontSize || 24;

  const handleStarPress = (value) => {
    if (onRatingChange) {
      onRatingChange(value);
    }
  }

  return (
    <View style={styles.bar}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity
          key={i}
          icon
          transparent
          onPress={() => { handleStarPress(i); }}
          style={styles.starButton}
        >
          <FontAwesomeIcon
            icon="star"
            size={_fontSize}
            style={[
              styles.starIcon,
              {
                color: i <= rating ? Colors.primary1 : '#cccccc'
              }
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>

  );

};

RateStar.defaultProps = {
  rating: -1,
  fontSize: null,
  onRatingChange: null,
};
RateStar.propTypes = {
  rating: PropTypes.number,
  fontSize: PropTypes.number,
  onRatingChange: PropTypes.func,
};

export default RateStar;