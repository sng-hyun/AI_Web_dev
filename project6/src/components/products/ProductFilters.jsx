function ProductFilters({
  searchTerm,
  onSearchTermChange,
  selectedCategory,
  onCategoryChange,
  categories,
  onReset,
  hasActiveFilters,
}) {
  return (
    <div className="product-filters" aria-label="상품 검색 및 필터">
      <div className="filter-field search-field">
        <label htmlFor="product-search">상품명 검색</label>
        <input
          id="product-search"
          type="search"
          value={searchTerm}
          placeholder="상품명을 검색하세요"
          autoComplete="off"
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
      </div>

      <div className="filter-field category-field">
        <label htmlFor="product-category">카테고리</label>
        <select
          id="product-category"
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="all">전체 카테고리</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          className="reset-filters-button"
          type="button"
          onClick={onReset}
        >
          검색 조건 초기화
        </button>
      )}
    </div>
  )
}

export default ProductFilters
