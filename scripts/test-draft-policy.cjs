const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs'),
  assert = require('node:assert/strict');
(async () => {
  const db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('raftt.user',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`,
  );
  const sql = fs.readFileSync('database/004_workspace_drafts.sql', 'utf8');
  await db.exec(sql);
  await db.exec(sql);
  await db.exec(
    `set role authenticated;select set_config('raftt.user','11111111-1111-4111-8111-111111111111',false);`,
  );
  await db.query(
    `insert into public.workspace_drafts(user_id,workspace_key,payload) values($1,$2,$3)`,
    ['11111111-1111-4111-8111-111111111111', 'company-application', { name: 'Private draft' }],
  );
  await assert.rejects(
    db.query(
      `insert into public.workspace_drafts(user_id,workspace_key,payload) values($1,$2,$3)`,
      ['22222222-2222-4222-8222-222222222222', 'company-application', { name: 'Forged' }],
    ),
    /row-level security/,
  );
  await assert.rejects(
    db.query(
      `insert into public.workspace_drafts(user_id,workspace_key,payload) values($1,$2,$3)`,
      ['11111111-1111-4111-8111-111111111111', 'large', { text: 'x'.repeat(200001) }],
    ),
    /check constraint/,
  );
  await db.exec(`select set_config('raftt.user','22222222-2222-4222-8222-222222222222',false);`);
  assert.equal((await db.query('select * from public.workspace_drafts')).rows.length, 0);
  assert.equal((await db.query('delete from public.workspace_drafts returning *')).rows.length, 0);
  await db.exec('reset role;set role anon;');
  await assert.rejects(db.query('select * from public.workspace_drafts'), /permission denied/);
  await db.close();
  console.log(
    'PostgreSQL draft policy: migration reapplication, own writes, cross-account denial, anonymous denial and payload limit passed.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
