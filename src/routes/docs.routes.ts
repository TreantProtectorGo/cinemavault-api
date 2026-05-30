import { readFileSync } from "node:fs";
import { Router } from "express";

const openApiSpecPath = new URL("../../docs/openapi.json", import.meta.url);
const openApiSpec = JSON.parse(readFileSync(openApiSpecPath, "utf8")) as unknown;

export const docsRouter = Router();

docsRouter.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

docsRouter.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>CinemaVault API Documentation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; font-family: Arial, sans-serif; }
      header { padding: 16px 24px; border-bottom: 1px solid #ddd; }
      h1 { margin: 0; font-size: 20px; }
    </style>
  </head>
  <body>
    <header><h1>CinemaVault API Documentation</h1></header>
    <redoc spec-url="/api-docs/openapi.json"></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
  </body>
</html>`);
});
