const LOGIN_ERROR_MESSAGES = Object.freeze({
  'auth/popup-closed-by-user': '로그인 창이 닫혀 로그인이 취소되었습니다.',
  'auth/cancelled-popup-request':
    '다른 로그인 요청이 진행되어 현재 요청이 취소되었습니다.',
  'auth/popup-blocked':
    '브라우저에서 로그인 팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도해 주세요.',
  'auth/network-request-failed':
    '네트워크 문제로 로그인할 수 없습니다. 연결 상태를 확인해 주세요.',
  'auth/unauthorized-domain':
    '현재 도메인은 Firebase 로그인 허용 목록에 등록되어 있지 않습니다.',
  'auth/operation-not-allowed':
    'Firebase에서 Google 로그인이 활성화되어 있지 않습니다.',
  'auth/invalid-api-key': 'Firebase 인증 설정을 확인해 주세요.',
})

const DEFAULT_LOGIN_ERROR_MESSAGE =
  'Google 로그인 중 문제가 발생했습니다. 다시 시도해 주세요.'
const DEFAULT_LOGOUT_ERROR_MESSAGE =
  '로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.'
const DEFAULT_AUTH_STATE_ERROR_MESSAGE =
  '인증 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'

export function toMinimalAuthUser(firebaseUser) {
  if (
    firebaseUser === null ||
    typeof firebaseUser !== 'object' ||
    Array.isArray(firebaseUser)
  ) {
    return null
  }

  const uid =
    typeof firebaseUser.uid === 'string' ? firebaseUser.uid.trim() : ''
  if (uid === '') {
    return null
  }

  const displayName =
    typeof firebaseUser.displayName === 'string' &&
    firebaseUser.displayName.trim() !== ''
      ? firebaseUser.displayName.trim()
      : null

  return { uid, displayName }
}

export function createSafeAuthError(error, operation = 'login') {
  const originalCode = typeof error?.code === 'string' ? error.code : ''
  const isKnownLoginCode = Object.hasOwn(LOGIN_ERROR_MESSAGES, originalCode)
  const code = isKnownLoginCode ? originalCode : 'auth/unknown'

  let message = LOGIN_ERROR_MESSAGES[originalCode] ?? DEFAULT_LOGIN_ERROR_MESSAGE
  if (operation === 'logout') {
    message = DEFAULT_LOGOUT_ERROR_MESSAGE
  } else if (operation === 'state') {
    message = DEFAULT_AUTH_STATE_ERROR_MESSAGE
  }

  return { code, message }
}
