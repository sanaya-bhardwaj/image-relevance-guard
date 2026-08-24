const { pool } = require('../src/db');

async function checkCosts() {
  const { rows } = await pool.query(`
    SELECT call_type, COUNT(*) as calls, SUM(input_tokens) as total_input,
           SUM(output_tokens) as total_output, SUM(estimated_cost_usd) as total_cost
    FROM ai_call_costs GROUP BY call_type
  `);
  console.log(rows);
  await pool.end();
}

checkCosts();