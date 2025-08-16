'use client'
import { useEffect, useState } from 'react'
import ProductForm from '../../components/ProductForm'
import ProductList from '../../components/ProductList'
import DashboardCard from '../../components/DashboardCard'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState(null)

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = async (productData) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Product created successfully:', result)
        
        // Refresh the products list from the database
        await fetchProducts()
        alert('Product added successfully!')
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Failed to add product: ' + error.message)
    }
  }

  const handleUpdateProduct = async (id, productData) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      })
      
      if (response.ok) {
        setProducts(prev => prev.map(product => 
          product.id === id ? { ...product, ...productData } : product
        ))
        setEditingProduct(null)
      }
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        console.log('Deleting product with ID:', id)
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE'
        })
        
        console.log('Delete response status:', response.status)
        
        if (response.ok) {
          console.log('Product deleted successfully, updating UI')
          setProducts(prev => prev.filter(product => product.id !== id))
        } else {
          const errorData = await response.json()
          console.error('Delete failed:', errorData)
          alert(`Failed to delete product: ${errorData.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Error deleting product. Please try again.')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
        <div className="text-sm text-gray-500">
          Total Products: {products.length}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Total Products"
          value={products.length}
          icon="📦"
          color="blue"
        />
        <DashboardCard
          title="Average Price"
          value={products.length > 0 ? `PKR ${(products.reduce((sum, p) => sum + parseFloat(p.basePrice || 0), 0) / products.length).toFixed(2)}` : 'PKR 0'}
          icon="💰"
          color="green"
        />
        <DashboardCard
          title="Categories"
          value={[...new Set(products.map(p => p.category))].length}
          icon="📋"
          color="purple"
        />
      </div>

      {/* Add/Edit Product Form */}
      <div className="bg-white rounded-lg shadow-md">
        <ProductForm
          onSubmit={editingProduct ? 
            (data) => handleUpdateProduct(editingProduct.id, data) : 
            handleAddProduct
          }
          initialData={editingProduct}
          isEditing={!!editingProduct}
          onCancel={() => setEditingProduct(null)}
        />
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-md">
        <ProductList
          products={products}
          onEdit={setEditingProduct}
          onDelete={handleDeleteProduct}
        />
      </div>
    </div>
  )
}
