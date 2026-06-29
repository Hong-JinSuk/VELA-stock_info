import pg from 'pg';
const c = new pg.Client(process.env.Q_DB_URL);
await c.connect();
const t = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'Community%' ORDER BY table_name`);
console.log('tables:', t.rows.map(r=>r.table_name).join(', '));
const e = await c.query(`SELECT unnest(enum_range(NULL::"RatingWritePolicy"))::text AS v`);
console.log('RatingWritePolicy:', e.rows.map(r=>r.v).join(', '));
await c.end();
