import { query } from '../../../lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const riderId = searchParams.get('riderId')
    const productId = searchParams.get('productId')
    const date = searchParams.get('date') // For daily accountability
    const detailed = searchParams.get('detailed') === 'true'

    // If specific rider, product, and date are provided, calculate daily accountability
    if (riderId && productId && date) {
      const dailyAccountability = await calculateDailyAccountability(riderId, productId, date)
      return Response.json(dailyAccountability)
    }

    // If rider and product are provided (without date), calculate overall accountability
    if (riderId && productId) {
      const overallAccountability = await calculateOverallAccountability(riderId, productId)
      return Response.json(overallAccountability)
    }

    // If riderId is provided, get accountability for all products
    if (riderId) {
      const products = await query('SELECT id, name FROM products WHERE is_active = true')
      const accountabilities = []
      
      for (const product of products.rows) {
        const accountability = await calculateOverallAccountability(riderId, product.id)
        if (accountability.totalFilledBottlesSent > 0 || accountability.totalBottlesBroughtBack > 0 || accountability.totalBottlesSold > 0) {
          accountabilities.push({
            ...accountability,
            productName: product.name
          })
        }
      }
      
      return Response.json(accountabilities)
    }

    // If detailed flag is set, get comprehensive accountability for all riders
    if (detailed) {
      const comprehensiveAccountability = await calculateComprehensiveAccountability()
      return Response.json(comprehensiveAccountability)
    }

    return Response.json({ error: 'Please provide riderId parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error calculating accountability:', error)
    return Response.json({ error: 'Failed to calculate accountability' }, { status: 500 })
  }
}

// Calculate accountability for a specific rider, product, and date
async function calculateDailyAccountability(riderId, productId, date) {
  try {
    // Get rider activity for the specific date
    const activityResult = await query(`
      SELECT 
        filled_bottles_sent,
        filled_product_bought_back,
        empty_bottles_received,
        notes
      FROM rider_activities 
      WHERE employee_id = $1 AND product_id = $2 AND activity_date = $3 AND is_active = true
    `, [riderId, productId, date])

    const activity = activityResult.rows[0] || {
      filled_bottles_sent: 0,
      filled_product_bought_back: 0,
      empty_bottles_received: 0,
      notes: ''
    }

    // Get sell orders for the same date
    const sellOrdersResult = await query(`
      SELECT COALESCE(SUM(quantity), 0) as total_sold
      FROM sell_orders 
      WHERE salesman_employee_id = $1 AND product_id = $2 AND bill_date = $3 AND is_active = true
    `, [riderId, productId, date])

    const totalSoldOnDate = parseInt(sellOrdersResult.rows[0].total_sold) || 0

    // Calculate daily accountability
    const dailyAccountability = activity.filled_bottles_sent - activity.filled_product_bought_back - totalSoldOnDate

    return {
      riderId: parseInt(riderId),
      productId: parseInt(productId),
      date,
      filledBottlesSent: activity.filled_bottles_sent,
      bottlesBroughtBack: activity.filled_product_bought_back,
      emptyBottlesReceived: activity.empty_bottles_received,
      sellOrdersOnDate: totalSoldOnDate,
      dailyAccountability,
      accountabilityStatus: dailyAccountability === 0 ? 'Clear' : dailyAccountability > 0 ? 'Has Stock' : 'Deficit',
      notes: activity.notes
    }
  } catch (error) {
    console.error('Error calculating daily accountability:', error)
    throw error
  }
}

// Calculate overall accountability for a specific rider and product
async function calculateOverallAccountability(riderId, productId) {
  try {
    // Get total filled bottles sent
    const filledBottlesSentResult = await query(`
      SELECT COALESCE(SUM(filled_bottles_sent), 0) as total_sent
      FROM rider_activities 
      WHERE employee_id = $1 AND product_id = $2 AND is_active = true
    `, [riderId, productId])

    const totalFilledBottlesSent = parseInt(filledBottlesSentResult.rows[0].total_sent) || 0

    // Get total bottles brought back
    const bottlesBroughtBackResult = await query(`
      SELECT COALESCE(SUM(filled_product_bought_back), 0) as total_brought_back
      FROM rider_activities 
      WHERE employee_id = $1 AND product_id = $2 AND is_active = true
    `, [riderId, productId])

    const totalBottlesBroughtBack = parseInt(bottlesBroughtBackResult.rows[0].total_brought_back) || 0

    // Get total bottles sold
    const bottlesSoldResult = await query(`
      SELECT COALESCE(SUM(quantity), 0) as total_sold
      FROM sell_orders 
      WHERE salesman_employee_id = $1 AND product_id = $2 AND is_active = true
    `, [riderId, productId])

    const totalBottlesSold = parseInt(bottlesSoldResult.rows[0].total_sold) || 0

    // Calculate overall accountability
    const overallAccountability = totalFilledBottlesSent - totalBottlesBroughtBack - totalBottlesSold

    return {
      riderId: parseInt(riderId),
      productId: parseInt(productId),
      totalFilledBottlesSent,
      totalBottlesBroughtBack,
      totalBottlesSold,
      overallAccountability,
      accountabilityStatus: overallAccountability === 0 ? 'Clear' : overallAccountability > 0 ? 'Has Stock' : 'Deficit'
    }
  } catch (error) {
    console.error('Error calculating overall accountability:', error)
    throw error
  }
}

// Calculate comprehensive accountability for all active riders and products
async function calculateComprehensiveAccountability() {
  try {
    // Get all riders (employees with rider activities)
    const ridersResult = await query(`
      SELECT DISTINCT e.id, e.name, e.employee_type
      FROM employees e
      JOIN rider_activities ra ON e.id = ra.employee_id
      WHERE e.is_active = true AND ra.is_active = true
    `)

    const riders = ridersResult.rows
    const products = await query('SELECT id, name FROM products WHERE is_active = true')
    const comprehensiveData = []

    for (const rider of riders) {
      const riderAccountability = {
        riderId: rider.id,
        riderName: rider.name,
        employeeType: rider.employee_type,
        products: []
      }

      for (const product of products.rows) {
        const accountability = await calculateOverallAccountability(rider.id, product.id)
        
        // Only include products with activity
        if (accountability.totalFilledBottlesSent > 0 || accountability.totalBottlesBroughtBack > 0 || accountability.totalBottlesSold > 0) {
          riderAccountability.products.push({
            ...accountability,
            productName: product.name
          })
        }
      }

      if (riderAccountability.products.length > 0) {
        comprehensiveData.push(riderAccountability)
      }
    }

    return comprehensiveData
  } catch (error) {
    console.error('Error calculating comprehensive accountability:', error)
    throw error
  }
}
