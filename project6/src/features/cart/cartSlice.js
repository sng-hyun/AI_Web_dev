import { createSelector, createSlice } from '@reduxjs/toolkit'

export const MIN_CART_QUANTITY = 1
export const MAX_CART_QUANTITY = 99

const initialState = {
  items: [],
}

function normalizeId(id) {
  if (typeof id === 'number' && Number.isFinite(id)) {
    return id
  }

  if (typeof id === 'string' && id.trim() !== '') {
    return id.trim()
  }

  return null
}

function createCartItem(candidate) {
  if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return null
  }

  const id = normalizeId(candidate.id)
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : ''
  const image = typeof candidate.image === 'string' ? candidate.image.trim() : ''
  const isValidPrice =
    typeof candidate.price === 'number' &&
    Number.isFinite(candidate.price) &&
    candidate.price >= 0

  if (id === null || name === '' || image === '' || !isValidPrice) {
    return null
  }

  return {
    id,
    name,
    price: candidate.price,
    image,
    quantity: MIN_CART_QUANTITY,
  }
}

function normalizeQuantity(quantity) {
  if (typeof quantity !== 'number' || !Number.isFinite(quantity)) {
    return MIN_CART_QUANTITY
  }

  const integerQuantity = Math.trunc(quantity)
  return Math.min(
    MAX_CART_QUANTITY,
    Math.max(MIN_CART_QUANTITY, integerQuantity),
  )
}

function restoreCartItems(candidates) {
  if (!Array.isArray(candidates)) {
    return []
  }

  const restoredItems = []

  for (const candidate of candidates) {
    const restoredItem = createCartItem(candidate)
    if (restoredItem === null) {
      continue
    }

    const quantity = normalizeQuantity(candidate.quantity)
    const existingItem = restoredItems.find(
      (item) => item.id === restoredItem.id,
    )

    if (existingItem) {
      existingItem.quantity = Math.min(
        MAX_CART_QUANTITY,
        existingItem.quantity + quantity,
      )
      continue
    }

    restoredItems.push({ ...restoredItem, quantity })
  }

  return restoredItems
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action) {
      const newItem = createCartItem(action.payload)
      if (newItem === null) {
        return
      }

      const existingItem = state.items.find((item) => item.id === newItem.id)
      if (existingItem) {
        if (existingItem.quantity < MAX_CART_QUANTITY) {
          existingItem.quantity += 1
        }
        return
      }

      state.items.push(newItem)
    },
    increaseQuantity(state, action) {
      const id = normalizeId(action.payload)
      const item = state.items.find((candidate) => candidate.id === id)

      if (item && item.quantity < MAX_CART_QUANTITY) {
        item.quantity += 1
      }
    },
    decreaseQuantity(state, action) {
      const id = normalizeId(action.payload)
      const item = state.items.find((candidate) => candidate.id === id)

      if (item && item.quantity > MIN_CART_QUANTITY) {
        item.quantity -= 1
      }
    },
    removeFromCart(state, action) {
      const id = normalizeId(action.payload)
      const itemIndex = state.items.findIndex((item) => item.id === id)

      if (itemIndex !== -1) {
        state.items.splice(itemIndex, 1)
      }
    },
    clearCart(state) {
      state.items = []
    },
    restoreCart(state, action) {
      state.items = restoreCartItems(action.payload)
    },
  },
})

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  restoreCart,
} = cartSlice.actions

export const selectCartItems = (state) => state.cart.items

export const selectCartTotal = createSelector([selectCartItems], (items) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0),
)

export const selectCartTotalQuantity = createSelector(
  [selectCartItems],
  (items) => items.reduce((total, item) => total + item.quantity, 0),
)

export const selectIsCartEmpty = createSelector(
  [selectCartItems],
  (items) => items.length === 0,
)

export function selectCartQuantityByProductId(state, productId) {
  const id = normalizeId(productId)
  return state.cart.items.find((item) => item.id === id)?.quantity ?? 0
}

export const cartReducer = cartSlice.reducer
export default cartSlice.reducer
