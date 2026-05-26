import database from "infra/database";
import { ValidationError } from "infra/errors";

async function create(userValues) {
  await validateUniqueEmail(userValues.email);
  await validateUniqueUsername(userValues.username);

  const newUser = await runInsertQuery(userValues);
  return newUser;

  // Valida email duplicado
  async function validateUniqueEmail(userEmail) {
    const results = await database.query({
      text: `
          SELECT 1
            FROM users
           WHERE LOWER(email) = LOWER($1); `,
      values: [userEmail],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "O email informado já está cadastrado!",
        action: "Utilize outro email para se cadastrar.",
      });
    }
  }

  // Valida username duplicado
  async function validateUniqueUsername(userUsername) {
    const results = await database.query({
      text: `
          SELECT username
            FROM users
           WHERE LOWER(username) = LOWER($1); `,
      values: [userUsername],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "Username informado já está cadastrado!",
        action: "Informe um username diferente para continuar.",
      });
    }
  }

  // Insere novo usuário
  async function runInsertQuery(userValues) {
    const results = await database.query({
      text: `
          INSERT INTO users 
            (username, email, password) 
          VALUES 
            ($1, $2, $3)
          RETURNING *; `,
      values: [userValues.username, userValues.email, userValues.password],
    });

    return results.rows[0];
  }
}

const user = {
  create,
};

export default user;
