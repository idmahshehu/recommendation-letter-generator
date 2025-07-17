const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'postgres',
    database: 'recommendation_letter',
    password: 'postgres321',
    port: 5432, // default PostgreSQL port
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};

pool.query('SELECT NOW()', (err, res) => {
  if (err) throw err;
  console.log('Connected:', res.rows[0]);
});