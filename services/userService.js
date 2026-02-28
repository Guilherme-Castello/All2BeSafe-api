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

export function getUserWithoutPassword(user) {
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

export async function userListService(userId) {
  const currentUserRaw = await User.findOne({ _id: userId });
  const currentUser = await getUserWithoutPassword(currentUserRaw)

  let users
  if(currentUser.access_level == 3) {
    users = await User.find()
  } else {
    users = await User.find({company: currentUser.company})
  }

  users = users.map(user => getUserWithoutPassword(user))

  return users
}

export async function userDeleteService(userId) {
  const deleted = await User.deleteOne({_id: userId})
  return deleted
}

export async function userUpdateService(userId, newUserStructure) {
  const updated = await User.updateOne(
    { _id: userId},
    { $set: newUserStructure}
  )
  return updated
}
