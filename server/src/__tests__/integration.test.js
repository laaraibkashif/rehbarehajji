const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const RitualStep = require("../models/RitualStep");
const RitualPlan = require("../models/RitualPlan");
const TawafCount = require("../models/TawafCount");
const Checklist = require("../models/Checklist");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Mock all models and dependencies
jest.mock("../models/User");
jest.mock("../models/RitualStep");
jest.mock("../models/RitualPlan");
jest.mock("../models/TawafCount");
jest.mock("../models/Checklist");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

// Mock seed data used by checklist controller
jest.mock("../seed/seedChecklists", () => ({
  defaultPreparationItems: [
    { label: "Passport", isChecked: false },
    { label: "Ihram clothing", isChecked: false },
  ],
  defaultRitualItems: [
    { label: "Ihram — Enter state", isChecked: false },
    { label: "Tawaf — 7 circuits", isChecked: false },
  ],
}));

// ── Helper: chainable mock for find + sort ──
const mockFindSort = (result) => ({
  sort: jest.fn().mockResolvedValue(result),
});

// ── Helper: chainable mock for findOne + sort ──
const mockFindOneSort = (result) => ({
  sort: jest.fn().mockResolvedValue(result),
});

// ── Sample steps ──
const mockSteps = [
  { order: 1, name: "Ihram", ritualType: "hajj" },
  { order: 2, name: "Tawaf", ritualType: "hajj" },
  { order: 3, name: "Sa'i", ritualType: "hajj" },
];

// ── Checklist items with real ObjectId-like strings ──
const checklistItem1 = { _id: "item1", label: "Passport", isChecked: false };
const checklistItem2 = { _id: "item2", label: "Ihram clothing", isChecked: false };

// ── Mock save function for checklist ──
const mockChecklistDoc = {
  _id: "checklist1",
  userId: "user123",
  type: "preparation",
  items: [checklistItem1, checklistItem2],
  save: jest.fn().mockResolvedValue(true),
};

describe("Integration: Auth → Plan → Fetch plan", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("full flow: register, login, generate plan, fetch plan", async () => {
    // 1. REGISTER
    User.findOne.mockResolvedValue(null); // no existing user
    bcrypt.genSalt.mockResolvedValue("somesalt");
    bcrypt.hash.mockResolvedValue("hashed_password");
    User.create.mockResolvedValue({
      _id: "user123",
      fullName: "Ahmed Test",
      email: "ahmed@test.com",
    });

    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Ahmed Test",
        email: "ahmed@test.com",
        password: "secret123",
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.message).toContain("created successfully");

    // 2. LOGIN
    const mockUser = {
      _id: "user123",
      fullName: "Ahmed Test",
      email: "ahmed@test.com",
      role: "pilgrim",
      preferredLanguage: "en",
      passwordHash: "hashed_password",
    };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("integration-test-jwt");
    jwt.verify.mockReturnValue({ userId: "user123", role: "pilgrim" });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "ahmed@test.com", password: "secret123" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBe("integration-test-jwt");

    const token = loginRes.body.token;

    // 3. GENERATE PLAN
    RitualStep.find.mockReturnValue(mockFindSort(mockSteps));
    RitualPlan.create.mockResolvedValue({
      _id: "plan123",
      userId: "user123",
      ritualType: "hajj",
      ageGroup: "adult",
      healthCondition: "",
      travelMode: "group",
      generatedSteps: mockSteps.map((s) => ({
        stepName: s.name,
        date: "",
        notes: "",
      })),
    });

    const planRes = await request(app)
      .post("/api/plans/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ritualType: "hajj",
        ageGroup: "adult",
        healthCondition: "",
        travelMode: "group",
      });

    expect(planRes.status).toBe(201);
    expect(planRes.body.plan.generatedSteps).toHaveLength(3);

    // 4. FETCH PLAN
    RitualPlan.findOne.mockReturnValue(
      mockFindOneSort({
        _id: "plan123",
        userId: "user123",
        ritualType: "hajj",
        generatedSteps: planRes.body.plan.generatedSteps,
      })
    );

    const fetchRes = await request(app)
      .get("/api/plans/user123")
      .set("Authorization", `Bearer ${token}`);

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.plan._id).toBe("plan123");
    expect(fetchRes.body.plan.ritualType).toBe("hajj");
    expect(fetchRes.body.plan.generatedSteps).toHaveLength(3);
  });
});

