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
    test("With unique 'username'", async () => {
      await orchestrator.createUser({
        username: "AnonUniqueUser1",
      });

      const responsePatch = await fetch(
        "http://localhost:3000/api/v1/users/UniqueUser1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "AnonUniqueUser2",
          }),
        },
      );
      expect(responsePatch.status).toBe(403);

      const responsePatchBody = await responsePatch.json();

      expect(responsePatchBody).toEqual({
        action: 'Verifique se seu usuário possui a feature "update:user".',
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexitent 'username'", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
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

      const createdUser2 = await orchestrator.createUser({
        username: "User2",
      });

      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const responsePatchUser2 = await fetch(
        "http://localhost:3000/api/v1/users/user2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject2.token}`,
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

    test("With `UserB` targeting `UserA`", async () => {
      await orchestrator.createUser({
        username: "UserA",
      });

      const createdUserB = await orchestrator.createUser({
        username: "UserB",
      });

      const activatedUserB = await orchestrator.activateUser(createdUserB);
      const sessionObjectB = await orchestrator.createSession(
        activatedUserB.id,
      );

      const responsePatchUserB = await fetch(
        "http://localhost:3000/api/v1/users/UserA",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObjectB.token}`,
          },
          body: JSON.stringify({
            username: "UserC",
          }),
        },
      );
      expect(responsePatchUserB.status).toBe(403);

      const responsePatchUserBBody = await responsePatchUserB.json();

      expect(responsePatchUserBBody).toEqual({
        action:
          "Verifique se você possui a feature necessária para atualizar outro usuário",
        message: "Você não possui permissão para atualizar outro usuário.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@teste.com",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@teste.com",
      });

      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const responsePatchEmail2 = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject2.token}`,
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

      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const responsePatch = await fetch(
        "http://localhost:3000/api/v1/users/UniqueUser1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
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
        features: ["create:session", "read:session", "update:user"],
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

      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const responsePatch = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
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
        features: ["create:session", "read:session", "update:user"],
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

      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const responsePatch = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
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
        features: ["create:session", "read:session", "update:user"],
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

  describe("Privileged user", () => {
    test("With `update:user:others` targeting `defaultUser`", async () => {
      // Cria usuario privilegiado
      const privilegedUser = await orchestrator.createUser();
      // Ativa usuario privilegiado
      const activatedPrivilegedUser =
        await orchestrator.activateUser(privilegedUser);
      // Dá o poder de alterar outros users
      await orchestrator.addFeaturesToUser(privilegedUser, [
        "update:user:others",
      ]);
      // Cria sessao para ele
      const privilegedUserSession = await orchestrator.createSession(
        activatedPrivilegedUser.id,
      );

      const defaultUser = await orchestrator.createUser();

      const responsePatchDefaultUser = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilegedUserSession.token}`,
          },
          body: JSON.stringify({
            username: "AlteredDefaultUseryPrivileged",
          }),
        },
      );
      expect(responsePatchDefaultUser.status).toBe(200);

      const responseBody = await responsePatchDefaultUser.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "AlteredDefaultUseryPrivileged",
        email: defaultUser.email,
        password: responseBody.password,
        features: defaultUser.features,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
