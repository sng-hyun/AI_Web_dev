import ProductCard from './ProductCard.jsx'

function ProductList({ products }) {
  return (
    <ul className="product-grid" aria-label="상품">
      {products.map((product) => (
        <li className="product-grid-item" key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}

export default ProductList
