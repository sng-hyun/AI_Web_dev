import { useDispatch } from 'react-redux'

import {
  MAX_CART_QUANTITY,
  MIN_CART_QUANTITY,
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
} from '../../features/cart/cartSlice.js'
import { PRODUCT_PLACEHOLDER_IMAGE } from '../../services/productApi.js'
import { formatUsdPrice } from '../../utils/formatCurrency.js'

function handleImageError(event) {
  const image = event.currentTarget

  if (image.dataset.fallbackApplied === 'true') {
    return
  }

  image.dataset.fallbackApplied = 'true'
  image.src = PRODUCT_PLACEHOLDER_IMAGE
}

function CartItem({ item }) {
  const dispatch = useDispatch()
  const itemTotal = item.price * item.quantity

  return (
    <article className="cart-item" data-product-id={item.id}>
      <img
        className="cart-item-image"
        src={item.image}
        alt=""
        width="72"
        height="72"
        loading="lazy"
        onError={handleImageError}
      />

      <div className="cart-item-content">
        <h3>{item.name}</h3>
        <p className="cart-item-unit-price">단가 {formatUsdPrice(item.price)}</p>

        <div className="cart-item-controls">
          <div className="quantity-control" aria-label={`${item.name} 수량`}>
            <button
              className="quantity-button quantity-decrease"
              type="button"
              aria-label={`${item.name} 수량 감소`}
              disabled={item.quantity === MIN_CART_QUANTITY}
              onClick={() => dispatch(decreaseQuantity(item.id))}
            >
              −
            </button>
            <span className="cart-item-quantity-value">{item.quantity}</span>
            <button
              className="quantity-button quantity-increase"
              type="button"
              aria-label={`${item.name} 수량 증가`}
              disabled={item.quantity === MAX_CART_QUANTITY}
              onClick={() => dispatch(increaseQuantity(item.id))}
            >
              +
            </button>
          </div>

          <button
            className="remove-item-button"
            type="button"
            aria-label={`${item.name} 장바구니에서 삭제`}
            onClick={() => dispatch(removeFromCart(item.id))}
          >
            삭제
          </button>
        </div>

        <p className="cart-item-total">
          항목 합계 <strong>{formatUsdPrice(itemTotal)}</strong>
        </p>
      </div>
    </article>
  )
}

export default CartItem
