import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexitent 'username'", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Este usuário não existe.",
        action: "Verifique se o username está digitado corretamente",
        status_code: 404,
      });
    });

    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "User1",
      });

      await orchestrator.createUser({
        username: "User2",
      });

      const responsePatchUser2 = await fetch(
        "http://localhost:3000/api/v1/users/user2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "User1",
          }),
        },
      );
      expect(responsePatchUser2.status).toBe(400);

      const responsePatchUser2Body = await responsePatchUser2.json();

      expect(responsePatchUser2Body).toEqual({
        name: "ValidationError",
        message: "Username informado já está cadastrado!",
        action: "Informe um username diferente para continuar.",
        status_code: 400,
      });
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@teste.com",
      });

      const user2 = await orchestrator.createUser({
        email: "email2@teste.com",
      });

      const responsePatchEmail2 = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "email1@teste.com",
          }),
        },
      );
      expect(responsePatchEmail2.status).toBe(400);

      const responsePatchEmail2Body = await responsePatchEmail2.json();

      expect(responsePatchEmail2Body).toEqual({
        name: "ValidationError",
        message: "O email informado já está cadastrado!",
        action: "Informe outro email para continuar.",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UniqueUser1",
      });

      const responsePatch = await fetch(
        "http://localhost:3000/api/v1/users/UniqueUser1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "UniqueUser2",
          }),
        },
      );
      expect(responsePatch.status).toBe(200);

      const responsePatchBody = await responsePatch.json();

      expect(responsePatchBody).toEqual({
        id: responsePatchBody.id,
        username: "UniqueUser2",
        email: createdUser.email,
        password: responsePatchBody.password,
        created_at: responsePatchBody.created_at,
        updated_at: responsePatchBody.updated_at,
      });

      expect(uuidVersion(responsePatchBody.id)).toBe(4);
      expect(Date.parse(responsePatchBody.created_at)).not.toBeNaN();
      expect(Date.parse(responsePatchBody.updated_at)).not.toBeNaN();

      expect(responsePatchBody.updated_at > responsePatchBody.created_at).toBe(
        true,
      );
    });

    test("With unique 'email'", async () => {
      const createdUser = await orchestrator.createUser({
        email: "uniqueEmail1@teste.com",
      });

      const responsePatch = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "uniqueEmail2@teste.com",
          }),
        },
      );
      expect(responsePatch.status).toBe(200);

      const responsePatchBody = await responsePatch.json();

      expect(responsePatchBody).toEqual({
        id: responsePatchBody.id,
        username: createdUser.username,
        email: "uniqueEmail2@teste.com",
        password: responsePatchBody.password,
        created_at: responsePatchBody.created_at,
        updated_at: responsePatchBody.updated_at,
      });

      expect(uuidVersion(responsePatchBody.id)).toBe(4);
      expect(Date.parse(responsePatchBody.created_at)).not.toBeNaN();
      expect(Date.parse(responsePatchBody.updated_at)).not.toBeNaN();

      expect(responsePatchBody.updated_at > responsePatchBody.created_at).toBe(
        true,
      );
    });

    test("With new 'password'", async () => {
      const createdUser = await orchestrator.createUser({
        password: "senha123",
      });

      const responsePatch = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "senha456",
          }),
        },
      );
      expect(responsePatch.status).toBe(200);

      const responsePatchBody = await responsePatch.json();

      expect(responsePatchBody).toEqual({
        id: responsePatchBody.id,
        username: createdUser.username,
        email: createdUser.email,
        password: responsePatchBody.password,
        created_at: responsePatchBody.created_at,
        updated_at: responsePatchBody.updated_at,
      });

      expect(uuidVersion(responsePatchBody.id)).toBe(4);
      expect(Date.parse(responsePatchBody.created_at)).not.toBeNaN();
      expect(Date.parse(responsePatchBody.updated_at)).not.toBeNaN();

      expect(responsePatchBody.updated_at > responsePatchBody.created_at).toBe(
        true,
      );

      const userInDatabase = await user.findOneByUsername(createdUser.username);
      const correctPasswordMatch = await password.compare(
        "senha456",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "senha123",
        userInDatabase.password,
      );
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});
