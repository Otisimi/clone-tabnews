import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "Otisimi <otisimi@gmail.com>",
      to: "otisimi@gmail.com",
      subject: "Teste de assunto",
      text: "Teste de corpo.",
    });

    await email.send({
      from: "Otisimi <otisimi@gmail.com>",
      to: "otisimi@gmail.com",
      subject: "Último email enviado",
      text: "Corpo do último email.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<otisimi@gmail.com>");
    expect(lastEmail.recipients[0]).toBe("<otisimi@gmail.com>");
    expect(lastEmail.subject).toBe("Último email enviado");
    expect(lastEmail.text).toBe("Corpo do último email.\r\n");
    console.log(lastEmail);
  });
});
