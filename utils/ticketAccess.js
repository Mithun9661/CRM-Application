const constants = require("./constants");

const sameCompany = (a, b) => String(a || "") === String(b || "");

const canAccessTicket = (user, ticket) => {
  if (!user || !ticket) return false;
  if (user.userType === constants.userType.superAdmin) return true;
  if (!sameCompany(user.companyId, ticket.companyId)) return false;
  if (user.userType === constants.userType.admin) return true;
  if (user.userType === constants.userType.engineer) return ticket.assignee === user.userId;
  return ticket.reporter === user.userId;
};

module.exports = { sameCompany, canAccessTicket };
