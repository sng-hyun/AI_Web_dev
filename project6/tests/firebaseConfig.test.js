import assert from 'node:assert/strict'
import test from 'node:test'

import {
  REQUIRED_FIREBASE_ENV_KEYS,
  createFirebaseConfiguration,
} from '../src/utils/firebaseConfig.js'

const validEnv = Object.freeze({
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-project.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
  VITE_FIREBASE_APP_ID: 'test-app-id',
})

test('6개 설정값이 모두 있으면 configured 상태다', () => {
  const result = createFirebaseConfiguration(validEnv)

  assert.equal(result.isConfigured, true)
  assert.deepEqual(result.missingKeys, [])
})

test('API key를 apiKey로 매핑한다', () => {
  assert.equal(createFirebaseConfiguration(validEnv).config.apiKey, 'test-api-key')
})

test('authDomain을 매핑한다', () => {
  assert.equal(
    createFirebaseConfiguration(validEnv).config.authDomain,
    'test-project.firebaseapp.com',
  )
})

test('projectId를 매핑한다', () => {
  assert.equal(createFirebaseConfiguration(validEnv).config.projectId, 'test-project')
})

test('storageBucket을 매핑한다', () => {
  assert.equal(
    createFirebaseConfiguration(validEnv).config.storageBucket,
    'test-project.firebasestorage.app',
  )
})

test('messagingSenderId를 매핑한다', () => {
  assert.equal(
    createFirebaseConfiguration(validEnv).config.messagingSenderId,
    'test-sender-id',
  )
})

test('appId를 매핑한다', () => {
  assert.equal(createFirebaseConfiguration(validEnv).config.appId, 'test-app-id')
})

test('누락된 변수 이름을 반환한다', () => {
  const { VITE_FIREBASE_PROJECT_ID: _removed, ...incompleteEnv } = validEnv
  const result = createFirebaseConfiguration(incompleteEnv)

  assert.deepEqual(result.missingKeys, ['VITE_FIREBASE_PROJECT_ID'])
})

test('빈 문자열은 누락으로 처리한다', () => {
  const result = createFirebaseConfiguration({
    ...validEnv,
    VITE_FIREBASE_APP_ID: '   ',
  })

  assert.equal(result.isConfigured, false)
  assert.deepEqual(result.missingKeys, ['VITE_FIREBASE_APP_ID'])
})

test('설정값 앞뒤 공백을 제거한다', () => {
  const result = createFirebaseConfiguration({
    ...validEnv,
    VITE_FIREBASE_PROJECT_ID: '  test-project  ',
  })

  assert.equal(result.config.projectId, 'test-project')
})

test('example placeholder를 유효하지 않게 처리한다', () => {
  const result = createFirebaseConfiguration({
    ...validEnv,
    VITE_FIREBASE_API_KEY: 'your_api_key',
  })

  assert.deepEqual(result.missingKeys, ['VITE_FIREBASE_API_KEY'])
})

test('입력 환경 변수 객체를 변경하지 않는다', () => {
  const env = { ...validEnv }
  const snapshot = structuredClone(env)

  createFirebaseConfiguration(env)

  assert.deepEqual(env, snapshot)
})

test('반환 config에 불필요한 환경 변수를 포함하지 않는다', () => {
  const result = createFirebaseConfiguration({
    ...validEnv,
    VITE_UNUSED_VALUE: 'unused',
  })

  assert.deepEqual(Object.keys(result.config), [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ])
})

test('example placeholder만으로는 configured가 아니다', () => {
  const placeholders = Object.fromEntries(
    REQUIRED_FIREBASE_ENV_KEYS.map((key) => [key, `your_${key.toLowerCase()}`]),
  )
  placeholders.VITE_FIREBASE_API_KEY = 'your_api_key'
  placeholders.VITE_FIREBASE_AUTH_DOMAIN = 'your_project.firebaseapp.com'
  placeholders.VITE_FIREBASE_PROJECT_ID = 'your_project_id'
  placeholders.VITE_FIREBASE_STORAGE_BUCKET =
    'your_project.firebasestorage.app'
  placeholders.VITE_FIREBASE_MESSAGING_SENDER_ID = 'your_sender_id'
  placeholders.VITE_FIREBASE_APP_ID = 'your_app_id'

  const result = createFirebaseConfiguration(placeholders)

  assert.equal(result.isConfigured, false)
  assert.deepEqual(result.missingKeys, REQUIRED_FIREBASE_ENV_KEYS)
})
