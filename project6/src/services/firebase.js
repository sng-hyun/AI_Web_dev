import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

import { createFirebaseConfiguration } from '../utils/firebaseConfig.js'

const configuration = createFirebaseConfiguration(import.meta.env)

let authInstance = null
let configurationError = null

if (configuration.isConfigured) {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(configuration.config)
    authInstance = getAuth(app)
  } catch {
    configurationError = {
      code: 'firebase/initialization-failed',
      message: 'Firebase 인증 설정을 확인해 주세요.',
    }
  }
} else {
  configurationError = {
    code: 'firebase/configuration-missing',
    message: 'Firebase 인증 설정을 확인해 주세요.',
  }
}

export const isFirebaseConfigured = authInstance !== null
export const firebaseConfigurationError = configurationError

export function getFirebaseAuth() {
  return authInstance
}
