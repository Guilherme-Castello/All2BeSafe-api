/**
 * Erro cuja mensagem pode ser exibida ao usuário.
 * Os controllers respondem esses casos com status 200 + success:false,
 * como o login já faz, e deixam o 500 para falhas inesperadas.
 */
export function userError(message) {
  const error = new Error(message)
  error.isUserError = true
  return error
}
