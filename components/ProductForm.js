'use client'
import { useState, useEffect } from 'react'

export default function ProductForm({ onSubmit, initialData = null, isEditing = false, onCancel = null }) {
  const [formData, setFormData] = useState({
    name: '',
    basePrice: '',
    category: 'standard',
    description: '',
    unit: 'piece',
    minPrice: '',
    maxPrice: ''
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        basePrice: initialData.basePrice || '',
        category: initialData.category || 'standard',
        description: initialData.description || '',
        unit: initialData.unit || 'piece',
        minPrice: initialData.minPrice || '',
        maxPrice: initialData.maxPrice || ''
      })
    }
  }, [initialData])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      newErrors.basePrice = 'Base price must be greater than 0'
    }

    if (formData.minPrice && parseFloat(formData.minPrice) < 0) {
      newErrors.minPrice = 'Minimum price cannot be negative'
    }

    if (formData.maxPrice && parseFloat(formData.maxPrice) < 0) {
      newErrors.maxPrice = 'Maximum price cannot be negative'
    }

    if (formData.minPrice && formData.maxPrice && 
        parseFloat(formData.minPrice) > parseFloat(formData.maxPrice)) {
      newErrors.maxPrice = 'Maximum price must be greater than minimum price'
    }

    if (formData.minPrice && parseFloat(formData.minPrice) > parseFloat(formData.basePrice)) {
      newErrors.minPrice = 'Minimum price cannot be greater than base price'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Convert price fields to numbers
      const submitData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
        maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null
      }
      
      await onSubmit(submitData)
      
      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          name: '',
          basePrice: '',
          category: 'Standard',
          description: '',
          unit: 'piece',
          minPrice: '',
          maxPrice: ''
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const categories = [
    'standard',
    'premium',
    'other'
  ]

  const units = [
    'piece',
    'liter',
    'gallon',
    'bottle',
    'case'
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? '✏️ Edit Product' : '➕ Add New Product'}
        </h2>
        {isEditing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., 19L Water Bottle"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price (PKR) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.basePrice}
              onChange={(e) => handleInputChange('basePrice', e.target.value)}
              placeholder="25.00"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.basePrice ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
            <p className="text-gray-500 text-xs mt-1">This will be the default price for new customers</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Range (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Price (PKR)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.minPrice}
              onChange={(e) => handleInputChange('minPrice', e.target.value)}
              placeholder="20.00"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.minPrice ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.minPrice && <p className="text-red-500 text-sm mt-1">{errors.minPrice}</p>}
            <p className="text-gray-500 text-xs mt-1">Optional: Set minimum allowed custom price</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Price (PKR)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.maxPrice}
              onChange={(e) => handleInputChange('maxPrice', e.target.value)}
              placeholder="50.00"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.maxPrice ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.maxPrice && <p className="text-red-500 text-sm mt-1">{errors.maxPrice}</p>}
            <p className="text-gray-500 text-xs mt-1">Optional: Set maximum allowed custom price</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter product description..."
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isEditing ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                {isEditing ? '✏️ Update Product' : '➕ Add Product'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
