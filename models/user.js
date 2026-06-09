import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";
import password from "models/password.js";

async function create(userValues) {
  await validateUniqueEmail(userValues.email);
  await validateUniqueUsername(userValues.username);
  await hashPasswordInObject(userValues);

  const newUser = await runInsertQuery(userValues);
  return newUser;

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

async function findOneByUsername(username) {
  const foundUser = await runSelectQuery(username);

  return foundUser;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
          SELECT *
            FROM users
           WHERE LOWER(username) = LOWER($1)
           LIMIT 1; `,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Este usuário não existe.",
        action: "Verifique se o username está digitado corretamente",
      });
    }

    return results.rows[0];
  }
}

async function findOneByEmail(email) {
  const foundUser = await runSelectQuery(email);

  return foundUser;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
          SELECT *
            FROM users
           WHERE LOWER(email) = LOWER($1)
           LIMIT 1; `,
      values: [email],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Este email não está cadastrado.",
        action: "Verifique se o email está digitado corretamente",
      });
    }

    return results.rows[0];
  }
}

async function update(username, inputValues) {
  const currentUser = await findOneByUsername(username);

  if ("email" in inputValues) {
    await validateUniqueEmail(inputValues.email);
  }
  if ("username" in inputValues) {
    await validateUniqueUsername(inputValues.username);
  }
  if ("password" in inputValues) {
    await hashPasswordInObject(inputValues);
  }

  const userNewValues = { ...currentUser, ...inputValues };
  const updatedUser = await runUpdateQuery(userNewValues);
  return updatedUser;

  async function runUpdateQuery(userNewValues) {
    const results = await database.query({
      text: `
        UPDATE users
           SET username = $2
             , email = $3
             , password = $4
             , updated_at = timezone('utc', now())
         WHERE id = $1
        RETURNING *;
      `,
      values: [
        userNewValues.id,
        userNewValues.username,
        userNewValues.email,
        userNewValues.password,
      ],
    });
    return results.rows[0];
  }
}

// Valida email duplicado
async function validateUniqueEmail(userEmail) {
  const results = await database.query({
    text: `
          SELECT email
            FROM users
           WHERE LOWER(email) = LOWER($1)
           LIMIT 1; `,
    values: [userEmail],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está cadastrado!",
      action: "Informe outro email para continuar.",
    });
  }
}

// Valida username duplicado
async function validateUniqueUsername(userUsername) {
  const results = await database.query({
    text: `
          SELECT username
            FROM users
           WHERE LOWER(username) = LOWER($1)
           LIMIT 1; `,
    values: [userUsername],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "Username informado já está cadastrado!",
      action: "Informe um username diferente para continuar.",
    });
  }
}

// 'Hashifica' a senha
async function hashPasswordInObject(userValues) {
  const hashedPassword = await password.hash(userValues.password);
  userValues.password = hashedPassword;
}

const user = {
  create,
  findOneByUsername,
  findOneByEmail,
  update,
};

export default user;
