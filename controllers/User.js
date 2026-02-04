import User from "../models/User.js";
import bcrypt from "bcrypt";

export async function createUser(userStructure) {
  try {

    const { password, ...rest } = userStructure;

    // gera o hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      ...rest,
      password: hashedPassword
    });

    const savedUser = await user.save();
    const userWithoutPassword = savedUser.toObject();
    delete userWithoutPassword.password;

    return savedUser
  } catch(e){
    console.error(e)
  }
}
