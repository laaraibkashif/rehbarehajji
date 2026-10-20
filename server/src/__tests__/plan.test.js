const request = require("supertest");
const app = require("../app");
const RitualPlan = require("../models/RitualPlan");
const RitualStep = require("../models/RitualStep");
const jwt = require("jsonwebtoken");

// Mock models
jest.mock("../models/RitualPlan");
jest.mock("../models/RitualStep");
jest.mock("jsonwebtoken");

// Stub ritual steps for testing
const mockHajjSteps = [
  { order: 1, name: "Ihram", ritualType: "hajj" },
  { order: 2, name: "Tawaf", ritualType: "hajj" },
  { order: 3, name: "Sa'i", ritualType: "hajj" },
];

const authHeader = () => "Bearer fake-jwt-token";

describe("POST /api/plans/generate", () => {
  const validBody = {
    ritualType: "hajj",
    ageGroup: "adult",
    healthCondition: "",
    travelMode: "group",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ userId: "user123", role: "pilgrim" });
  });

  // Helper: chainable mongoose mock for find + sort
  const mockFindSort = (result) => ({
    sort: jest.fn().mockResolvedValue(result),
  });

  test("successfully generates a plan", async () => {
    RitualStep.find.mockReturnValue(mockFindSort(mockHajjSteps));
    const mockSavedPlan = {
      _id: "plan123",
      userId: "user123",
      ritualType: "hajj",
      ageGroup: "adult",
      healthCondition: "",
      travelMode: "group",
      generatedSteps: mockHajjSteps.map((s) => ({
        stepName: s.name,
        date: "",
        notes: "",
      })),
    };
    RitualPlan.create.mockResolvedValue(mockSavedPlan);

    const res = await request(app)
      .post("/api/plans/generate")
      .set("Authorization", authHeader())
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Plan generated successfully.");
    expect(res.body.plan.generatedSteps).toHaveLength(3);
    expect(RitualStep.find).toHaveBeenCalledWith({
      ritualType: "hajj",
    });
    expect(RitualPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user123",
        ritualType: "hajj",
      })
    );
  });

  test("adds senior pacing notes when ageGroup is 'senior'", async () => {
    RitualStep.find.mockReturnValue(mockFindSort(mockHajjSteps));
    RitualPlan.create.mockImplementation((data) =>
      Promise.resolve({ _id: "p2", ...data })
    );

    const res = await request(app)
      .post("/api/plans/generate")
      .set("Authorization", authHeader())
      .send({ ...validBody, ageGroup: "senior" });

    expect(res.status).toBe(201);
    // Every generated step for a senior should have the pacing note
    res.body.plan.generatedSteps.forEach((step) => {
      expect(step.notes).toContain("rest breaks");
    });
  });

  test("adds mobility note when healthCondition mentions mobility", async () => {
    RitualStep.find.mockReturnValue(mockFindSort(mockHajjSteps));
    RitualPlan.create.mockImplementation((data) =>
      Promise.resolve({ _id: "p3", ...data })
    );

    const res = await request(app)
      .post("/api/plans/generate")
      .set("Authorization", authHeader())
      .send({ ...validBody, healthCondition: "mobility issues, uses wheelchair" });

    expect(res.status).toBe(201);
    res.body.plan.generatedSteps.forEach((step) => {
      expect(step.notes).toContain("Wheelchair-accessible");
    });
  });

  test("returns 400 for invalid ritualType", async () => {
    const res = await request(app)
      .post("/api/plans/generate")
      .set("Authorization", authHeader())
      .send({ ...validBody, ritualType: "invalid" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or missing ritualType/i);
  });

  test("returns 400 for missing ageGroup", async () => {
    const res = await request(app)
      .post("/api/plans/generate")
      .set("Authorization", authHeader())
      .send({ ritualType: "hajj", travelMode: "solo" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or missing ageGroup/i);
  });

  test("returns 400 for missing travelMode", async () => {
    const res = await request(app)
      .post("/api/plans/generate")
      .set("Authorization", authHeader())
      .send({ ritualType: "hajj", ageGroup: "adult" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or missing travelMode/i);
  });

  test("returns 404 when no ritual steps exist", async () => {
    RitualStep.find.mockReturnValue(mockFindSort([]));

    const res = await request(app)
      .post("/api/plans/generate")
      .set("Authorization", authHeader())
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no ritual steps found/i);
  });

  test("returns 401 without auth token", async () => {
    const res = await request(app)
      .post("/api/plans/generate")
      .send(validBody);

    expect(res.status).toBe(401);
  });
});

describe("GET /api/plans/:userId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ userId: "user123", role: "pilgrim" });
  });

  test("returns the latest plan for the authenticated user", async () => {
    const mockPlan = {
      _id: "plan123",
      userId: "user123",
      ritualType: "hajj",
      generatedSteps: [{ stepName: "Ihram", date: "", notes: "" }],
    };
    RitualPlan.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockPlan),
    });

    const res = await request(app)
      .get("/api/plans/user123")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.plan._id).toBe("plan123");
    expect(RitualPlan.findOne).toHaveBeenCalledWith({ userId: "user123" });
  });

  test("returns 403 when userId does not match the token", async () => {
    const res = await request(app)
      .get("/api/plans/other-user")
      .set("Authorization", authHeader());

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/only view your own plan/i);
  });

  test("returns 404 when no plan exists", async () => {
    RitualPlan.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .get("/api/plans/user123")
      .set("Authorization", authHeader());

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no plan found/i);
  });

  test("returns 401 without auth token", async () => {
    const res = await request(app).get("/api/plans/user123");

    expect(res.status).toBe(401);
  });
});
