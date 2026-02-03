import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Company from '../models/Company.js';
import usersMock from '../mocks/users.js';
import companiesMock from '../mocks/companies.js';
import { createUser } from '../controllers/User.js';

async function populateCompanies() {
  await Company.deleteMany();

  for (let idx = 0; idx < companiesMock.length; idx++) {
    await Company.create(companiesMock[idx]);
    console.log(`Company: ${idx + 1}/${companiesMock.length}`);
  }
}

async function populateUsers() {
  await User.deleteMany();

  for (let idx = 0; idx < usersMock.length; idx++) {
    await createUser(usersMock[idx])
    console.log(`User: ${idx + 1}/${usersMock.length}`);
  }
}

async function populate() {
  await mongoose.connect(process.env.MONGO_URL, {
    dbName: "test"
  });
  console.log("Mongo conectado");

  await populateCompanies();
  await populateUsers();

  await mongoose.disconnect();
  console.log("Seed finalizado");
}

populate();
