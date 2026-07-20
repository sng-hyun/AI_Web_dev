import { useSelector } from 'react-redux'

import { selectCartTotalQuantity } from '../../features/cart/cartSlice.js'

function CartBadge() {
  const totalQuantity = useSelector(selectCartTotalQuantity)

  return (
    <div
      className="cart-badge"
      role="status"
      aria-label={`장바구니 상품 총수량 ${totalQuantity}개`}
    >
      <span>장바구니</span>
      <span className="cart-badge-count" aria-hidden="true">
        {totalQuantity}
      </span>
    </div>
  )
}

export default CartBadge
