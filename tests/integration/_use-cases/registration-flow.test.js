import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  test("Create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@teste.com",
          password: "regPass",
        }),
      },
    );

    expect(createUserResponse.status).toBe(201);

    const userResponseBody = await createUserResponse.json();

    expect(userResponseBody).toEqual({
      id: userResponseBody.id,
      username: "RegistrationFlow",
      email: "registration.flow@teste.com",
      password: userResponseBody.password,
      features: ["read:activation_token"],
      created_at: userResponseBody.created_at,
      updated_at: userResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {});

  test("Activate account", async () => {});

  test("Login", async () => {});

  test("Get user info", async () => {});
});
