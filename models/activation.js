import database from "infra/database";
import email from "infra/email";
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

async function findOneByUserId(userId) {
  const token = await runSelectQuery(userId);
  return token;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
        SELECT id
          FROM user_activation_tokens
         WHERE user_id = $1
         LIMIT 1;
      `,
      values: [userId],
    });

    return results.rows[0];
  }
}

const activation = {
  create,
  sendEmailToUser,
  findOneByUserId,
};

export default activation;