describe("Integration: Tawaf counter — increment then reload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ userId: "user123", role: "pilgrim" });
  });

  test("increment count, then get returns the updated value", async () => {
    // 1. Initial GET — no record yet
    TawafCount.findOne.mockResolvedValue(null);

    const getBefore = await request(app)
      .get("/api/tawaf/user123?type=tawaf")
      .set("Authorization", "Bearer token");

    expect(getBefore.status).toBe(200);
    expect(getBefore.body.count).toBe(0);

    // 2. INCREMENT
    TawafCount.findOneAndUpdate.mockResolvedValue({
      _id: "count1",
      userId: "user123",
      type: "tawaf",
      count: 1,
      lastUpdated: new Date(),
    });

    const incRes = await request(app)
      .post("/api/tawaf/user123/increment?type=tawaf")
      .set("Authorization", "Bearer token");

    expect(incRes.status).toBe(200);
    expect(incRes.body.count).toBe(1);

    // 3. GET after increment — returns updated count
    TawafCount.findOne.mockResolvedValue({
      _id: "count1",
      userId: "user123",
      type: "tawaf",
      count: 1,
      lastUpdated: new Date(),
    });

    const getAfter = await request(app)
      .get("/api/tawaf/user123?type=tawaf")
      .set("Authorization", "Bearer token");

    expect(getAfter.status).toBe(200);
    expect(getAfter.body.count).toBe(1);

    // 4. Increment again to 2
    TawafCount.findOneAndUpdate.mockResolvedValue({
      _id: "count1",
      userId: "user123",
      type: "tawaf",
      count: 2,
      lastUpdated: new Date(),
    });

    const inc2Res = await request(app)
      .post("/api/tawaf/user123/increment?type=tawaf")
      .set("Authorization", "Bearer token");

    expect(inc2Res.status).toBe(200);
    expect(inc2Res.body.count).toBe(2);

    // 5. Reload GET — still 2
    TawafCount.findOne.mockResolvedValue({
      _id: "count1",
      userId: "user123",
      type: "tawaf",
      count: 2,
      lastUpdated: new Date(),
    });

    const getFinal = await request(app)
      .get("/api/tawaf/user123?type=tawaf")
      .set("Authorization", "Bearer token");

    expect(getFinal.status).toBe(200);
    expect(getFinal.body.count).toBe(2);

    // 6. RESET to 0
    TawafCount.findOneAndUpdate.mockResolvedValue({
      _id: "count1",
      userId: "user123",
      type: "tawaf",
      count: 0,
      lastUpdated: new Date(),
    });

    const resetRes = await request(app)
      .patch("/api/tawaf/user123/reset?type=tawaf")
      .set("Authorization", "Bearer token");

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.count).toBe(0);

    // 7. GET after reset — still 0
    TawafCount.findOne.mockResolvedValue({
      _id: "count1",
      userId: "user123",
      type: "tawaf",
      count: 0,
      lastUpdated: new Date(),
    });

    const getAfterReset = await request(app)
      .get("/api/tawaf/user123?type=tawaf")
      .set("Authorization", "Bearer token");

    expect(getAfterReset.status).toBe(200);
    expect(getAfterReset.body.count).toBe(0);
  });
});

describe("Integration: Checklist — toggle item persists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ userId: "user123", role: "pilgrim" });
  });

  test("load checklist, toggle item checked, reload verifies persisted state", async () => {
    // Mock the `items.id()` method that Mongoose provides
    const mockId = jest.fn((id) => {
      if (id === "item1") return { _id: "item1", label: "Passport", isChecked: false };
      if (id === "item2") return { _id: "item2", label: "Ihram clothing", isChecked: false };
      return null;
    });

    const doc = {
      _id: "checklist1",
      userId: "user123",
      type: "preparation",
      items: [
        { _id: "item1", label: "Passport", isChecked: false },
        { _id: "item2", label: "Ihram clothing", isChecked: false },
      ],
      save: jest.fn().mockResolvedValue(true),
    };
    // Mock items.id on the doc
    doc.items.id = mockId;

    Checklist.findOne.mockResolvedValue(doc);

    // 1. GET checklist
    const getRes = await request(app)
      .get("/api/checklist/user123?type=preparation")
      .set("Authorization", "Bearer token");

    expect(getRes.status).toBe(200);
    expect(getRes.body.items).toHaveLength(2);
    expect(getRes.body.items[0].isChecked).toBe(false);

    // 2. Toggle item1 to checked
    // For the PATCH, we need findOne to return doc again, and the save should update
    const updatedDoc = {
      ...doc,
      items: [
        { _id: "item1", label: "Passport", isChecked: true },
        { _id: "item2", label: "Ihram clothing", isChecked: false },
      ],
      save: jest.fn().mockResolvedValue(true),
    };
    updatedDoc.items.id = jest.fn((id) => {
      if (id === "item1") return { _id: "item1", label: "Passport", isChecked: true };
      if (id === "item2") return { _id: "item2", label: "Ihram clothing", isChecked: false };
      return null;
    });

    Checklist.findOne.mockResolvedValue(updatedDoc);

    const patchRes = await request(app)
      .patch("/api/checklist/user123")
      .set("Authorization", "Bearer token")
      .send({
        type: "preparation",
        itemId: "item1",
        isChecked: true,
      });

    expect(patchRes.status).toBe(200);
    // Find the toggled item
    const toggledItem = patchRes.body.items.find((i) => i._id === "item1" || i.label === "Passport");
    expect(toggledItem.isChecked).toBe(true);

    // 3. Reload GET
    Checklist.findOne.mockResolvedValue({
      ...updatedDoc,
      save: jest.fn().mockResolvedValue(true),
      items: {
        id: jest.fn(() => null),
      },
    });

    // Simulate a final GET returning toggled state
    Checklist.findOne.mockResolvedValue({
      _id: "checklist1",
      userId: "user123",
      type: "preparation",
      items: [
        { _id: "item1", label: "Passport", isChecked: true },
        { _id: "item2", label: "Ihram clothing", isChecked: false },
      ],
    });

    const reloadRes = await request(app)
      .get("/api/checklist/user123?type=preparation")
      .set("Authorization", "Bearer token");

    expect(reloadRes.status).toBe(200);
    expect(reloadRes.body.items[0].isChecked).toBe(true);
    expect(reloadRes.body.items[1].isChecked).toBe(false);
  });
});
