import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <div>
      <h1>Status</h1>
      <DatabaseInfo />
    </div>
  );
}

function DatabaseInfo() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let UpdatedAtText = "Carregando...";

  if (!isLoading && data) {
    UpdatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
    console.log(data);
    const db = data.dependencies.database;
    const dbVersion = db.version;
    const maxConn = db.max_connections;
    const activeConn = db.active_connections;

    return (
      <div>
        <strong>Última atualização:</strong> {UpdatedAtText}
        <h2>Banco de Dados</h2>
        <p>
          <strong>Versão:</strong> {dbVersion}
        </p>
        <p>
          <strong>Conexões máximas permitidas:</strong> {maxConn}
        </p>
        <p>
          <strong>Conexões ativas:</strong> {activeConn}
        </p>
      </div>
    );
  }

  return <div>{UpdatedAtText}</div>;
}
