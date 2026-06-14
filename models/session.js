import crypto from "node:crypto";
import database from "infra/database";
import { UnauthorizedError } from "infra/errors";

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 dias

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = calcExpiresAt();

  const newSession = await runInsertQuery(token, userId, expiresAt);
  return newSession;

  async function runInsertQuery(token, userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO sessions
          (token, user_id, expires_at)
        VALUES 
          ($1, $2, $3)
        RETURNING *;
      `,
      values: [token, userId, expiresAt],
    });
    return results.rows[0];
  }
}

async function findOneValidByToken(token) {
  const sessionFound = await runSelectQuery(token);

  return sessionFound;

  async function runSelectQuery(sessionToken) {
    const results = await database.query({
      text: `
        SELECT *
          FROM sessions
         WHERE token = $1
           AND expires_at > NOW()
         LIMIT 1;
      `,
      values: [sessionToken],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Usuário sem sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente",
      });
    }

    return results.rows[0];
  }
}

async function renew(sessionId) {
  const expiresAt = calcExpiresAt();
  const renewedSessionObject = runUpdateQuery(sessionId, expiresAt);
  return renewedSessionObject;

  async function runUpdateQuery(sessionId, expiresAt) {
    const results = await database.query({
      text: `
        UPDATE sessions
           SET expires_at = $1
             , updated_at = NOW()
         WHERE id = $2
         RETURNING *;
      `,
      values: [expiresAt, sessionId],
    });

    return results.rows[0];
  }
}

function calcExpiresAt() {
  return new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
}

const session = {
  create,
  findOneValidByToken,
  renew,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
