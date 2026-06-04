import { readFileSync } from "node:fs";
import { Router } from "express";
import helmet from "helmet";
import swaggerUi, { type JsonObject, type SwaggerUiOptions } from "swagger-ui-express";

const openApiSpecPath = new URL("../../docs/openapi.json", import.meta.url);
const openApiSpec = JSON.parse(readFileSync(openApiSpecPath, "utf8")) as JsonObject;

export const docsRouter = Router();

const docsContentSecurityPolicy = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", "data:"],
    imgSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"]
  }
});

docsRouter.use(docsContentSecurityPolicy);

docsRouter.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

const swaggerUiOptions: SwaggerUiOptions = {
  customSiteTitle: "CinemaVault API Documentation",
  customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 32px 0; }
    `,
  swaggerOptions: {
    persistAuthorization: true
  }
};

const swaggerHtml = swaggerUi
  .generateHTML(openApiSpec, swaggerUiOptions)
  .replaceAll('href="./', 'href="/api-docs/')
  .replaceAll('src="./', 'src="/api-docs/');

docsRouter.get("/", (_req, res) => {
  res.type("html").send(swaggerHtml);
});
docsRouter.use("/", swaggerUi.serveFiles(openApiSpec, swaggerUiOptions));
