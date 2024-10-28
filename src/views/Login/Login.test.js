import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { toHaveTextContent } from '@testing-library/jest-native';
import { render } from '../../../test-utils';
import Login from './Login';

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: '',
}));

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

expect.extend({ toHaveTextContent });

describe('login', () => {

  // bad API response
  // no username or password
  // invalid username or password
  // valid username or password

  let username = '';
  let password = '';

  test('no username or password', async () => {
    const component = render(<Login/>);
    const { getByText, getByTestId, getByPlaceholderText } = component;

    const button = getByText('Log In');
    const error = getByTestId('login-error-message');

    fireEvent.changeText(getByPlaceholderText('email@domain.com'), username);
    fireEvent.changeText(getByPlaceholderText('enter your password'), password);
    fireEvent.press(button);

    await waitFor(() => {
      expect(error).toBeDefined();
      expect(error.props.children).toBe('Email and password required');
    });
  });

  test('invalid username or password', async () => {
    username = 'jesse@etchgis.com';
    password = 'test12';

    const component = render(<Login/>);
    const { getByText, getByTestId, getByPlaceholderText } = component;

    const button = getByText('Log In');
    const error = getByTestId('login-error-message');

    fireEvent.changeText(getByPlaceholderText('email@domain.com'), username);
    fireEvent.changeText(getByPlaceholderText('enter your password'), password);
    fireEvent.press(button);

    await waitFor(() => {
      expect(error).toBeDefined();
      expect(error.props.children).toBe('Unauthorized');
    });
  });

  test('valid username and password', async () => {
    username = 'jesse@etchgis.com';
    password = 'test123';

    const component = render(<Login/>);
    const { getByText, getByTestId, getByPlaceholderText } = component;

    const button = getByText('Log In');
    const error = getByTestId('login-error-message');

    fireEvent.changeText(getByPlaceholderText('email@domain.com'), username);
    fireEvent.changeText(getByPlaceholderText('enter your password'), password);
    fireEvent.press(button);

    await waitFor(() => {
      expect(error).toBeDefined();
      expect(error.props.children).toBe(undefined);
    });
  });

});
