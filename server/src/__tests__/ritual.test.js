const request = require("supertest");
const app = require("../app");
const RitualStep = require("../models/RitualStep");
const jwt = require("jsonwebtoken");

// Mock RitualStep only (this route is public, no auth needed)
jest.mock("../models/RitualStep");
jest.mock("jsonwebtoken");

// Sample ritual steps
const mockHajjSteps = [
  {
    _id: "step1",
    ritualType: "hajj",
    order: 1,
    name: "Ihram",
    description: "Enter the state of Ihram at the Miqat.",
    location: "Miqat",
    commonErrors: ["Forgetting to make niyyah"],
  },
  {
    _id: "step2",
    ritualType: "hajj",
    order: 2,
    name: "Tawaf",
    description: "Circumambulate the Kaaba 7 times.",
    location: "Masjid al-Haram",
    commonErrors: ["Facing the Kaaba incorrectly"],
  },
  {
    _id: "step3",
    ritualType: "hajj",
    order: 3,
    name: "Sa'i",
    description: "Walk between Safa and Marwah 7 times.",
    location: "Masjid al-Haram",
    commonErrors: ["Walking too fast"],
  },
];

const mockUmrahSteps = [
  {
    _id: "step4",
    ritualType: "umrah",
    order: 1,
    name: "Ihram",
    description: "Enter the state of Ihram at the Miqat.",
    location: "Miqat",
    commonErrors: [],
  },
  {
    _id: "step5",
    ritualType: "umrah",
    order: 2,
    name: "Tawaf",
    description: "Circumambulate the Kaaba 7 times.",
    location: "Masjid al-Haram",
    commonErrors: [],
  },
];

describe("GET /api/rituals/:type", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns hajj steps sorted by order", async () => {
    RitualStep.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockHajjSteps),
    });

    const res = await request(app).get("/api/rituals/hajj");

    expect(res.status).toBe(200);
    expect(res.body.ritualType).toBe("hajj");
    expect(res.body.count).toBe(3);
    expect(res.body.steps).toHaveLength(3);
    expect(res.body.steps[0].name).toBe("Ihram");
    expect(res.body.steps[1].name).toBe("Tawaf");
    expect(res.body.steps[2].name).toBe("Sa'i");
    expect(RitualStep.find).toHaveBeenCalledWith({ ritualType: "hajj" });
  });

  test("returns umrah steps sorted by order", async () => {
    RitualStep.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockUmrahSteps),
    });

    const res = await request(app).get("/api/rituals/umrah");

    expect(res.status).toBe(200);
    expect(res.body.ritualType).toBe("umrah");
    expect(res.body.count).toBe(2);
    expect(res.body.steps).toHaveLength(2);
    expect(res.body.steps[0].name).toBe("Ihram");
    expect(res.body.steps[1].name).toBe("Tawaf");
    expect(RitualStep.find).toHaveBeenCalledWith({ ritualType: "umrah" });
  });

  test("returns empty array when no steps found for type", async () => {
    RitualStep.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app).get("/api/rituals/hajj");

    expect(res.status).toBe(200);
    expect(res.body.steps).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  test("returns 400 for invalid ritual type", async () => {
    const res = await request(app).get("/api/rituals/invalid");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid ritual type/i);
  });

  test("each step includes name, description, location, and media fields", async () => {
    const richSteps = [
      {
        _id: "step1",
        ritualType: "hajj",
        order: 1,
        name: "Ihram",
        description: "Enter Ihram.",
        location: "Miqat",
        mediaUrls: { image: "/img/ihram.jpg", video: "", audioDua: "" },
        commonErrors: [],
      },
    ];
    RitualStep.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(richSteps),
    });

    const res = await request(app).get("/api/rituals/hajj");

    expect(res.status).toBe(200);
    const step = res.body.steps[0];
    expect(step).toHaveProperty("name");
    expect(step).toHaveProperty("description");
    expect(step).toHaveProperty("location");
    expect(step).toHaveProperty("mediaUrls");
    expect(step.mediaUrls).toHaveProperty("image");
    expect(step.mediaUrls).toHaveProperty("video");
    expect(step.mediaUrls).toHaveProperty("audioDua");
  });
});
