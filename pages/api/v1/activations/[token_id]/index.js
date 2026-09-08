import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";
import authorization from "models/authorization";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .patch(controller.canRequest("read:activation_token"), patchHandler)
  .handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const tokenId = request.query.token_id;
  const token = await activation.findOneValidById(tokenId);

  await activation.activateUserByUserId(token.user_id);

  const activatedToken = await activation.activateTokenById(token.id);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:activation_token",
    activatedToken,
  );

  return response.status(200).json(secureOutputValues);
}
