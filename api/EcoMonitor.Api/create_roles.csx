using System;
using Npgsql;

var connString = "Host=aws-1-sa-east-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.eznsxbjdssojayrqetry;Password=3ca!8M39Fa$%s@N;SslMode=Require;Trust Server Certificate=true;";
using var conn = new NpgsqlConnection(connString);
conn.Open();

var sql = @"
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'client'))
);
";
using var cmd = new NpgsqlCommand(sql, conn);
cmd.ExecuteNonQuery();
Console.WriteLine("Tabela user_roles criada com sucesso!");
