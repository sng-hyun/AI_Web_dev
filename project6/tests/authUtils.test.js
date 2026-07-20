import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createSafeAuthError,
  toMinimalAuthUser,
} from '../src/features/auth/authUtils.js'

const firebaseUser = {
  uid: 'user-id',
  displayName: '테스트 사용자',
  email: 'private@example.com',
  photoURL: 'https://example.com/private.png',
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
}

test('Firebase User를 uid와 displayName만 가진 객체로 변환한다', () => {
  assert.deepEqual(toMinimalAuthUser(firebaseUser), {
    uid: 'user-id',
    displayName: '테스트 사용자',
  })
})

test('내부 사용자에서 email을 제외한다', () => {
  assert.equal('email' in toMinimalAuthUser(firebaseUser), false)
})

test('내부 사용자에서 photoURL을 제외한다', () => {
  assert.equal('photoURL' in toMinimalAuthUser(firebaseUser), false)
})

test('내부 사용자에서 token 관련 필드를 제외한다', () => {
  const user = toMinimalAuthUser(firebaseUser)

  assert.equal('accessToken' in user, false)
  assert.equal('refreshToken' in user, false)
})

test('Firebase User 원본 객체를 변경하지 않는다', () => {
  const source = { ...firebaseUser }
  const snapshot = structuredClone(source)

  toMinimalAuthUser(source)

  assert.deepEqual(source, snapshot)
})

test('displayName 앞뒤 공백을 제거한다', () => {
  assert.equal(
    toMinimalAuthUser({ uid: 'user-id', displayName: '  사용자  ' }).displayName,
    '사용자',
  )
})

test('displayName이 없으면 null을 사용한다', () => {
  assert.equal(toMinimalAuthUser({ uid: 'user-id' }).displayName, null)
})

test('유효하지 않은 user 입력은 null로 처리한다', () => {
  assert.equal(toMinimalAuthUser(null), null)
  assert.equal(toMinimalAuthUser([]), null)
  assert.equal(toMinimalAuthUser({ uid: ' ' }), null)
})

test('popup closed 오류를 안전한 메시지로 변환한다', () => {
  assert.equal(
    createSafeAuthError({ code: 'auth/popup-closed-by-user' }).message,
    '로그인 창이 닫혀 로그인이 취소되었습니다.',
  )
})

test('cancelled popup 오류를 안전한 메시지로 변환한다', () => {
  assert.equal(
    createSafeAuthError({ code: 'auth/cancelled-popup-request' }).message,
    '다른 로그인 요청이 진행되어 현재 요청이 취소되었습니다.',
  )
})

test('popup blocked 오류를 안전한 메시지로 변환한다', () => {
  assert.equal(
    createSafeAuthError({ code: 'auth/popup-blocked' }).message,
    '브라우저에서 로그인 팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도해 주세요.',
  )
})

test('network 오류를 안전한 메시지로 변환한다', () => {
  assert.equal(
    createSafeAuthError({ code: 'auth/network-request-failed' }).message,
    '네트워크 문제로 로그인할 수 없습니다. 연결 상태를 확인해 주세요.',
  )
})

test('unauthorized domain 오류를 안전한 메시지로 변환한다', () => {
  assert.equal(
    createSafeAuthError({ code: 'auth/unauthorized-domain' }).message,
    '현재 도메인은 Firebase 로그인 허용 목록에 등록되어 있지 않습니다.',
  )
})

test('operation not allowed 오류를 안전한 메시지로 변환한다', () => {
  assert.equal(
    createSafeAuthError({ code: 'auth/operation-not-allowed' }).message,
    'Firebase에서 Google 로그인이 활성화되어 있지 않습니다.',
  )
})

test('invalid API key 오류를 안전한 메시지로 변환한다', () => {
  assert.equal(
    createSafeAuthError({ code: 'auth/invalid-api-key' }).message,
    'Firebase 인증 설정을 확인해 주세요.',
  )
})

test('알 수 없는 로그인 오류는 기본 메시지를 사용한다', () => {
  assert.deepEqual(createSafeAuthError({ code: 'auth/internal-error' }), {
    code: 'auth/unknown',
    message: 'Google 로그인 중 문제가 발생했습니다. 다시 시도해 주세요.',
  })
})

test('로그아웃 오류는 기본 로그아웃 메시지를 사용한다', () => {
  assert.equal(
    createSafeAuthError({ code: 'auth/network-request-failed' }, 'logout').message,
    '로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  )
})

test('안전한 오류에 원본 오류 객체의 민감 필드를 포함하지 않는다', () => {
  const source = {
    code: 'auth/internal-error',
    email: 'private@example.com',
    credential: { token: 'secret' },
  }
  const result = createSafeAuthError(source)

  assert.notStrictEqual(result, source)
  assert.deepEqual(Object.keys(result), ['code', 'message'])
})
