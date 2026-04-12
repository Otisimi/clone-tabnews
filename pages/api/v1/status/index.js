function status(request, response) {
  response.status(200).json({ "O jogo": "Você perdeu ele agora" });
}

export default status;
