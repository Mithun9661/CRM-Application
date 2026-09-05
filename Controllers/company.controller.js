const Company = require("../Models/company.model");

/**
 * Create a new company
 */
exports.createCompany = async (req, res) => {
  try {
    const {
      companyName,
      companyCode,
      email,
      phone,
      address,
      industry,
    } = req.body;

    if (!companyName || !companyCode || !email) {
      return res.status(400).send({
        message: "companyName, companyCode and email are required",
      });
    }

    const existingCompany = await Company.findOne({
      $or: [
        { companyName: companyName.trim() },
        { companyCode: companyCode.trim().toUpperCase() },
      ],
    });

    if (existingCompany) {
      return res.status(409).send({
        message: "Company with same name or company code already exists",
      });
    }

    const company = await Company.create({
      companyName,
      companyCode,
      email,
      phone,
      address,
      industry,
    });

    return res.status(201).send({
      message: "Company created successfully",
      company,
    });
  } catch (error) {
    console.error("Create Company Error:", error);

    return res.status(500).send({
      message: "Internal server error while creating company",
    });
  }
};

/**
 * Get all companies
 */
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({
      createdAt: -1,
    });

    return res.status(200).send({
      totalCompanies: companies.length,
      companies,
    });
  } catch (error) {
    console.error("Get Companies Error:", error);

    return res.status(500).send({
      message: "Internal server error while fetching companies",
    });
  }
};

/**
 * Get company by ID
 */
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).send({
        message: "Company not found",
      });
    }

    return res.status(200).send(company);
  } catch (error) {
    console.error("Get Company Error:", error);

    return res.status(500).send({
      message: "Internal server error while fetching company",
    });
  }
};

/**
 * Update company
 */
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!company) {
      return res.status(404).send({
        message: "Company not found",
      });
    }

    return res.status(200).send({
      message: "Company updated successfully",
      company,
    });
  } catch (error) {
    console.error("Update Company Error:", error);

    return res.status(500).send({
      message: "Internal server error while updating company",
    });
  }
};

/**
 * Change company status
 */
exports.updateCompanyStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE", "PENDING"].includes(status)) {
      return res.status(400).send({
        message: "Invalid company status",
      });
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!company) {
      return res.status(404).send({
        message: "Company not found",
      });
    }

    return res.status(200).send({
      message: "Company status updated successfully",
      company,
    });
  } catch (error) {
    console.error("Update Company Status Error:", error);

    return res.status(500).send({
      message: "Internal server error while updating company status",
    });
  }
};