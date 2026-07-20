export const REQUIRED_FIREBASE_ENV_KEYS = Object.freeze([
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
])

const CONFIG_FIELDS = Object.freeze([
  ['VITE_FIREBASE_API_KEY', 'apiKey'],
  ['VITE_FIREBASE_AUTH_DOMAIN', 'authDomain'],
  ['VITE_FIREBASE_PROJECT_ID', 'projectId'],
  ['VITE_FIREBASE_STORAGE_BUCKET', 'storageBucket'],
  ['VITE_FIREBASE_MESSAGING_SENDER_ID', 'messagingSenderId'],
  ['VITE_FIREBASE_APP_ID', 'appId'],
])

const EXAMPLE_PLACEHOLDERS = new Set([
  'your_api_key',
  'your_project.firebaseapp.com',
  'your_project_id',
  'your_project.firebasestorage.app',
  'your_sender_id',
  'your_app_id',
])

function normalizeEnvValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isUsableValue(value) {
  return value !== '' && !EXAMPLE_PLACEHOLDERS.has(value.toLocaleLowerCase())
}

export function createFirebaseConfiguration(env = {}) {
  const source = env !== null && typeof env === 'object' ? env : {}
  const config = {}
  const missingKeys = []

  for (const [envKey, configKey] of CONFIG_FIELDS) {
    const value = normalizeEnvValue(source[envKey])
    config[configKey] = value

    if (!isUsableValue(value)) {
      missingKeys.push(envKey)
    }
  }

  return {
    config,
    missingKeys,
    isConfigured: missingKeys.length === 0,
  }
}
