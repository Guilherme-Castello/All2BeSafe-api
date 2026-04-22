import express from "express";
import { companyListController, companyRegisterController, updateCompanyController, deleteCompanyController } from "../controllers/CompanyController.js";

const router = express.Router();

router.post('/companyList', companyListController);
router.post('/register', companyRegisterController);
router.post('/update', updateCompanyController);
router.post('/delete', deleteCompanyController);

export default router;
