export const CART_STORAGE_KEY = 'project6.cart.v1'

function getBrowserStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function loadCartFromStorage(storage = getBrowserStorage()) {
  try {
    if (storage === null || typeof storage?.getItem !== 'function') {
      return []
    }

    const serializedCart = storage.getItem(CART_STORAGE_KEY)
    return serializedCart === null ? [] : JSON.parse(serializedCart)
  } catch {
    return []
  }
}

export function saveCartToStorage(items, storage = getBrowserStorage()) {
  try {
    if (!Array.isArray(items) || typeof storage?.setItem !== 'function') {
      return false
    }

    const cartItems = items.map(({ id, name, price, image, quantity }) => ({
      id,
      name,
      price,
      image,
      quantity,
    }))

    storage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
    return true
  } catch {
    return false
  }
}
