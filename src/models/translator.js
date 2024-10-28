import { I18n } from 'i18n-js';
import { I18nManager } from 'react-native';

import en from '../../assets/locales/en.json'
import es from '../../assets/locales/es.json';

const i18n = new I18n({
  en,
  es
});

const module = {

  t: (key, config) => i18n.t(key, config),

  configure: (languageTag, isRTL) => {
    I18nManager.forceRTL(isRTL);
    i18n.locale = languageTag;
  },

}

export default module;