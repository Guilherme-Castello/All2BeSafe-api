import express from "express";
import companyListController from "../controllers/CompanyController.js";

const router = express.Router();

router.post('/companyList', companyListController);

export default router;
