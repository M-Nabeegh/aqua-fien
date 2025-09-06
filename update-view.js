const { query } = require('./lib/db.js');

async function updateView() {
  try {
    console.log('Updating v_sell_orders_api view to include empty_bottles_collected...');
    
    // Drop the existing view
    await query('DROP VIEW IF EXISTS v_sell_orders_api');
    
    // Create the updated view
    await query(`
      CREATE VIEW v_sell_orders_api AS
      SELECT so.id,
        so.bill_date AS "billDate",
        so.customer_id AS "customerId",
        c.name AS "customerName",
        so.product_id AS "productId",
        p.name AS "productName",
        so.quantity,
        so.bottle_cost AS "bottleCost",
        so.total_amount AS "totalAmount",
        so.empty_bottles_collected AS "emptyBottlesCollected",
        so.salesman_employee_id AS "salesmanEmployeeId",
        se.name AS "salesmanAppointed",
        so.remarks,
        so.is_active AS "isActive",
        so.tenant_id AS "tenantId",
        so.created_at AS "createdAt",
        so.updated_at AS "updatedAt"
      FROM (((public.sell_orders so
        JOIN public.customers c ON ((c.id = so.customer_id)))
        JOIN public.products p ON ((p.id = so.product_id)))
        LEFT JOIN public.employees se ON ((se.id = so.salesman_employee_id)))
    `);
    
    console.log('✅ View v_sell_orders_api updated successfully');
  } catch (error) {
    console.error('❌ Error updating view:', error);
  }
  process.exit();
}

updateView();
