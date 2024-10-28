/**
 * The module reads voice messages and controls volume.
 * @module voice
 */

import Tts from 'react-native-tts';
import { Devices } from '../styles';

const voice = {

  /**
   * Voice volume as a float.
   */
  volume: 1,

  /**
   * Options are different for Android and iOS
   */
  options: Devices.isIphone
    ? {
      iosVoiceId: 'com.apple.ttsbundle.siri_Nicky_en-US_compact',
      rate: 0.5,
    } : {
      androidParams: {
        KEY_PARAM_PAN: -1,
        KEY_PARAM_VOLUME: 1,
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
      },
    },

  /**
   * This must be called before any voice features are used.
   */
  init: async () => {
    Tts.getInitStatus().then(() => {
      console.log('audio initialized');
      Tts.setDucking(true);
    });

    // Tts.addEventListener('tts-start', (event) => console.log('start', event));
    // Tts.addEventListener('tts-progress', (event) => console.log('progress', event));
    // Tts.addEventListener('tts-finish', (event) => console.log('finish', event));
    // Tts.addEventListener('tts-cancel', (event) => console.log('cancel', event));
  },

  /**
   * Called as app is closing.
   */
  shutdown: () => {
    /*
    Spokestack.removeAllListeners();
    */
  },

  /**
   * Speak the given text.
   * @param {String} utterance - the content to speak.
   * @param {Function} errFn - Called as errors occur.
   * @returns {Promise} When speech completes or fails.
   */
  speak: async (utterance, overrideLastSpeech = false) => {
    console.log(voice.lastSpeech, utterance, overrideLastSpeech);
    if (voice.lastSpeech === utterance && !overrideLastSpeech) {
      return;
    }
    voice.lastSpeech = utterance;
    if (voice.volume > 0) {
      return await Tts.speak(utterance, module.options);
    }
  },

  /**
   * Cancel any current speaking.
   */
  stop: () => {
    Tts.stop();
  },

  setVolume: (volume) => {
    voice.volume = volume;
  },

  setLanguage: (language) => {
    Tts.setDefaultLanguage(`${language}-US`);
  }

};

export default voice;
