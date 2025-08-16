'use client'
import { useState, useEffect } from 'react'

export default function CustomerPricing({ products, onPricingChange, initialPricing = {} }) {
  const [customPricing, setCustomPricing] = useState({})
  const [expandedProducts, setExpandedProducts] = useState(new Set())

  useEffect(() => {
    // Initialize custom pricing with initial data
    setCustomPricing(initialPricing)
  }, [initialPricing])

  const handlePriceChange = (productId, price) => {
    const newPricing = {
      ...customPricing,
      [productId]: price === '' ? null : parseFloat(price)
    }
    
    setCustomPricing(newPricing)
    onPricingChange(newPricing)
  }

  const toggleProductExpanded = (productId) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedProducts(newExpanded)
  }

  const resetToDefault = (productId) => {
    const newPricing = { ...customPricing }
    delete newPricing[productId]
    setCustomPricing(newPricing)
    onPricingChange(newPricing)
  }

  const getPriceValidation = (product, customPrice) => {
    if (!customPrice) return null
    
    const price = parseFloat(customPrice)
    if (isNaN(price) || price <= 0) {
      return { type: 'error', message: 'Price must be greater than 0' }
    }
    
    if (product.minPrice && price < product.minPrice) {
      return { type: 'error', message: `Price cannot be less than PKR ${product.minPrice}` }
    }
    
    if (product.maxPrice && price > product.maxPrice) {
      return { type: 'error', message: `Price cannot be more than PKR ${product.maxPrice}` }
    }
    
    const basePrice = parseFloat(product.basePrice)
    if (price !== basePrice) {
      const diff = price - basePrice
      const percentDiff = ((diff / basePrice) * 100).toFixed(1)
      return { 
        type: 'info', 
        message: `${diff > 0 ? '+' : ''}${diff.toFixed(2)} (${diff > 0 ? '+' : ''}${percentDiff}%) from default`
      }
    }
    
    return null
  }

  if (products.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600">⚠️</span>
          <p className="text-yellow-800">
            No products available. Please add products first to set customer-specific pricing.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Product Pricing</h3>
        <div className="text-sm text-gray-500">
          {Object.keys(customPricing).filter(key => customPricing[key] !== null).length} custom prices set
        </div>
      </div>

      <div className="space-y-3">
        {products.map((product) => {
          const customPrice = customPricing[product.id]
          const isExpanded = expandedProducts.has(product.id)
          const validation = getPriceValidation(product, customPrice)
          const hasCustomPrice = customPrice !== null && customPrice !== undefined
          
          return (
            <div 
              key={product.id} 
              className={`border rounded-lg transition-all ${
                hasCustomPrice ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              {/* Product Header - Always Visible */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleProductExpanded(product.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg 
                        className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        Default: PKR {parseFloat(product.basePrice).toFixed(2)} per {product.unit}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {hasCustomPrice && (
                      <div className="text-right">
                        <div className="font-medium text-blue-700">
                          PKR {parseFloat(customPrice).toFixed(2)}
                        </div>
                        <div className="text-xs text-blue-600">Custom Price</div>
                      </div>
                    )}
                    
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customPrice || ''}
                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                        placeholder={product.basePrice}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validation?.type === 'error' ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Price Validation Message */}
                {validation && (
                  <div className={`mt-2 text-xs ${
                    validation.type === 'error' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {validation.message}
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t bg-gray-50 p-4 space-y-3">
                  {/* Product Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <span className="ml-2 text-gray-600">{product.category}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Unit:</span>
                      <span className="ml-2 text-gray-600">{product.unit}</span>
                    </div>
                  </div>

                  {/* Price Constraints */}
                  {(product.minPrice || product.maxPrice) && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Price Range:</span>
                      <span className="ml-2 text-gray-600">
                        {product.minPrice ? `PKR ${product.minPrice}` : 'No minimum'} 
                        {' - '}
                        {product.maxPrice ? `PKR ${product.maxPrice}` : 'No maximum'}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {product.description && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="mt-1 text-gray-600">{product.description}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="text-xs text-gray-500">
                      💡 Leave empty to use default price (PKR {product.basePrice})
                    </div>
                    
                    {hasCustomPrice && (
                      <button
                        type="button"
                        onClick={() => resetToDefault(product.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Pricing Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Products with custom pricing:</span>
            <span className="ml-2 font-medium">
              {Object.keys(customPricing).filter(key => customPricing[key] !== null).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Using default pricing:</span>
            <span className="ml-2 font-medium">
              {products.length - Object.keys(customPricing).filter(key => customPricing[key] !== null).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
