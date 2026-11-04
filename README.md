#npm start
#npx nodemon

Here's the complete rundown of the **TaxStore** project — features, setup, and how to run it.

> Note: all the fixes/features below are on the `clean-minimal-ui` branch (PR #1), not yet merged to `main`. To get this version, check out that branch or merge the PR first.

---

## What it is

A full-stack **taxable-income calculator**. A user signs in, enters their salary components, and the app computes taxable income after the HRA exemption and standard deductions — saving each result to their account, with reminders and export.

**Stack**
- **Frontend:** React 17, React Router v5, Context API, Bootstrap 5 (via CDN), `react-html-table-to-excel`. Runs on **port 3000**.
- **Backend:** Node.js + Express, MongoDB via Mongoose, JWT auth, bcrypt, express-validator, node-schedule + Nodemailer. Runs on **port 5001**.

---

## Features

| Area | What it does |
|---|---|
| **Authentication** | Signup / login / logout. Passwords hashed with bcrypt; a JWT is issued and sent in an `auth-token` header on protected requests. |
| **Tax calculator** | Enter Basic, LTA, HRA, Food Allowance, Investments (80C), Medical Premium (80D), Rent, and Metro/Non-Metro. Computes the **HRA exemption** and taxable income. |
| **Confirm modal** | Shows the entered values for confirmation before calculating. |
| **Save records** | Each calculation is stored against your account in MongoDB. |
| **View all records** | The **Taxes** page lists every saved record as a card. |
| **Mark as Paid** | Toggle a record's status to Paid. |
| **Email reminder** | Schedule a reminder email for a chosen date (fires at 09:00 that day). |
| **Delete record** | Remove a saved record (new). |
| **Excel export** | Download all saved records as a spreadsheet. |
| **About page** | Shows the logged-in user's name and email. |

**Calculation rules**
```
Metro:      exemptHRA = max(0, min(0.5 × Rent − 0.1 × Basic, HRA))
Non-Metro:  exemptHRA = max(0, min(0.4 × Rent − 0.1 × Basic, HRA))
Taxable income = round[(Basic + LTA + HRA + Food Allowance) − exemptHRA − Investments − Medical]
```

---

## Prerequisites

- **Node.js** (v16+) and **npm**
- **MongoDB** — local install, or a free **MongoDB Atlas** cluster (connection string)
- A **Gmail account with an App Password** (optional — only needed to actually send reminder emails; 2-Factor Auth must be on to create one)

---

## Setup

**1. Get the code and switch to the branch:**
```bash
git clone https://github.com/coderSidharth/taxmaster.git
```
```bash
cd taxmaster && git checkout clean-minimal-ui
```

**2. Create the backend environment file** — copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Then edit `backend/.env`:
```
dbCredential=mongodb://127.0.0.1:27017/taxstore
JWT_SECRET=change-this-to-a-long-random-secret
EMAIL=youraddress@gmail.com
PASSWORD=your-16-char-app-password
```
(Leave `EMAIL`/`PASSWORD` blank if you don't need emails — the app still runs and saves reminders, it just skips sending.)

**3. Install frontend dependencies** (the `--legacy-peer-deps` flag is required — the Excel library declares an old React peer dependency):
```bash
npm install --legacy-peer-deps
```

**4. Install backend dependencies:**
```bash
cd backend && npm install && cd ..
```

---

## Running

Make sure **MongoDB is running** first (if local).

**Option A — one command (both servers together):**
```bash
npm run both
```

**Option B — two terminals.** Backend:
```bash
npx nodemon backend/index.js
```
Frontend (second terminal):
```bash
npm start
```

Then open **http://localhost:3000**. The API runs at **http://localhost:5001**.

Typical flow: Signup → enter salary components → Submit → confirm → see taxable income → **Taxes** page to view/mark paid/set reminder/delete, or **Download as Excel**.

---

## API reference (all JSON; protected routes need the `auth-token` header)

| Method & URL | Auth | Body | Purpose |
|---|---|---|---|
| `POST /api/auth/createUser` | — | `{name, email, password}` | Register, returns `{success, authToken}` |
| `POST /api/auth/login` | — | `{email, password}` | Login, returns `{success, authToken}` |
| `POST /api/auth/getuser` | JWT | — | Logged-in user's details |
| `POST /api/taxUser/addDetails` | JWT | `{bas, lta, hra, fa, inv, med, rent, finalTax}` | Save a calculation |
| `GET /api/taxUser/get_all_tax` | JWT | — | List your records |
| `PUT /api/taxUser/update_tax/:id` | JWT | — | Mark a record Paid |
| `POST /api/taxUser/setRemainder` | JWT | `{email, id, date}` | Schedule a reminder email |
| `DELETE /api/taxUser/delete_tax/:id` | JWT | — | Delete a record |

---

## Things to know

- **Ports are fixed** — API `5001`, frontend `3000`. The frontend calls `http://localhost:5001` directly (hardcoded), so for deployment you'd change those URLs.
- **Gmail reminders** need an **App Password**, not your normal password. Without credentials the request still succeeds; the email is just skipped.
- **Reminders survive restarts** — pending ones are re-scheduled from the DB when the server boots.
- MongoDB must be reachable or protected routes will hang/fail.

---