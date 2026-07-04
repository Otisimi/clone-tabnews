import database from "infra/database";
import email from "infra/email";
import { ForbiddenError, NotFoundError } from "infra/errors";
import webServer from "infra/webserver";
import user from "./user";
import authorization from "./authorization";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

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

async function activateTokenById(tokenId) {
  const activatedToken = await runUpdateQuery(tokenId);
  return activatedToken;

  async function runUpdateQuery(tokenId) {
    const activatedToken = await database.query({
      text: `
        UPDATE user_activation_tokens
           SET used = TRUE
             , used_at = timezone('utc', now())
             , updated_at = timezone('utc', now())
         WHERE id = $1
        RETURNING *;
      `,
      values: [tokenId],
    });

    return activatedToken.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativação.",
      action: "Entre em contato com o suporte.",
    });
  }

  const activatedUser = user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

const activation = {
  create,
  sendEmailToUser,
  findOneValidById,
  activateTokenById,
  activateUserByUserId,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
