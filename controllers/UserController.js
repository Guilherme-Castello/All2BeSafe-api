import { createUser, getHashedPassword, getUserByEmail, getUserWithoutPassword, userListService, verifyPassword, userDeleteService, userUpdateService } from "../services/userService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function userLoginController(req, res) {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email)
    if (!user) {
      return handleError("Usuário não encontrado", res, 200);
    }

    // compara a senha com o hash
    const isPasswordCorrect = await verifyPassword(password, user.password)

    if (!isPasswordCorrect) {
      return handleError("Senha incorreta", res, 200);
    }

    const userWithoutPassword = await getUserWithoutPassword(user)
    console.log(userWithoutPassword)
    return handleSuccess({ message: 'Login realizado com sucesso!', user: userWithoutPassword }, res);
  } catch (e) {
    return handleError(e.message, res)
  }
}

export async function userRegistryController(req, res) {
  try {
    const { password, ...rest } = req.body;

    const hashedPassword = await getHashedPassword(password)

    const user = await createUser({
      ...rest,
      password: hashedPassword
    });

    const userWithoutPassword = await getUserWithoutPassword(user)
    return handleSuccess(userWithoutPassword, res);
  } catch (e) {
    if(e.message.includes("E11000")){
      return handleError("Email already taken", res, 200)
    }
    return handleError(e.message, res);
  }
}

export async function userListController(req, res) {
  try{
    const {userId } = req.body;

    const users = await userListService(userId)

    return handleSuccess(users, res)
  } catch(e){
    return handleError(e.message, res);
  }
}

export async function userDeleteController(req, res) {
  try{
    const {userId } = req.body;

    const deleted = await userDeleteService(userId)

    return handleSuccess(deleted, res)
  } catch(e){
    return handleError(e.message, res);
  }
}

export async function userUpdateController(req, res) {
  try{
    const {userId, updatedUser } = req.body;

    const updated = await userUpdateService(userId, updatedUser)

    return handleSuccess(updated, res)
  } catch(e){
    return handleError(e.message, res);
  }
}
