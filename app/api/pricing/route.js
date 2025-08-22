import { query } from '../../../lib/db'

// GET endpoint to fetch effective pricing for customer-product combinations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const productId = searchParams.get('productId')
    
    // If both customer and product are specified, return the effective price
    if (customerId && productId) {
      const effectivePrice = await getEffectivePrice(customerId, productId)
      return Response.json({ 
        customerId: parseInt(customerId),
        productId: parseInt(productId),
        effectivePrice: effectivePrice.price,
        priceType: effectivePrice.type,
        productName: effectivePrice.productName
      })
    }
    
    // If only customerId is provided, get all effective prices for that customer
    if (customerId) {
      const products = await query(
        'SELECT id, name, base_price FROM products WHERE is_active = true'
      )
      
      const customerPrices = []
      for (const product of products.rows) {
        const effectivePrice = await getEffectivePrice(customerId, product.id)
        customerPrices.push({
          productId: product.id,
          productName: product.name,
          basePrice: parseFloat(product.base_price),
          effectivePrice: effectivePrice.price,
          priceType: effectivePrice.type,
          customerId: parseInt(customerId)
        })
      }
      
      return Response.json(customerPrices)
    }
    
    return Response.json({ error: 'customerId is required, productId is optional' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching pricing:', error)
    return Response.json({ error: 'Failed to fetch pricing', details: error.message }, { status: 500 })
  }
}

// Helper function to get effective price for a customer-product combination
async function getEffectivePrice(customerId, productId) {
  try {
    // First, get product details
    const productResult = await query(
      'SELECT id, name, base_price FROM products WHERE id = $1 AND is_active = true',
      [parseInt(productId)]
    )
    
    if (productResult.rowCount === 0) {
      throw new Error('Product not found')
    }
    
    const product = productResult.rows[0]
    
    // Check for custom pricing
    const customPricingResult = await query(
      `SELECT custom_price FROM customer_pricing 
       WHERE customer_id = $1 AND product_id = $2 AND is_active = true`,
      [parseInt(customerId), parseInt(productId)]
    )
    
    if (customPricingResult.rowCount > 0) {
      return {
        price: parseFloat(customPricingResult.rows[0].custom_price),
        type: 'custom',
        productName: product.name
      }
    }
    
    // Return base price if no custom pricing
    return {
      price: parseFloat(product.base_price),
      type: 'base',
      productName: product.name
    }
  } catch (error) {
    console.error('Error getting effective price:', error)
    throw error
  }
}
