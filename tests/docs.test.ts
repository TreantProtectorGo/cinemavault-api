import request from "supertest";
import { app } from "../src/app.js";

describe("API documentation", () => {
  it("serves the API documentation UI", async () => {
    const response = await request(app).get("/api-docs");

    expect(response.status).toBe(200);
    expect(response.type).toContain("html");
    expect(response.text).toContain("CinemaVault API Documentation");
  });

  it("serves the OpenAPI JSON document", async () => {
    const response = await request(app).get("/api-docs/openapi.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toMatch(/^3\./);
    expect(response.body.paths["/api/v1/films/import-omdb"]).toBeDefined();
  });
});
