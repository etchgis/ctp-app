import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { toBeOnTheScreen } from '@testing-library/jest-native';
import { render } from '../../../test-utils';
import Caretaker from './Caretaker';

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: '',
}));

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

expect.extend({ toBeOnTheScreen });

describe('register.caregiver', () => {
  // press next with no address
  // enter only one input
  // enter all information

  test('press next with no caretaker', async () => {

    const component = render(<Caretaker/>);
    const { getByText, errorText } = component;

    const button = getByText('Next');

    expect(errorText.get('first-name-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('last-name-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('email-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('phone-error-message')).not.toBeOnTheScreen();

    fireEvent.press(button);

    await waitFor(() => {
      expect(errorText.get('first-name-error-message')).toBeOnTheScreen();
      expect(errorText.get('first-name-error-message').props.children).toBe('invalid first name');

      expect(errorText.get('last-name-error-message')).toBeOnTheScreen();
      expect(errorText.get('last-name-error-message').props.children).toBe('invalid last name');

      expect(errorText.get('email-error-message')).toBeOnTheScreen();
      expect(errorText.get('email-error-message').props.children).toBe('invalid email');

      expect(errorText.get('phone-error-message')).toBeOnTheScreen();
      expect(errorText.get('phone-error-message').props.children).toBe('invalid phone');
    });

  });

  test('invalid then valid first name', async () => {

    const component = render(<Caretaker/>);
    const { getByText, getByPlaceholderText, errorText } = component;

    const button = getByText('Next');

    expect(errorText.get('first-name-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('last-name-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('email-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('phone-error-message')).not.toBeOnTheScreen();

    fireEvent.press(button);

    await waitFor(() => {
      expect(errorText.get('first-name-error-message')).toBeOnTheScreen();
      expect(errorText.get('first-name-error-message').props.children).toBe('invalid first name');
    });

    fireEvent.changeText(getByPlaceholderText('First Name'), 'Darci');

    await waitFor(() => {
      expect(errorText.get('first-name-error-message')).not.toBeOnTheScreen();
    });

  });

  test('invalid then valid last name', async () => {

    const component = render(<Caretaker/>);
    const { getByText, getByPlaceholderText, errorText } = component;

    const button = getByText('Next');

    expect(errorText.get('first-name-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('last-name-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('email-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('phone-error-message')).not.toBeOnTheScreen();

    fireEvent.press(button);

    await waitFor(() => {
      expect(errorText.get('last-name-error-message')).toBeOnTheScreen();
      expect(errorText.get('last-name-error-message').props.children).toBe('invalid last name');
    });

    fireEvent.changeText(getByPlaceholderText('Last Name'), 'Darci');

    await waitFor(() => {
      expect(errorText.get('last-name-error-message')).not.toBeOnTheScreen();
    });

  });

  test('invalid then valid email', async () => {

    const component = render(<Caretaker/>);
    const { getByText, getByPlaceholderText, errorText } = component;

    const button = getByText('Next');

    expect(errorText.get('first-name-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('last-name-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('email-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('phone-error-message')).not.toBeOnTheScreen();

    fireEvent.press(button);

    await waitFor(() => {
      expect(errorText.get('email-error-message')).toBeOnTheScreen();
      expect(errorText.get('email-error-message').props.children).toBe('invalid email');
    });

    fireEvent.changeText(getByPlaceholderText('Email'), 'darcieiseman@gmail');

    await waitFor(() => {
      expect(errorText.get('email-error-message')).toBeOnTheScreen();
      expect(errorText.get('email-error-message').props.children).toBe('invalid email');
    });

    fireEvent.changeText(getByPlaceholderText('Email'), 'darcieiseman@gmail.com');

    await waitFor(() => {
      expect(errorText.get('email-error-message')).not.toBeOnTheScreen();
    });

  });

  test('invalid then valid phone', async () => {

    const component = render(<Caretaker/>);
    const { getByText, getByPlaceholderText, errorText } = component;

    const button = getByText('Next');

    expect(errorText.get('first-name-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('last-name-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('email-error-message')).not.toBeOnTheScreen();
    expect(errorText.get('phone-error-message')).not.toBeOnTheScreen();

    fireEvent.press(button);

    await waitFor(() => {
      expect(errorText.get('phone-error-message')).toBeOnTheScreen();
      expect(errorText.get('phone-error-message').props.children).toBe('invalid phone');
    });

    fireEvent.changeText(getByPlaceholderText('Phone'), '513-305-340');

    await waitFor(() => {
      expect(errorText.get('phone-error-message')).toBeOnTheScreen();
      expect(errorText.get('phone-error-message').props.children).toBe('invalid phone');
    });

    fireEvent.changeText(getByPlaceholderText('Phone'), '513-305-3408');

    await waitFor(() => {
      expect(errorText.get('phone-error-message')).not.toBeOnTheScreen();
    });

  });

});
