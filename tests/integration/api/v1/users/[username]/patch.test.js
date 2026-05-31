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
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "User1",
          email: "user1@teste.com",
          password: "senhaTeste",
        }),
      });
      expect(user1Response.status).toBe(201);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "User2",
          email: "user2@teste.com",
          password: "senhaTeste",
        }),
      });
      expect(user2Response.status).toBe(201);

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
      const email1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "email1",
          email: "email1@teste.com",
          password: "senhaTeste",
        }),
      });
      expect(email1Response.status).toBe(201);

      const email2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "email2",
          email: "email2@teste.com",
          password: "senhaTeste",
        }),
      });
      expect(email2Response.status).toBe(201);

      const responsePatchEmail2 = await fetch(
        "http://localhost:3000/api/v1/users/email2",
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
      const userResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "UniqueUser1",
          email: "uniqueUser1@teste.com",
          password: "senhaTeste",
        }),
      });
      expect(userResponse.status).toBe(201);

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
        email: "uniqueUser1@teste.com",
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
      const userResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "UniqueEmail1",
          email: "uniqueEmail1@teste.com",
          password: "senhaTeste",
        }),
      });
      expect(userResponse.status).toBe(201);

      const responsePatch = await fetch(
        "http://localhost:3000/api/v1/users/UniqueEmail1",
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
        username: "UniqueEmail1",
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
      const userResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "newPassword1",
          email: "newPassword@teste.com",
          password: "senha123",
        }),
      });
      expect(userResponse.status).toBe(201);

      const responsePatch = await fetch(
        "http://localhost:3000/api/v1/users/newPassword1",
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
        username: "newPassword1",
        email: "newPassword@teste.com",
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

      const userInDatabase = await user.findOneByUsername("newPassword1");
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
