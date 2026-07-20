import { useDispatch, useSelector } from 'react-redux'

import {
  clearCart,
  selectCartItems,
  selectIsCartEmpty,
} from '../../features/cart/cartSlice.js'
import CartItem from './CartItem.jsx'
import CartSummary from './CartSummary.jsx'

function Cart() {
  const dispatch = useDispatch()
  const items = useSelector(selectCartItems)
  const isEmpty = useSelector(selectIsCartEmpty)

  return (
    <div className="cart">
      {isEmpty ? (
        <p className="cart-empty" role="status">
          장바구니가 비어 있습니다.
        </p>
      ) : (
        <>
          <ul className="cart-list" aria-label="장바구니 상품">
            {items.map((item) => (
              <li key={item.id}>
                <CartItem item={item} />
              </li>
            ))}
          </ul>
          <button
            className="clear-cart-button"
            type="button"
            onClick={() => dispatch(clearCart())}
          >
            전체 비우기
          </button>
        </>
      )}

      <CartSummary />
    </div>
  )
}

export default Cart
