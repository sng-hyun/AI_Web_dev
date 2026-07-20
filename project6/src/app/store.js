import { configureStore } from '@reduxjs/toolkit'

import cartReducer, { restoreCart } from '../features/cart/cartSlice.js'
import {
  loadCartFromStorage,
  saveCartToStorage,
} from '../utils/cartStorage.js'

export function createAppStore(storage) {
  const appStore = configureStore({
    reducer: {
      cart: cartReducer,
    },
  })

  const storedCart = loadCartFromStorage(storage)
  appStore.dispatch(restoreCart(storedCart))

  let previousItems = appStore.getState().cart.items
  const unsubscribe = appStore.subscribe(() => {
    const currentItems = appStore.getState().cart.items

    if (currentItems === previousItems) {
      return
    }

    previousItems = currentItems
    saveCartToStorage(currentItems, storage)
  })

  return { store: appStore, unsubscribe }
}

const browserStore = createAppStore()

export const store = browserStore.store
