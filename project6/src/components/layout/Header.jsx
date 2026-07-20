import CartBadge from '../cart/CartBadge.jsx'
import AuthStatus from '../auth/AuthStatus.jsx'

function Header() {
  return (
    <header className="app-header">
      <div className="app-header-content">
        <div className="app-brand">
          <p className="app-kicker">Simple shopping, clearly organized</p>
          <h1>Project6 Store</h1>
          <p className="app-description">
            상품 탐색과 장바구니 이용 흐름을 간결하게 구성한 쇼핑몰입니다.
          </p>
        </div>

        <div className="app-actions">
          <AuthStatus />
          <CartBadge />
        </div>
      </div>
    </header>
  )
}

export default Header
