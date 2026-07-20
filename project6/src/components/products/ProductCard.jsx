import { useDispatch, useSelector } from 'react-redux'

import {
  MAX_CART_QUANTITY,
  addToCart,
  selectCartQuantityByProductId,
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

function ProductCard({ product }) {
  const dispatch = useDispatch()
  const cartQuantity = useSelector((state) =>
    selectCartQuantityByProductId(state, product.id),
  )
  const description = product.description || '상품 설명이 없습니다.'
  const isAtMaximum = cartQuantity === MAX_CART_QUANTITY

  return (
    <article className="product-card" data-product-id={product.id}>
      <div className="product-image-frame">
        <img
          className="product-image"
          src={product.image}
          alt={product.name}
          width="320"
          height="320"
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />
      </div>
      <div className="product-card-body">
        <p className="product-category">{product.category}</p>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">{formatUsdPrice(product.price)}</p>
        <p className="product-description">{description}</p>
        <button
          className="add-to-cart-button"
          type="button"
          aria-label={
            isAtMaximum
              ? `${product.name} 최대 수량 ${MAX_CART_QUANTITY}개`
              : `${product.name} 장바구니에 담기`
          }
          disabled={isAtMaximum}
          onClick={() => dispatch(addToCart(product))}
        >
          {isAtMaximum ? '최대 수량' : '장바구니 담기'}
        </button>
      </div>
    </article>
  )
}

export default ProductCard
