import { useAuth } from '../../features/auth/useAuth.js'

function AuthStatus() {
  const {
    user,
    isAuthLoading,
    isAuthPending,
    authError,
    isAuthAvailable,
    loginWithGoogle,
    logout,
  } = useAuth()

  if (isAuthLoading) {
    return (
      <div className="auth-status auth-loading" role="status" aria-live="polite">
        인증 상태를 확인하는 중입니다.
      </div>
    )
  }

  if (!isAuthAvailable) {
    return (
      <div className="auth-status auth-unavailable">
        <p role="alert">
          {authError?.message ?? 'Firebase 인증 설정을 확인해 주세요.'}
        </p>
      </div>
    )
  }

  return (
    <div className="auth-status">
      <div className="auth-status-row">
        <span className="auth-state">{user ? '로그인됨' : '로그인하지 않음'}</span>
        {user ? (
          <button
            className="auth-button logout-button"
            type="button"
            disabled={isAuthPending}
            onClick={() => void logout()}
          >
            {isAuthPending ? '로그아웃 중...' : '로그아웃'}
          </button>
        ) : (
          <button
            className="auth-button login-button"
            type="button"
            disabled={isAuthPending}
            onClick={() => void loginWithGoogle()}
          >
            {isAuthPending ? '로그인 중...' : 'Google로 로그인'}
          </button>
        )}
      </div>

      {authError && <p className="auth-error" role="alert">{authError.message}</p>}
    </div>
  )
}

export default AuthStatus
