# Kairos - Your Wellness Companion

Kairos is a comprehensive wellness application designed to help users track their mood, sleep, and activities, while providing AI-driven insights and chatbot support. This project features a modern full-stack Next.js application.

## 🚀 Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS 4
- **Auth:** NextAuth.js (Google & Credentials)
- **Database:** MongoDB (Mongoose)
- **AI:** Google Generative AI (Gemini)
- **Icons:** React Icons

---

## 🛠️ Project Structure

```
Kairos/
├── web/                     # Full-Stack Next.js Application
│   ├── app/                 # App Router Pages & API Routes
│   ├── components/          # Reusable UI Components
│   ├── models/              # Mongoose Database Models
│   ├── db/                  # Database Connection Logic
│   └── ...
└── docker-compose.yml       # Docker Orchestration
```

---

## 🏃‍♂️ Running Locally

### Prerequisites
- **Node.js**: v18+
- **MongoDB**: Local instance or Atlas URI

### Setup Instructions

1.  Navigate to the `web` directory:
    ```bash
    cd web
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    Create a `.env.local` file in the `web` root with the following keys:
    ```env
    # Authentication (Google OAuth & NextAuth)
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    NEXTAUTH_SECRET=your_random_secret_string
    NEXTAUTH_URL=http://localhost:3000

    # Base URL
    NEXT_PUBLIC_URL=http://localhost:3000

    # AI Integration
    NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

    # Database
    MONGO_URI=mongodb://localhost:27017/kairos
    ```

4.  Run the Development Server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

---

## 🐳 Running with Docker

You can start the application and a local MongoDB instance using Docker Compose.

```bash
docker-compose up --build
```

This will spin up:
- **Frontend** on port `3000`
- **MongoDB** on port `27017`

---

## ✨ Key Features

- **Dashboard**: Visual tracking of daily mood, sleep quality, and physical activities.
- **Profile Management**: Real-time profile updates.
- **Authentication**: Secure login via Google OAuth or Credentials.
- **Wellness Chatbot**: Integrated AI companion "Kairos" driven by Google Gemini.
- **Full Stack**: Serverless API routes handling auth, data, and AI interactions within Next.js.
