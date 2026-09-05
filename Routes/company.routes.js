const express = require("express");

const router = express.Router();

const companyController = require("../Controllers/company.controller");
const authMW = require("../middlewares/authjwt");

/**
 * Create Company
 */
router.post(
  "/companies",
  [authMW.verifyToken, authMW.isSuperAdmin],
  companyController.createCompany
);

/**
 * Get All Companies
 */
router.get(
  "/companies",
  [authMW.verifyToken, authMW.isSuperAdmin],
  companyController.getAllCompanies
);

/**
 * Get Company By ID
 */
router.get(
  "/companies/:id",
  [authMW.verifyToken, authMW.isSuperAdmin],
  companyController.getCompanyById
);

/**
 * Update Company
 */
router.put(
  "/companies/:id",
  [authMW.verifyToken, authMW.isSuperAdmin],
  companyController.updateCompany
);

/**
 * Update Company Status
 */
router.patch(
  "/companies/:id/status",
  [authMW.verifyToken, authMW.isSuperAdmin],
  companyController.updateCompanyStatus
);

module.exports = router;