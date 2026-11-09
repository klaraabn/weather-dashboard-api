# Weather Dashboard API — Express + MongoDB (Assignment 6)

The back end for my Weather Dashboard (Assignment 4 in vanilla JS, Assignment 5 in React). The dashboard could only search a city and show it. This API lets it **save cities** in a real database, so a user's list of places (Mansourieh, Paris…) survives a restart.

It uses the methods from Session 18 (Databases & Persistence): MongoDB Atlas, Mongoose schemas and models, secrets in `.env`, and "connect first, then listen".

- One resource: **cities**, with full CRUD
- RESTful routes under `/api/cities`
- Data stored in **MongoDB Atlas** through Mongoose
- Validation with clear JSON error messages
- Tested with a **Postman** collection (in `postman/`)

## Install and run

Requires [Node.js](https://nodejs.org/) 18 or newer and a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

```bash
# 1. Go into the project folder
cd weather-dashboard-api

# 2. Install the dependencies (creates node_modules)
npm install

# 3. Create your .env from the example, then put your own connection string in it
cp .env.example .env

# 4. Start the dev server (restarts on every save)
npm run dev
```

The terminal should print:

```
connected to MongoDB
API listening on :3000
```

The API is then at http://localhost:3000. `npm start` runs it without watch mode.

### The .env file

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/weather-dashboard
PORT=3000
```

Atlas setup: create a free cluster, add a database user and password, allow your IP under **Network Access**, then copy the connection string. `.env` is listed in `.gitignore`, so only `.env.example` (fake values) is committed.

| If it fails | Why |
|---|---|
| `undefined` URI | `.env` is missing or not in the project root |
| Timeout | your IP isn't allowed in Atlas |

## Project structure

```
weather-dashboard-api/
├── server.js              # loads .env, connects to MongoDB, then listens
├── package.json           # dependencies + "dev" script
├── .env.example           # fake values to copy (the real .env is ignored)
├── .gitignore             # node_modules, .env
├── models/
│   └── City.js            # schema (the rules) + model (does the work)
├── routes/
│   └── cities.js          # the five CRUD routes
└── postman/
    └── weather-dashboard-api.postman_collection.json
```

## The City document

| Field | Type | Rules |
|---|---|---|
| `name` | String | required, trimmed, under 50 characters (same limit as the dashboard's search bar) |
| `country` | String | required |
| `latitude` | Number | required, between -90 and 90 |
| `longitude` | Number | required, between -180 and 180 |
| `unit` | String | `"C"` or `"F"`, default `"C"` (the dashboard's °C / °F toggle) |
| `note` | String | optional, under 100 characters |

MongoDB adds `_id` (an ObjectId, not a number). `timestamps: true` adds `createdAt` and `updatedAt`.

Latitude and longitude are stored so the dashboard can skip the geocoding step and ask Open-Meteo for the weather directly.

## Routes

| Method | Route | What it does | Success |
|---|---|---|---|
| GET | `/api/cities` | List all saved cities (newest first) | 200 |
| GET | `/api/cities/:id` | Get one city | 200 |
| POST | `/api/cities` | Save a new city | 201 |
| PUT | `/api/cities/:id` | Update a city (send the full city) | 200 |
| DELETE | `/api/cities/:id` | Delete a city | 204 |

Every error has the same shape: `{ "error": "message" }`.

| Status | When |
|---|---|
| 400 | invalid id, missing or wrong field, body that isn't valid JSON |
| 404 | valid id but no such city, or unknown route |
| 500 | the database or server failed |

### GET /api/cities

Optional `?search=` filters by name (not case-sensitive): `GET /api/cities?search=mans`

Response `200`:

```json
[
  {
    "_id": "672cb41e9f2a3d0012c4e7a1",
    "name": "Mansourieh",
    "country": "Lebanon",
    "latitude": 33.866,
    "longitude": 35.583,
    "unit": "C",
    "note": "Home",
    "createdAt": "2026-11-07T10:20:14.512Z",
    "updatedAt": "2026-11-07T10:20:14.512Z",
    "__v": 0
  }
]
```

No saved cities gives `[]`.

### GET /api/cities/:id

`GET /api/cities/672cb41e9f2a3d0012c4e7a1`

Response `200`: the city object, same shape as above.

```json
// GET /api/cities/123                       → 400
{ "error": "Invalid id" }

// GET /api/cities/66f1c2e4b7a1d3f0c8e2a9b1  → 404
{ "error": "City not found" }
```

### POST /api/cities

Request:

```json
{
  "name": "Mansourieh",
  "country": "Lebanon",
  "latitude": 33.866,
  "longitude": 35.583,
  "unit": "C",
  "note": "Home"
}
```

Response `201`: the saved city with its `_id`, `createdAt` and `updatedAt`.

Invalid input → `400`:

```json
// body: { "country": "Lebanon", "latitude": 120 }
{ "error": "City name is required, Latitude must be between -90 and 90, Longitude is required" }

// body: { "name": "Byblos", "country": "Lebanon", "latitude": "north", "longitude": 35.65 }
{ "error": "Invalid value for latitude" }

// body: { "name": "Beirut",      (not valid JSON)
{ "error": "Request body is not valid JSON" }
```

(The order of the messages can change.)

### PUT /api/cities/:id

Send the full city again. `name`, `country`, `latitude` and `longitude` are required.

Request:

```json
{
  "name": "Mansourieh",
  "country": "Lebanon",
  "latitude": 33.866,
  "longitude": 35.583,
  "unit": "F",
  "note": "Home (Metn)"
}
```

Response `200`: the **updated** city (`new: true`).

```json
// missing fields → 400
{ "error": "name, country, latitude and longitude are required" }

// "unit": "K" → 400 (runValidators: true checks the schema on update too)
{ "error": "Unit must be C or F" }

// invalid id → 400
{ "error": "Invalid id" }

// no such city → 404
{ "error": "City not found" }
```

### DELETE /api/cities/:id

Response `204 No Content` (empty body).

```json
// same id again → 404
{ "error": "City not found" }
```

## Testing

### Postman

1. Start the server: `npm run dev`
2. In Postman: **Import** → `postman/weather-dashboard-api.postman_collection.json`
3. Open the collection → **Run** (keep the order).

"POST - save Mansourieh" saves the new id in the `cityId` variable, so the GET, PUT and DELETE requests after it use the same city. There are 16 requests, and each one has a test that checks the status code. They cover every route, plus missing fields, a wrong type, malformed JSON, an invalid id, a missing city, bad data on update, deleting twice and an unknown route.

To check persistence, run "POST - save Paris", stop the server (Ctrl+C), run `npm run dev` again, then "GET - all cities". Paris is still there. You can also see it in Atlas → Browse Collections → `cities`.

### curl

```bash
# save a city
curl -X POST http://localhost:3000/api/cities \
  -H "Content-Type: application/json" \
  -d '{"name":"Mansourieh","country":"Lebanon","latitude":33.866,"longitude":35.583}'

# list / search
curl http://localhost:3000/api/cities
curl "http://localhost:3000/api/cities?search=mans"

# get one
curl http://localhost:3000/api/cities/<id>

# update
curl -X PUT http://localhost:3000/api/cities/<id> \
  -H "Content-Type: application/json" \
  -d '{"name":"Mansourieh","country":"Lebanon","latitude":33.866,"longitude":35.583,"unit":"F"}'

# delete (prints nothing: 204)
curl -i -X DELETE http://localhost:3000/api/cities/<id>
```

## Methods from the slides, step by step

### 1. Why a database (Session 18)
Before, a list kept in memory was lost every time the server restarted. With MongoDB the cities are on disk, so the data outlives the process that created it.

### 2. SQL vs NoSQL: why MongoDB (Session 18)
A saved city is a small, self-contained object with no joins, so a **collection of documents** fits it well. In MongoDB terms: cluster → database `weather-dashboard` → collection `cities` → one document per city.

### 3. Secrets in `.env` (Session 18)
- `import "dotenv/config"` is the **first line** of `server.js`, before anything reads `process.env`.
- `MONGODB_URI` holds the password, so `.env` is in `.gitignore` and only `.env.example` is committed.
- Every value arrives as a string, so the port is converted: `Number(process.env.PORT) || 3000`.

### 4. A schema sets the rules, a model does the work (Session 18)
`models/City.js` declares the fields with `required`, `min`/`max`, `maxlength`, `enum` and `default`. These replace hand-written `if` checks. Each rule has its own message, and those messages are what the API sends back on a 400. The model `City` maps to the collection `cities`.

### 5. Embed or reference (Session 18)
All of a city's data belongs to that city and is always read together, so nothing is referenced. Everything sits inside one document.

### 6. Connect first, then listen (Session 18)
`server.js` awaits `mongoose.connect()` inside `try`, then calls `app.listen()`. If the connection fails, it logs the reason and exits with `process.exit(1)` instead of running without a database.

### 7. Every array call has a model call (Session 18)
| Job | Mongoose |
|---|---|
| Read all | `await City.find(filter).sort({ createdAt: -1 })` |
| Read one | `await City.findById(id)` |
| Create | `await City.create(data)` |
| Update | `await City.findByIdAndUpdate(id, data, { new: true, runValidators: true })` |
| Delete | `await City.findByIdAndDelete(id)` |

Every handler is `async` and `await`s the model call.

### 8. Bad id, missing id, bad data (Session 18)
- **Bad id:** the `checkId` middleware uses `mongoose.isValidObjectId()` and returns `400` before touching the database.
- **Missing:** the id is valid but the query returns `null`, so the route returns `404`.
- **Bad data:** Mongoose throws a `ValidationError` (a rule failed) or a `CastError` (wrong type). Both become a `400` with a readable message.
- **Anything else** in the `catch` is a server problem, so it returns `500`.

### 9. The server never crashes
- Every route has its own `try / catch`.
- Express's error middleware catches a body that isn't valid JSON and answers `400`.
- An unknown route gets a JSON `404` instead of Express's HTML page.

### 10. Only the allowed fields are saved
`POST` and `PUT` pick `name, country, latitude, longitude, unit, note` out of `req.body`. Any extra field a client sends (for example its own `_id`) is ignored.

## Requirements checklist

| Requirement | Where |
|---|---|
| Express server, one resource with full CRUD | `routes/cities.js` |
| RESTful routes | `GET/POST /api/cities`, `GET/PUT/DELETE /api/cities/:id` |
| Correct status codes (200, 201, 400, 404, 500) | each route + `server.js` (also 204 on delete) |
| Real database, no in-memory data | MongoDB Atlas through Mongoose (`models/City.js`) |
| Validation on create / update with JSON errors | schema rules + `runValidators: true` + PUT check |
| README with setup and every route with examples | this file |
| `.env` for the connection string, in `.gitignore` | `.env.example`, `.gitignore` |
| Postman collection for each route | `postman/` |
| No crash on malformed input or a missing record | `try / catch`, `checkId`, error middleware |
