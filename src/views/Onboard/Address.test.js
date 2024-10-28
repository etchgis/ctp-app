import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { toBeOnTheScreen } from '@testing-library/jest-native';
import { render } from '../../../test-utils';
import Address from './Address';

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: '',
}));

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

expect.extend({ toBeOnTheScreen });

describe('register.address', () => {
  // press next with no address

  test('press next with no address', async () => {

    const component = render(<Address />);
    const { getByText, errorText } = component;

    const button = getByText('Next');

    expect(errorText.getByTestId('address-error-message')).not.toBeOnTheScreen();

    fireEvent.press(button);

    await waitFor(() => {
      expect(errorText.getByTestId('address-error-message')).toBeOnTheScreen();
    });

  });

});
