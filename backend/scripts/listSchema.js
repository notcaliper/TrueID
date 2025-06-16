#!/usr/bin/env node
/**
 * listSchema.js
 * ---------------
 * Quick utility to print all tables and their columns for the current
 * PostgreSQL database defined in your environment variables.
 *
 * Usage:
 *   node scripts/listSchema.js
 *
 * Requires the "pg" package (already used by the backend) and will reuse the
 * same environment variables (.env or process env) that the backend server
 * expects: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
 */

const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

(async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postgres',
  });

  try {
    await client.connect();

    const res = await client.query(
      `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
       ORDER BY table_name, ordinal_position;`
    );

    if (res.rows.length === 0) {
      console.log('No tables found in schema "public"');
      return;
    }

    // Group by table name
    const grouped = res.rows.reduce((acc, row) => {
      if (!acc[row.table_name]) acc[row.table_name] = [];
      acc[row.table_name].push({ column: row.column_name, type: row.data_type });
      return acc;
    }, {});

    // Pretty print
    Object.entries(grouped).forEach(([table, columns]) => {
      console.log(`\n=== ${table} ===`);
      columns.forEach(({ column, type }) => {
        console.log(`  • ${column} : ${type}`);
      });
    });
  } catch (err) {
    console.error('Error retrieving schema:', err);
  } finally {
    await client.end();
  }
})();
