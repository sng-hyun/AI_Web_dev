import Header from './components/layout/Header.jsx'
import Cart from './components/cart/Cart.jsx'
import ProductCatalog from './components/products/ProductCatalog.jsx'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="store-layout">
        <section
          className="panel products-panel"
          aria-labelledby="products-heading"
        >
          <div className="panel-heading">
            <p className="panel-label">Products</p>
            <h2 id="products-heading">상품 목록</h2>
          </div>
          <ProductCatalog />
        </section>

        <aside className="panel cart-panel" aria-labelledby="cart-heading">
          <div className="panel-heading">
            <p className="panel-label">Cart</p>
            <h2 id="cart-heading">장바구니</h2>
          </div>
          <Cart />
        </aside>
      </main>
    </div>
  )
}

export default App
