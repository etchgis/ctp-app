import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { toBeOnTheScreen, toBeVisible } from '@testing-library/jest-native';
import { render } from '../../../test-utils';
import Contact from './Contact';

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: '',
}));

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

expect.extend({ toBeOnTheScreen, toBeVisible });

describe('register.contact', () => {

  // invalid phone
  // valid phone

  test('invalid phone', async () => {

    const component = render(<Contact />);
    const { getByPlaceholderText, errorText } = component;

    expect(errorText.get('phone-error-message')).not.toBeOnTheScreen();

    fireEvent.changeText(getByPlaceholderText('Phone *'), '5');

    await waitFor(() => {
      expect(errorText.get('phone-error-message')).toBeOnTheScreen();
    });

    fireEvent.changeText(getByPlaceholderText('Phone *'), '');

    await waitFor(() => {
      expect(errorText.get('phone-error-message')).toBeOnTheScreen();
      expect(errorText.get('phone-error-message')).toBeDefined();
      expect(errorText.get('phone-error-message').props.children).toBe('required');
    });

  });

  test('valid phone', async () => {

    const component = render(<Contact />);
    const { getByPlaceholderText, errorText } = component;

    expect(errorText.get('phone-error-message')).not.toBeOnTheScreen();

    fireEvent.changeText(getByPlaceholderText('Phone *'), '5');

    await waitFor(() => {
      expect(errorText.get('phone-error-message')).toBeOnTheScreen();
      expect(errorText.get('phone-error-message')).toBeDefined();
      expect(errorText.get('phone-error-message').props.children).toBe('required');
    });

    fireEvent.changeText(getByPlaceholderText('Phone *'), '555-555-5555');

    await waitFor(() => {
      expect(errorText.get('phone-error-message')).not.toBeOnTheScreen();
    });

  });

});
