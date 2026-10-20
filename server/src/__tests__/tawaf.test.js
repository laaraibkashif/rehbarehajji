const request = require("supertest");
const app = require("../app");
const TawafCount = require("../models/TawafCount");
const jwt = require("jsonwebtoken");

jest.mock("../models/TawafCount");
jest.mock("jsonwebtoken");

const authHeader = () => "Bearer fake-jwt-token";

// Shared mock record helper
const mockRecord = (overrides = {}) => ({
  _id: "count123",
  userId: "user123",
  type: "tawaf",
  count: 3,
  lastUpdated: new Date("2026-07-25T10:00:00Z"),
  ...overrides,
});

describe("GET /api/tawaf/:userId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ userId: "user123", role: "pilgrim" });
  });

  test("returns current count for a type", async () => {
    TawafCount.findOne.mockResolvedValue(mockRecord());

    const res = await request(app)
      .get("/api/tawaf/user123?type=tawaf")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    expect(res.body.type).toBe("tawaf");
    expect(TawafCount.findOne).toHaveBeenCalledWith({
      userId: "user123",
      type: "tawaf",
    });
  });

  test("returns zero-state when no record exists yet", async () => {
    TawafCount.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/tawaf/user123?type=sai")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.type).toBe("sai");
    expect(res.body.lastUpdated).toBeNull();
  });

  test("returns sai count separately from tawaf", async () => {
    TawafCount.findOne.mockResolvedValue(mockRecord({ type: "sai", count: 5 }));

    const res = await request(app)
      .get("/api/tawaf/user123?type=sai")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(5);
    expect(res.body.type).toBe("sai");
  });

  test("returns 400 for missing type query param", async () => {
    const res = await request(app)
      .get("/api/tawaf/user123")
      .set("Authorization", authHeader());

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid or missing.*type/i);
  });

  test("returns 400 for invalid type", async () => {
    const res = await request(app)
      .get("/api/tawaf/user123?type=invalid")
      .set("Authorization", authHeader());

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid or missing.*type/i);
  });

  test("returns 403 when userId does not match token", async () => {
    const res = await request(app)
      .get("/api/tawaf/other-user?type=tawaf")
      .set("Authorization", authHeader());

    expect(res.status).toBe(403);
  });

  test("returns 401 without auth token", async () => {
    const res = await request(app).get("/api/tawaf/user123?type=tawaf");

    expect(res.status).toBe(401);
  });
});

describe("POST /api/tawaf/:userId/increment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ userId: "user123", role: "pilgrim" });
  });

  test("increments count by 1 (upsert)", async () => {
    TawafCount.findOneAndUpdate.mockResolvedValue(
      mockRecord({ count: 4 })
    );

    const res = await request(app)
      .post("/api/tawaf/user123/increment?type=tawaf")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(4);
    expect(TawafCount.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user123", type: "tawaf" },
      expect.objectContaining({ $inc: { count: 1 } }),
      expect.objectContaining({ upsert: true, new: true })
    );
  });

  test("increments sai separately from tawaf", async () => {
    TawafCount.findOneAndUpdate.mockResolvedValue(
      mockRecord({ type: "sai", count: 2 })
    );

    const res = await request(app)
      .post("/api/tawaf/user123/increment?type=sai")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.type).toBe("sai");
    expect(TawafCount.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user123", type: "sai" },
      expect.any(Object),
      expect.any(Object)
    );
  });

  test("increment from zero creates record at count 1", async () => {
    TawafCount.findOneAndUpdate.mockResolvedValue(
      mockRecord({ count: 1 })
    );

    const res = await request(app)
      .post("/api/tawaf/user123/increment?type=tawaf")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test("increment past 7 still returns the count", async () => {
    TawafCount.findOneAndUpdate.mockResolvedValue(
      mockRecord({ count: 10 })
    );

    const res = await request(app)
      .post("/api/tawaf/user123/increment?type=tawaf")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(10);
  });

  test("returns 400 for missing type query param", async () => {
    const res = await request(app)
      .post("/api/tawaf/user123/increment")
      .set("Authorization", authHeader());

    expect(res.status).toBe(400);
  });

  test("returns 403 when userId does not match token", async () => {
    const res = await request(app)
      .post("/api/tawaf/other-user/increment?type=tawaf")
      .set("Authorization", authHeader());

    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/tawaf/:userId/reset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ userId: "user123", role: "pilgrim" });
  });

  test("resets count to 0", async () => {
    TawafCount.findOneAndUpdate.mockResolvedValue(
      mockRecord({ count: 0 })
    );

    const res = await request(app)
      .patch("/api/tawaf/user123/reset?type=tawaf")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(TawafCount.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user123", type: "tawaf" },
      expect.objectContaining({ $set: expect.objectContaining({ count: 0 }) }),
      expect.objectContaining({ upsert: true, new: true })
    );
  });

  test("resets sai without affecting tawaf", async () => {
    TawafCount.findOneAndUpdate.mockResolvedValue(
      mockRecord({ type: "sai", count: 0 })
    );

    const res = await request(app)
      .patch("/api/tawaf/user123/reset?type=sai")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.type).toBe("sai");
    expect(TawafCount.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user123", type: "sai" },
      expect.any(Object),
      expect.any(Object)
    );
  });

  test("reset on already-zero record is idempotent", async () => {
    TawafCount.findOneAndUpdate.mockResolvedValue(
      mockRecord({ count: 0 })
    );

    const res = await request(app)
      .patch("/api/tawaf/user123/reset?type=tawaf")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  test("upserts a new record if none exists yet", async () => {
    TawafCount.findOneAndUpdate.mockResolvedValue(
      mockRecord({ count: 0 })
    );

    const res = await request(app)
      .patch("/api/tawaf/user123/reset?type=tawaf")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    // upsert: true should be passed
    expect(TawafCount.findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.objectContaining({ upsert: true })
    );
  });

  test("returns 400 for missing type query param", async () => {
    const res = await request(app)
      .patch("/api/tawaf/user123/reset")
      .set("Authorization", authHeader());

    expect(res.status).toBe(400);
  });

  test("returns 403 when userId does not match token", async () => {
    const res = await request(app)
      .patch("/api/tawaf/other-user/reset?type=tawaf")
      .set("Authorization", authHeader());

    expect(res.status).toBe(403);
  });
});
