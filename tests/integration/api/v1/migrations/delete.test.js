import webServer from "infra/webserver";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("DELETE /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Deleting current migrations", async () => {
      const response = await fetch(`${webServer.origin}/api/v1/migrations`, {
        method: "DELETE",
      });
      expect(response.status).toBe(405);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: "Método não permitido para este endpoint",
        action:
          "Verifique se o método HTTP enviado é valido para este endpoint",
        status_code: 405,
      });
    });
  });
});
