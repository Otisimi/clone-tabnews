import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  // api/v1/activations/[token_id] --> request.query.token_id
  const tokenId = request.query.token_id;

  const token = await activation.findOneValidById(tokenId);

  await activation.activateUserByUserId(token.user_id);

  const activatedToken = await activation.activateTokenById(token.id);

  return response.status(200).json(activatedToken);
}
