'use client'

export default function ProductList({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No Products Yet</h3>
        <p className="text-gray-500">Add your first product to get started with customer pricing.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Product List</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Base Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.category === 'Premium' 
                      ? 'bg-purple-100 text-purple-800'
                      : product.category === 'Bulk'
                      ? 'bg-blue-100 text-blue-800'
                      : product.category === 'Services'
                      ? 'bg-green-100 text-green-800'
                      : product.category === 'Accessories'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    PKR {parseFloat(product.basePrice).toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {product.minPrice || product.maxPrice ? (
                      <>
                        {product.minPrice ? `PKR ${parseFloat(product.minPrice).toFixed(2)}` : 'No min'}
                        {' - '}
                        {product.maxPrice ? `PKR ${parseFloat(product.maxPrice).toFixed(2)}` : 'No max'}
                      </>
                    ) : (
                      'No limits'
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{product.unit}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-indigo-600 hover:text-indigo-900 transition-colors flex items-center gap-1"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="text-red-600 hover:text-red-900 transition-colors flex items-center gap-1"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile-friendly card view for smaller screens */}
      <div className="md:hidden space-y-4 mt-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{product.name}</h4>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                  product.category === 'Premium' 
                    ? 'bg-purple-100 text-purple-800'
                    : product.category === 'Bulk'
                    ? 'bg-blue-100 text-blue-800'
                    : product.category === 'Services'
                    ? 'bg-green-100 text-green-800'
                    : product.category === 'Accessories'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.category}
                </span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  PKR {parseFloat(product.basePrice).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">per {product.unit}</div>
              </div>
            </div>
            
            {product.description && (
              <p className="text-sm text-gray-600 mb-3">{product.description}</p>
            )}
            
            {(product.minPrice || product.maxPrice) && (
              <div className="text-sm text-gray-500 mb-3">
                Price range: {' '}
                {product.minPrice ? `PKR ${parseFloat(product.minPrice).toFixed(2)}` : 'No min'}
                {' - '}
                {product.maxPrice ? `PKR ${parseFloat(product.maxPrice).toFixed(2)}` : 'No max'}
              </div>
            )}
            
            <div className="flex space-x-4">
              <button
                onClick={() => onEdit(product)}
                className="text-indigo-600 hover:text-indigo-900 transition-colors flex items-center gap-1"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => onDelete(product.id)}
                className="text-red-600 hover:text-red-900 transition-colors flex items-center gap-1"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
