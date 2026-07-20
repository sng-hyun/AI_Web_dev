export function getProductCategories(products) {
  if (!Array.isArray(products)) {
    return []
  }

  const categories = products
    .map((product) => product?.category)
    .filter(
      (category) => typeof category === 'string' && category.trim() !== '',
    )

  return [...new Set(categories)].sort((first, second) =>
    first.localeCompare(second, 'en'),
  )
}

export function filterProducts(
  products,
  searchTerm = '',
  selectedCategory = 'all',
) {
  if (!Array.isArray(products)) {
    return []
  }

  const normalizedSearchTerm =
    typeof searchTerm === 'string' ? searchTerm.trim().toLocaleLowerCase() : ''
  const category =
    typeof selectedCategory === 'string' ? selectedCategory : 'all'

  return products.filter((product) => {
    const productName =
      typeof product?.name === 'string' ? product.name.toLocaleLowerCase() : ''
    const matchesSearch = productName.includes(normalizedSearchTerm)
    const matchesCategory =
      category === 'all' || product?.category === category

    return matchesSearch && matchesCategory
  })
}
