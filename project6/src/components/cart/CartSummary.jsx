import { useSelector } from 'react-redux'

import { selectCartTotal } from '../../features/cart/cartSlice.js'
import { formatUsdPrice } from '../../utils/formatCurrency.js'

function CartSummary() {
  const total = useSelector(selectCartTotal)

  return (
    <div className="cart-summary" aria-label="장바구니 예상 총액">
      <div className="cart-summary-row">
        <span>예상 총액</span>
        <strong className="cart-total-value">{formatUsdPrice(total)}</strong>
      </div>
      <p>장바구니 상품 가격과 수량을 기준으로 계산한 예상 합계입니다.</p>
    </div>
  )
}

export default CartSummary
