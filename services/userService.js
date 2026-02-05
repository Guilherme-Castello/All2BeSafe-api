import User from "../models/User.js";
import bcrypt from "bcrypt"

export async function getUserByEmail(email) {
  const user = await User.findOne({ email });

  return user
}

export async function verifyPassword(password, uPassword) {
  const isCorrect = await bcrypt.compare(password, uPassword);

  return isCorrect
}

export async function getUserWithoutPassword(user) {
  const userWithoutPassword = user.toObject()
  delete userWithoutPassword.password

  return userWithoutPassword
}

export async function getHashedPassword(password){
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword
}

export async function createUser(userStructure){
  try{
    const user = new User(userStructure);
    await user.save()
    return user
  } catch(e){
    console.error("Create user error: ", e)
    throw new Error(e)
  }
}