const { sameCompany, canAccessTicket } = require("../utils/ticketAccess");
const constants = require("../utils/constants");

describe("tenant-aware ticket access", () => {
  const companyA = "64b000000000000000000001";
  const companyB = "64b000000000000000000002";
  const ticket = {
    companyId: companyA,
    reporter: "customer_a",
    assignee: "engineer_a"
  };

  test("sameCompany compares ids safely", () => {
    expect(sameCompany(companyA, companyA)).toBe(true);
    expect(sameCompany(companyA, companyB)).toBe(false);
    expect(sameCompany(null, companyA)).toBe(false);
  });

  test("super admin can access tickets across companies", () => {
    expect(canAccessTicket({ userType: constants.userType.superAdmin, companyId: null }, ticket)).toBe(true);
  });

  test("company admin can access tickets only in own company", () => {
    expect(canAccessTicket({ userType: constants.userType.admin, companyId: companyA }, ticket)).toBe(true);
    expect(canAccessTicket({ userType: constants.userType.admin, companyId: companyB }, ticket)).toBe(false);
  });

  test("engineer can access only assigned ticket in own company", () => {
    expect(canAccessTicket({ userType: constants.userType.engineer, companyId: companyA, userId: "engineer_a" }, ticket)).toBe(true);
    expect(canAccessTicket({ userType: constants.userType.engineer, companyId: companyA, userId: "engineer_other" }, ticket)).toBe(false);
    expect(canAccessTicket({ userType: constants.userType.engineer, companyId: companyB, userId: "engineer_a" }, ticket)).toBe(false);
  });

  test("customer can access only own ticket in own company", () => {
    expect(canAccessTicket({ userType: constants.userType.customer, companyId: companyA, userId: "customer_a" }, ticket)).toBe(true);
    expect(canAccessTicket({ userType: constants.userType.customer, companyId: companyA, userId: "customer_other" }, ticket)).toBe(false);
    expect(canAccessTicket({ userType: constants.userType.customer, companyId: companyB, userId: "customer_a" }, ticket)).toBe(false);
  });
});
