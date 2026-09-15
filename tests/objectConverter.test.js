const objectConverter = require("../utils/objectConverter");

describe("objectConverter.userResponse", () => {
  test("returns safe CRM user fields without exposing password", () => {
    const input = [
      {
        _id: "user-1",
        name: "Demo User",
        userId: "demo",
        email: "demo@example.com",
        userType: "CUSTOMER",
        userStatus: "APPROVED",
        companyId: "company-1",
        departmentId: null,
        password: "hashed-secret",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z")
      }
    ];

    const result = objectConverter.userResponse(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      userId: "demo",
      email: "demo@example.com",
      userType: "CUSTOMER",
      companyId: "company-1"
    });
    expect(result[0]).not.toHaveProperty("password");
  });
});
