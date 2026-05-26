# CinemaVault Phase 1 Backend Scaffold Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the initial TypeScript Express API scaffold for CinemaVault without implementing feature endpoints yet.

**Architecture:** The backend uses a separate Express `app.ts` for configuration and `server.ts` for process startup. Prisma owns SQLite persistence, while feature folders reserve clean module boundaries for later auth, RBAC, OpenAPI, tests, and frontend integration.

**Tech Stack:** Node.js, TypeScript, Express, Prisma, SQLite, Zod.

---

### Task 1: Project Baseline

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`

**Steps:**
1. Define runtime and development dependencies for Express, Prisma, SQLite, Zod, and TypeScript.
2. Configure strict TypeScript output to `dist`.
3. Ignore local secrets, dependencies, generated output, coverage, logs, and local SQLite files.
4. Provide example environment variables for local setup.

### Task 2: Express App Skeleton

**Files:**
- Create: `src/app.ts`
- Create: `src/server.ts`
- Create: `src/config/env.ts`
- Create: `src/config/cors.ts`
- Create: `src/middleware/errorHandler.ts`
- Create: `src/middleware/notFound.ts`
- Create: `src/routes/health.routes.ts`

**Steps:**
1. Configure JSON, Helmet, CORS, health route, 404 handling, and central error handling in `app.ts`.
2. Keep `server.ts` limited to listening on the configured port.
3. Use Zod to validate environment configuration.

### Task 3: Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/db/prisma.ts`

**Steps:**
1. Configure SQLite datasource and Prisma Client generator.
2. Add `User`, `Film`, `Favourite`, `WatchlistItem`, `WatchedRecord`, and `Message` models.
3. Include future-safe fields for profile photos, OMDB metadata, and live film state.

### Task 4: Module Placeholders and README

**Files:**
- Create module placeholder files under `src/modules/*`.
- Create: `README.md`

**Steps:**
1. Add placeholders that document future module responsibility without implementing endpoints.
2. Document install, environment setup, Prisma migration, development, build, and production commands.

### Task 5: Verification

**Commands:**
- `npm install`
- `npx prisma validate`
- `npm run build`

**Expected:**
- Dependencies install successfully.
- Prisma schema validates.
- TypeScript build exits with code 0.

---

# CinemaVault Phase 1 Backend Scaffold Implementation Plan
# CinemaVault 第一階段後端腳手架實作計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **給 Claude：** 必備次級技能：使用 superpowers:executing-plans 來逐項實作此計畫。

**Goal:** Create the initial TypeScript Express API scaffold for CinemaVault without implementing feature endpoints yet.
**目標：** 建立 CinemaVault 的初始 TypeScript Express API 腳手架，暫不實作功能端點。

**Architecture:** The backend uses a separate Express `app.ts` for configuration and `server.ts` for process startup. Prisma owns SQLite persistence, while feature folders reserve clean module boundaries for later auth, RBAC, OpenAPI, tests, and frontend integration.
**架構：** 後端使用獨立的 Express `app.ts` 進行設定，並使用 `server.ts` 啟動程序。Prisma 負責 SQLite 持久化層，而功能資料夾則保留清晰的模組邊界，以供日後身分驗證、RBAC、OpenAPI、測試和前端整合使用。

**Tech Stack:** Node.js, TypeScript, Express, Prisma, SQLite, Zod.
**技術堆疊：** Node.js, TypeScript, Express, Prisma, SQLite, Zod。

---

### Task 1: Project Baseline
### 任務 1：專案基準

**Files:**
**檔案：**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`

**Steps:**
**步驟：**
1. Define runtime and development dependencies for Express, Prisma, SQLite, Zod, and TypeScript.
1. 定義 Express、Prisma、SQLite、Zod 和 TypeScript 的執行時與開發依賴套件。
2. Configure strict TypeScript output to `dist`.
2. 設定嚴格的 TypeScript 輸出至 `dist` 目錄。
3. Ignore local secrets, dependencies, generated output, coverage, logs, and local SQLite files.
3. 忽略本機機密資訊、依賴套件、產生出來的輸出檔、覆蓋率報告、日誌以及本機 SQLite 檔案。
4. Provide example environment variables for local setup.
4. 提供用於本機設定的環境變數範例。

### Task 2: Express App Skeleton
### 任務 2：Express 應用程式骨架

**Files:**
**檔案：**
- Create: `src/app.ts`
- Create: `src/server.ts`
- Create: `src/config/env.ts`
- Create: `src/config/cors.ts`
- Create: `src/middleware/errorHandler.ts`
- Create: `src/middleware/notFound.ts`
- Create: `src/routes/health.routes.ts`

**Steps:**
**步驟：**
1. Configure JSON, Helmet, CORS, health route, 404 handling, and central error handling in `app.ts`.
1. 在 `app.ts` 中設定 JSON 解析、Helmet、CORS、健康檢查路由、404 處裡以及集中式錯誤處理。
2. Keep `server.ts` limited to listening on the configured port.
2. 保持 `server.ts` 僅限於監聽設定的連接埠。
3. Use Zod to validate environment configuration.
3. 使用 Zod 來驗證環境設定。

### Task 3: Prisma Schema
### 任務 3：Prisma 結構描述 (Schema)

**Files:**
**檔案：**
- Create: `prisma/schema.prisma`
- Create: `src/db/prisma.ts`

**Steps:**
**步驟：**
1. Configure SQLite datasource and Prisma Client generator.
1. 設定 SQLite 資料來源和 Prisma Client 產生器。
2. Add `User`, `Film`, `Favourite`, `WatchlistItem`, `WatchedRecord`, and `Message` models.
2. 新增 `User`（使用者）、`Film`（電影）、`Favourite`（最愛）、`WatchlistItem`（待看清單項目）、`WatchedRecord`（觀看紀錄）以及 `Message`（訊息）模型。
3. Include future-safe fields for profile photos, OMDB metadata, and live film state.
3. 加入支援未來擴充的欄位，例如個人資料相片、OMDB 詮釋資料 (metadata) 以及即時電影狀態。

### Task 4: Module Placeholders and README
### 任務 4：模組佔位檔與 README

**Files:**
**檔案：**
- Create module placeholder files under `src/modules/*`.
- 建立 `src/modules/*` 下的模組佔位檔案。
- Create: `README.md`

**Steps:**
**步驟：**
1. Add placeholders that document future module responsibility without implementing endpoints.
1. 新增佔位檔案用以記錄未來模組的職責，暫不實作端點。
2. Document install, environment setup, Prisma migration, development, build, and production commands.
2. 記錄安裝、環境設定、Prisma 遷移、開發、建置以及生產指令。

### Task 5: Verification
### 任務 5：驗證

**Commands:**
**指令：**
- `npm install`
- `npx prisma validate`
- `npm run build`

**Expected:**
**預期結果：**
- Dependencies install successfully.
- 依賴套件安裝成功。
- Prisma schema validates.
- Prisma 結構描述驗證通過。
- TypeScript build exits with code 0.
- TypeScript 建置成功並以代碼 0 結束。
