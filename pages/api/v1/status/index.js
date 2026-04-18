import database from "infra/database.js";

async function status(request, response) {
  const updatedAt = new Date().toISOString();

  const queryPgVersion = await database.query("SHOW server_version;");
  const pgVersion = queryPgVersion.rows[0].server_version;

  const queryMaxConnections = await database.query("SHOW max_connections;");
  const maxConnections = parseInt(queryMaxConnections.rows[0].max_connections);

  const dbName = process.env.POSTGRES_DB;
  const queryActiveConnections = await database.query({
    text: "SELECT count(*)::int as active_con FROM pg_stat_activity WHERE datname = $1;",
    values: [dbName],
  });
  const activeConnections = queryActiveConnections.rows[0].active_con;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: pgVersion,
        max_connections: maxConnections,
        active_connections: activeConnections,
      },
    },
  });
}

export default status;
