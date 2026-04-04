const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@stocksms.com',
    password: 'Stocks@123'
  });

  if (authError) {
    console.error('Login error:', authError);
    return;
  }

  // Fetch customers to get an ID
  const { data: customers } = await supabase.from('customers').select('id').limit(1);
  const customerId = customers[0].id;

  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert([{
      order_number: `SO-TEST-${Date.now()}`,
      customer_id: customerId,
      subtotal: 100,
      total: 100,
      status: 'PENDING',
      created_by: authData.user.id
    }])
    .select()
    .single();

  if (orderError) {
    console.error('Order Insert error:', JSON.stringify(orderError, null, 2));
  } else {
    console.log('Order inserted successfully:', order);
  }
}

test();
