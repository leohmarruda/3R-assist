import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import pt from '../locales/pt.json'
import en from '../locales/en.json'

i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: {
    useSuspense: false,
  },
})

export function currentLanguage() {
  return (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0]
}

export function setLanguage(lang) {
  return i18n.changeLanguage(lang)
}

export default i18n
