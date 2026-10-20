# Rehbar-e-Hajji 🕋

A MERN stack web application for Hajj & Umrah guidance, planning, and community support.

## Project Structure

```
rehbar-e-hajji/
├── client/          # React frontend (Vite)
├── server/          # Express backend (Node.js)
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [MongoDB](https://www.mongodb.com/) (local or Atlas URI)
- npm (ships with Node.js)

---

### 1️⃣ Server Setup

```bash
cd server
cp .env.example .env    # Edit .env with your values
npm install
npm run dev             # Starts with nodemon on http://localhost:5000
```

#### Environment Variables (`server/.env`)

| Variable     | Description              | Default     |
| ------------ | ------------------------ | ----------- |
| `PORT`       | Server port              | `5000`      |
| `MONGO_URI`  | MongoDB connection string | —           |
| `JWT_SECRET` | Secret for JWT signing   | —           |

---

### 2️⃣ Client Setup

```bash
cd client
cp .env.example .env    # Edit .env with your values
npm install
npm run dev             # Starts Vite dev server on http://localhost:5173
```

#### Environment Variables (`client/.env`)

| Variable       | Description              | Default                        |
| -------------- | ------------------------ | ------------------------------ |
| `VITE_API_URL` | Backend API base URL     | `http://localhost:5000`        |
| `AI_API_KEY`   | API key for AI features  | —                              |

---

### 3️⃣ Running Both (from root)

Open two terminals:

```bash
# Terminal 1 — Server
cd server && npm run dev

# Terminal 2 — Client
cd client && npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 📦 Available Scripts

### Server (`server/`)

| Script        | Action                             |
| ------------- | ---------------------------------- |
| `npm run dev` | Start dev server with nodemon      |
| `npm start`   | Start production server            |

### Client (`client/`)

| Script          | Action                        |
| --------------- | ----------------------------- |
| `npm run dev`   | Start Vite dev server         |
| `npm run build` | Build for production          |
| `npm run preview` | Preview production build    |

---

## 🧩 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, React Router, Axios, i18next
- **Backend:** Node.js, Express, Mongoose, JWT, bcrypt
- **Database:** MongoDB

---

## 📄 License

MIT
