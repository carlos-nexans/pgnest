create user supabase_admin;
alter user supabase_admin password 'my_password';
alter user  supabase_admin with superuser createdb createrole replication bypassrls;

CREATE EXTENSION IF NOT EXISTS pgmq;
SELECT pgmq.create('example-queue');
