import { readFileSync } from "node:fs";
import request from "supertest";
import { app } from "../src/app.js";

const openApiSpec = JSON.parse(readFileSync("docs/openapi.json", "utf8")) as {
  openapi: string;
  paths: Record<string, unknown>;
};

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

  it("has valid OpenAPI JSON with all key implemented paths", () => {
    const requiredPaths = [
      "/api-docs",
      "/api-docs/openapi.json",
      "/api/v1/health",
      "/api/v1/auth/register",
      "/api/v1/auth/login",
      "/api/v1/auth/basic-check",
      "/api/v1/admin/ping",
      "/api/v1/films",
      "/api/v1/films/{id}",
      "/api/v1/films/import-omdb",
      "/api/v1/favourites",
      "/api/v1/favourites/{filmId}",
      "/api/v1/watchlist",
      "/api/v1/watchlist/{filmId}",
      "/api/v1/watched",
      "/api/v1/watched/{filmId}",
      "/api/v1/messages",
      "/api/v1/admin/messages",
      "/api/v1/admin/messages/{id}/reply",
      "/api/v1/admin/messages/{id}"
    ];

    expect(openApiSpec.openapi).toMatch(/^3\./);
    for (const path of requiredPaths) {
      expect(openApiSpec.paths[path]).toBeDefined();
    }
  });
});
