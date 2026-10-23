const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/kaisar_gym' });

async function run() {
  await client.connect();
  // Set 2 subscriptions to expire in 3 days and 5 days from today (Oct 19, 2026)
  // Oct 22, 2026 and Oct 25, 2026
  await client.query(`
    UPDATE "Subscription" 
    SET "endDate" = '2026-10-23T17:00:00.000Z' 
    WHERE id = (SELECT id FROM "Subscription" WHERE status = 'ACTIVE' LIMIT 1);
  `);
  console.log("Updated 1 subscription to expire on Oct 23 (4 days left)");
  await client.end();
}
run().catch(console.error);
