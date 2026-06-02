import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      await orchestrator.createUser({
        username: "MesmoCase",
        email: "username@teste.com",
        password: "senhaTeste",
      });

      const responseTwo = await fetch(
        "http://localhost:3000/api/v1/users/MesmoCase",
      );
      expect(responseTwo.status).toBe(200);

      const responseBodyTwo = await responseTwo.json();

      expect(responseBodyTwo).toEqual({
        id: responseBodyTwo.id,
        username: "MesmoCase",
        email: "username@teste.com",
        password: responseBodyTwo.password,
        created_at: responseBodyTwo.created_at,
        updated_at: responseBodyTwo.updated_at,
      });

      expect(uuidVersion(responseBodyTwo.id)).toBe(4);
      expect(Date.parse(responseBodyTwo.created_at)).not.toBeNaN();
      expect(Date.parse(responseBodyTwo.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      await orchestrator.createUser({
        username: "DifCase",
        email: "difUser@teste.com",
        password: "senhaTeste",
      });

      const responseTwo = await fetch(
        "http://localhost:3000/api/v1/users/difcase",
      );
      expect(responseTwo.status).toBe(200);

      const responseBodyTwo = await responseTwo.json();

      expect(responseBodyTwo).toEqual({
        id: responseBodyTwo.id,
        username: "DifCase",
        email: "difUser@teste.com",
        password: responseBodyTwo.password,
        created_at: responseBodyTwo.created_at,
        updated_at: responseBodyTwo.updated_at,
      });

      expect(uuidVersion(responseBodyTwo.id)).toBe(4);
      expect(Date.parse(responseBodyTwo.created_at)).not.toBeNaN();
      expect(Date.parse(responseBodyTwo.updated_at)).not.toBeNaN();
    });

    test("With nonexistent username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/IstoNonExiste",
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
  });
});
