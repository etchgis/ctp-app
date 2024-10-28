import React from 'react';
import { LogBox, PixelRatio, Text } from 'react-native';
import { observer } from 'mobx-react';
import RootStore, { StoreProvider } from './src/stores/RootStore';
import { Colors } from './src/styles';
import RootNavigation from './src/navigation';
import startup from './src/services/startup';
import Bugsee from 'react-native-bugsee';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OdpProvider } from './src/models/odp-context';

const App = observer(() => {
  console.log('FONT', PixelRatio.getFontScale());

  const store = new RootStore();

  startup.init(store);

  launchBugsee();

  return (
    <GestureHandlerRootView
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: Colors.white,
      }}>
      <StoreProvider store={store}>
        <OdpProvider>
          <RootNavigation />
        </OdpProvider>
      </StoreProvider>
    </GestureHandlerRootView>
  );
});

async function launchBugsee() {
  let appToken;

  if (Platform.OS === 'ios') {
    appToken = 'fc6bb177-b32a-4d6a-8101-f4ec835e3041';
  } else {
    appToken = '4842397e-3025-44c3-876e-1e64ce927ed9';
  }

  await Bugsee.launch(appToken);
}

export default App;

// LogBox.ignoreLogs([
//   'Sending `tts-start` with no listeners registered.',
//   'Sending `tts-progress` with no listeners registered.',
//   'Sending `tts-finish` with no listeners registered.',
// ]);
LogBox.ignoreAllLogs();
