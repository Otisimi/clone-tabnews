import database from "infra/database";
import email from "infra/email";
import { NotFoundError } from "infra/errors";
import webServer from "infra/webserver";

const EXPIRATION_IN_MILISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO user_activation_tokens
          (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING *;
      `,
      values: [userId, expiresAt],
    });
    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "TabFlix <contato@tabflix.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no TabFlix!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no TabFlix.

${webServer.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Equipe TabFlix.`,
  });
}

async function findOneValidById(tokenId) {
  const token = await runSelectQuery(tokenId);
  return token;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT *
          FROM user_activation_tokens
         WHERE id = $1
           AND expires_at > now()
           AND used_at IS NULL
         ORDER BY expires_at desc
         LIMIT 1;
      `,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Token de ativação não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}

const activation = {
  create,
  sendEmailToUser,
  findOneValidById,
};

export default activation;
