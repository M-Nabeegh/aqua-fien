'use client'
import React, { createContext, useContext, useReducer, useEffect } from 'react'

// Initial state
const initialState = {
  products: [],
  customers: [],
  customerPricing: {},
  loading: {
    products: false,
    customers: false,
    customerPricing: false
  },
  error: null
}

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_PRODUCTS: 'SET_PRODUCTS',
  ADD_PRODUCT: 'ADD_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  SET_CUSTOMERS: 'SET_CUSTOMERS',
  ADD_CUSTOMER: 'ADD_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  DELETE_CUSTOMER: 'DELETE_CUSTOMER',
  SET_CUSTOMER_PRICING: 'SET_CUSTOMER_PRICING',
  UPDATE_CUSTOMER_PRICING: 'UPDATE_CUSTOMER_PRICING'
}

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value
        }
      }
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload
      }
    
    case ActionTypes.SET_PRODUCTS:
      return {
        ...state,
        products: action.payload,
        loading: { ...state.loading, products: false }
      }
    
    case ActionTypes.ADD_PRODUCT:
      return {
        ...state,
        products: [...state.products, action.payload]
      }
    
    case ActionTypes.UPDATE_PRODUCT:
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id ? action.payload : product
        )
      }
    
    case ActionTypes.DELETE_PRODUCT:
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload)
      }
    
    case ActionTypes.SET_CUSTOMERS:
      return {
        ...state,
        customers: action.payload,
        loading: { ...state.loading, customers: false }
      }
    
    case ActionTypes.ADD_CUSTOMER:
      return {
        ...state,
        customers: [...state.customers, action.payload]
      }
    
    case ActionTypes.UPDATE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.map(customer =>
          customer.id === action.payload.id ? action.payload : customer
        )
      }
    
    case ActionTypes.DELETE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload)
      }
    
    case ActionTypes.SET_CUSTOMER_PRICING:
      return {
        ...state,
        customerPricing: action.payload,
        loading: { ...state.loading, customerPricing: false }
      }
    
    case ActionTypes.UPDATE_CUSTOMER_PRICING:
      return {
        ...state,
        customerPricing: {
          ...state.customerPricing,
          [action.payload.customerId]: {
            ...state.customerPricing[action.payload.customerId],
            [action.payload.productId]: action.payload.price
          }
        }
      }
    
    default:
      return state
  }
}

// Create context
const AppContext = createContext()

// Custom hook to use the context
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

// Context provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // API functions
  const api = {
    // Products
    async fetchProducts() {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'products', value: true } })
      try {
        const response = await fetch('/api/products')
        const products = await response.json()
        dispatch({ type: ActionTypes.SET_PRODUCTS, payload: products })
        return products
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    async addProduct(productData) {
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        })
        
        if (!response.ok) {
          throw new Error('Failed to add product')
        }
        
        const result = await response.json()
        // Use the actual product returned from the API
        dispatch({ type: ActionTypes.ADD_PRODUCT, payload: result.data })
        return result.data
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    async updateProduct(id, productData) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        })
        
        if (!response.ok) {
          throw new Error('Failed to update product')
        }
        
        const updatedProduct = { id, ...productData }
        dispatch({ type: ActionTypes.UPDATE_PRODUCT, payload: updatedProduct })
        return updatedProduct
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    async deleteProduct(id) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete product')
        }
        
        dispatch({ type: ActionTypes.DELETE_PRODUCT, payload: id })
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    // Customers
    async fetchCustomers() {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'customers', value: true } })
      try {
        const response = await fetch('/api/customers')
        const customers = await response.json()
        dispatch({ type: ActionTypes.SET_CUSTOMERS, payload: customers })
        return customers
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    async addCustomer(customerData) {
      try {
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customerData)
        })
        
        if (!response.ok) {
          throw new Error('Failed to add customer')
        }
        
        const result = await response.json()
        // Use the actual customer returned from the API
        dispatch({ type: ActionTypes.ADD_CUSTOMER, payload: result.data })
        return result.data
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    // Customer Pricing
    async fetchCustomerPricing(customerId = null, productId = null) {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'customerPricing', value: true } })
      try {
        const params = new URLSearchParams()
        if (customerId) params.append('customerId', customerId)
        if (productId) params.append('productId', productId)
        
        const response = await fetch(`/api/customer-pricing?${params}`)
        const pricing = await response.json()
        
        // Convert array to nested object structure for easier access
        const pricingMap = {}
        pricing.forEach(p => {
          if (!pricingMap[p.customerId]) {
            pricingMap[p.customerId] = {}
          }
          pricingMap[p.customerId][p.productId] = p.customPrice
        })
        
        dispatch({ type: ActionTypes.SET_CUSTOMER_PRICING, payload: pricingMap })
        return pricingMap
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    async setCustomerPricing(customerId, productId, price) {
      try {
        const response = await fetch('/api/customer-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, productId, price })
        })
        
        if (!response.ok) {
          throw new Error('Failed to set customer pricing')
        }
        
        dispatch({ 
          type: ActionTypes.UPDATE_CUSTOMER_PRICING, 
          payload: { customerId, productId, price } 
        })
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    }
  }

  // Clear error function
  const clearError = () => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: null })
  }

  const contextValue = {
    state,
    api,
    clearError,
    ActionTypes
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}
