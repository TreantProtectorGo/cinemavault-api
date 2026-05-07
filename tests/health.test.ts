import request from "supertest";
import { app } from "../src/app.js";

describe("GET /api/v1/health", () => {
  it("returns the public API health status without starting the server", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "cinemavault-api"
    });
  });
});
