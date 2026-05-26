import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  ValidationError,
} from "infra/errors";

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  // Erro de validação - ValidationError
  if (error instanceof ValidationError) {
    return response.status(error.statusCode).json(error);
  }

  // Erro de busca - NotFoundError
  if (error instanceof NotFoundError) {
    return response.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });

  console.error(publicErrorObject);

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

export default controller;
