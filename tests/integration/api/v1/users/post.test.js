import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "Otisimi",
          email: "otisimi@gmail.com",
          password: "senhaTeste",
        }),
      });
      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "Otisimi",
        email: "otisimi@gmail.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername("Otisimi");
      const correctPasswordMatch = await password.compare(
        "senhaTeste",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "senhaNaoTeste",
        userInDatabase.password,
      );
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("With duplicated email", async () => {
      const responseOne = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "EmailDup1",
          email: "duplicado@teste.com",
          password: "senhaTeste",
        }),
      });
      expect(responseOne.status).toBe(201);

      const responseTwo = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "EmailDup2",
          email: "Duplicado@teste.com",
          password: "senhaTeste",
        }),
      });
      expect(responseTwo.status).toBe(400);

      const responseBody = await responseTwo.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está cadastrado!",
        action: "Utilize outro email para se cadastrar.",
        status_code: 400,
      });
    });

    test("With duplicated username", async () => {
      const responseOne = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "UsernameDup",
          email: "user@teste.com",
          password: "senhaTeste",
        }),
      });
      expect(responseOne.status).toBe(201);

      const responseTwo = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "UsernameDup",
          email: "dupUser@teste.com",
          password: "senhaTeste",
        }),
      });
      expect(responseTwo.status).toBe(400);

      const responseBody = await responseTwo.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Username informado já está cadastrado!",
        action: "Informe um username diferente para continuar.",
        status_code: 400,
      });
    });
  });
});
