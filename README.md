# RescueNow Backend

Production-oriented Node.js API for **RescueNow** — an intelligent emergency response and accident alert system. It pairs users with the nearest available ambulance and hospital, drives real-time updates over Socket.io, and sends SMS alerts via Twilio (with console fallback when credentials are missing).

## Tech stack

- Node.js 18+, Express.js  
- MySQL 8 (`mysql2` promise pool)  
- Socket.io  
- JWT (`jsonwebtoken`), bcryptjs  
- Twilio (optional), dotenv, cors, morgan, express-validator  

## Project layout

```
config/         db.js, socket.js
controllers/    auth, user, hospital, ambulance, incident, notification, analytics
routes/         matching route modules (+ contactConditionRoutes for /contacts, /conditions)
middleware/     auth.js, errorHandler.js
services/       geoService, smsService, socketService
utils/          responseHelper.js
database/       schema.sql, seed.js
socket/         socketHandlers.js
server.js       entry point
```

## Setup

1. **Clone the repo and install dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your MySQL credentials and a strong `JWT_SECRET`. Twilio keys are optional; without them, SMS are printed to the server console and still logged in `notifications`.

3. **Create the database**

   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS emergency_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

4. **Apply schema**

   ```bash
   mysql -u root -p emergency_db < database/schema.sql
   ```

5. **Seed demo data (Jamshedpur hospitals, ambulances, demo user, hospital admins)**

   ```bash
   npm run seed
   ```

6. **Run the API**

   ```bash
   npm run dev
   ```

   Health check: `GET http://localhost:3000/` → `{ "status": "RescueNow API running 🚑", "version": "1.0.0" }`.

7. **Postman / REST client**

   Use the base URL `http://localhost:3000/api`. Authenticated routes need `Authorization: Bearer <token>`.

## Demo credentials (after `npm run seed`)

| Role    | Identifier | Password   |
|---------|------------|------------|
| User    | Phone `9999999999` | `test123` |
| Driver  | Vehicle `JH05AB1234`, phone `9876501111` | (phone only; optional password `driver123` in DB for future use) |
| Hospital | Email `admin@tata-main.com` | `admin123` |

## API overview

- **Auth:** `POST /api/auth/register/user`, `/login/user`, `/login/driver`, `/login/hospital`  
- **Users & profile:** `GET|PUT /api/users/:id`, contacts/conditions CRUD under `/api/users/...` and `/api/contacts/:id`, `/api/conditions/:id`  
- **SOS:** `POST /api/incidents/sos` (JWT user, transaction, nearest ambulance/hospital, sockets, SMS, notifications)  
- **Incidents:** `GET /api/incidents`, `/active`, `/:id`, `PUT /:id/status`, `POST /:id/cancel`  
- **Ambulances / hospitals:** list, `nearest`, status, location, bed updates  
- **Analytics:** `/api/analytics/dashboard`, `incidents-trend`, `response-times`, `incident-types`, `heatmap`  
- **Notifications:** `POST /api/notifications/sms`, `GET /api/notifications/incident/:id`  

## Socket.io

Connect to the same host/port as the HTTP server. Events include `join-user`, `join-driver`, `join-hospital`, `ambulance-location`, `accept-emergency`, `reject-emergency`, `update-status`. Server emits `new-emergency`, `sos-broadcast`, `ambulance-moved`, `incident-updated`, `incident-cancelled`.

## Standard response shape

- Success: `{ "success": true, "message": "...", "data": { } }`  
- Error: `{ "success": false, "error": "...", "code": "..." }`  
- Paginated lists: `{ "success": true, "data": [ ], "pagination": { "page", "limit", "total", "pages" } }`  

## License

ISC (align with `package.json`).
