import express from "express";
import {companyListController, companyRegisterController} from "../controllers/CompanyController.js";

const router = express.Router();

router.post('/companyList', companyListController);
router.post('/register', companyRegisterController);

export default router;
