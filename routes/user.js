import express from "express";
import { userDeleteController, userListController, userLoginController, userRegistryController, userUpdateController } from "../controllers/UserController.js";

const router = express.Router();

router.post('/login', userLoginController);
router.post('/register', userRegistryController);
router.post('/list', userListController);
router.post('/delete', userDeleteController);
router.post('/update', userUpdateController);

export default router;
