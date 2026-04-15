import database from "infra/database.js";

async function status(request, response) {
  const result = await database.query("SELECT 2 + 1 as sum;");
  console.log(result.rows);
  response.status(200).json({ "O jogo": "Você perdeu ele agora" });
}

export default status;
