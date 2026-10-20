const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Mock the User model
jest.mock("../models/User");

// Mock bcrypt
jest.mock("bcrypt");

// Mock jsonwebtoken
jest.mock("jsonwebtoken");

describe("POST /api/auth/register", () => {
  const validBody = {
    fullName: "Amina Khan",
    email: "amina@example.com",
    password: "secret123",
    phone: "+1234567890",
    country: "Saudi Arabia",
    preferredLanguage: "en",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("successful registration — returns 201 with user info", async () => {
    // Simulate no existing user
    User.findOne.mockResolvedValue(null);
    // Simulate hash
    bcrypt.genSalt.mockResolvedValue("somesalt");
    bcrypt.hash.mockResolvedValue("hashed_password");
    // Simulate user creation
    const mockUser = {
      _id: "user123",
      fullName: validBody.fullName,
      email: validBody.email,
    };
    User.create.mockResolvedValue(mockUser);

    const res = await request(app)
      .post("/api/auth/register")
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe(
      "Account created successfully. Please verify your email."
    );
    expect(res.body.user.fullName).toBe("Amina Khan");
    expect(res.body.user.email).toBe("amina@example.com");
    expect(User.findOne).toHaveBeenCalledWith({ email: "amina@example.com" });
    expect(User.create).toHaveBeenCalled();
  });

  test("duplicate email — returns 409 with correct message", async () => {
    // Simulate existing user
    User.findOne.mockResolvedValue({ _id: "existing", email: "amina@example.com" });

    const res = await request(app)
      .post("/api/auth/register")
      .send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Account already exists. Please Login.");
    expect(User.create).not.toHaveBeenCalled();
  });

  test("missing fullName — returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com", password: "secret123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/full name/i);
  });

  test("invalid email — returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ fullName: "Test", email: "not-an-email", password: "secret123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid email/i);
  });

  test("short password — returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ fullName: "Test", email: "test@example.com", password: "12345" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 6/i);
  });
});

describe("POST /api/auth/login", () => {
  const credentials = { email: "amina@example.com", password: "secret123" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("successful login — returns 200 with token and user info", async () => {
    const mockUser = {
      _id: "user123",
      fullName: "Amina Khan",
      email: "amina@example.com",
      role: "pilgrim",
      preferredLanguage: "en",
      passwordHash: "hashed_password",
    };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("fake-jwt-token");

    const res = await request(app)
      .post("/api/auth/login")
      .send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful.");
    expect(res.body.token).toBe("fake-jwt-token");
    expect(res.body.user.email).toBe("amina@example.com");
    expect(res.body.user.role).toBe("pilgrim");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  test("wrong password — returns 401", async () => {
    const mockUser = {
      _id: "user123",
      email: "amina@example.com",
      passwordHash: "hashed_password",
    };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post("/api/auth/login")
      .send(credentials);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password.");
  });

  test("non-existent email — returns 401", async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send(credentials);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password.");
  });

  test("invalid email format — returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bad-email", password: "secret123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid email/i);
  });

  test("short password — returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 6/i);
  });
});

describe("POST /api/auth/verify", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("correct code — marks user as verified", async () => {
    const mockUser = {
      _id: "user123",
      email: "amina@example.com",
      isVerified: false,
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(mockUser);

    const res = await request(app)
      .post("/api/auth/verify")
      .send({ email: "amina@example.com", code: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Account verified successfully.");
    expect(mockUser.isVerified).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();
  });

  test("wrong code — returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/verify")
      .send({ email: "amina@example.com", code: "wrong" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Incorrect code.");
  });

  test("already verified — returns 200 with info message", async () => {
    const mockUser = {
      _id: "user123",
      email: "amina@example.com",
      isVerified: true,
      save: jest.fn(),
    };
    User.findOne.mockResolvedValue(mockUser);

    const res = await request(app)
      .post("/api/auth/verify")
      .send({ email: "amina@example.com", code: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Account already verified.");
    expect(mockUser.save).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/logout", () => {
  test("returns 200 with success message when authenticated", async () => {
    jest.spyOn(jwt, "verify").mockReturnValue({
      userId: "user123",
      role: "pilgrim",
    });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out successfully.");
  });

  test("returns 401 when no token provided", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required.");
  });
});
