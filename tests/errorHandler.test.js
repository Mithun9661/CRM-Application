const errorHandler = require("../middlewares/errorHandler");

describe("errorHandler", () => {
  const buildResponse = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  };

  test("maps duplicate key errors to 409", () => {
    const req = { method: "POST", originalUrl: "/crm/api/v1/test" };
    const res = buildResponse();
    const err = { code: 11000, message: "duplicate" };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "A record with the same unique value already exists"
    });
  });

  test("maps validation errors to 400", () => {
    const req = { method: "POST", originalUrl: "/crm/api/v1/test" };
    const res = buildResponse();
    const err = { name: "ValidationError", message: "invalid input" };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
