
## Project Overview
Too many students study alone. Hive helps connect students across borders and language barriers, offering a solution to students in environments lacking support needing to chase their dreams alone.  
- Live demo: https://gohive.io  
- Demo video: https://www.youtube.com/watch?v=GOrEYNVJnhw

## Setup Instructions

**NOTE: There are three base example accounts generated on the live gohive.io demo.**

| username | password |
| ---- | -- |
| alice@example.com | password123 |
| bob@example.com | password123 |
| carol@example.com | password123 |


1. **Clone the repository:**
    ```
    git clone https://github.com/alanshen27/hive.git
    cd hive
    ```

2. **Install dependencies:**
    ```
    npm install
    ```

3. **Configure environment variables:**
    - Copy `.env.example` to `.env.local` and fill in the required values (e.g., database URL, authentication secrets, API keys for translation, etc.).

    - Note this program uses various third party resources. To run this locally, one must have the following in the env:
        - A Google Cloud account with the following
            - `GOOGLE_TRANSLATE_API_KEY` for the translating API
            - `GOOGLE_CLOUD_*` credentials, see .env.example for more information
        - `PUSHER_*` credentials, go to [Pusher.com](https://pusher.com) to obtain
    - Keep the rest of the credentials as is for local developement

4.  **Set up the database:**
    To setup the database
    ```
    npx prisma migrate dev
    ```
    To run the database
    ```
    npx prisma dev
    ```

5. **Run the development server:**
    ```
    npm run dev
    ```
    The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Usage Instructions

- **Sign up** or **log in** to create or join study groups at `/auth` (click the "Get Started" or "Sign in" button on the Navbar).
- **Complete the onboarding guide** so we can know you better (at `/onboarding`)
- **On the sidebar**, you can see all the functions of our app
- **Head to "Explore"** to join a group, or **create your own**
- **Go to "My Groups"** To see the groups you are in.
- **Create milestones** for your group and track progress.
- **Chat** with our built in AI agent and study mates
- **Submit work** and receive AI-powered feedback and verification.
- **Translate content** to your preferred language for a more inclusive experience.
- **Receive notifications** for group activity, submissions, and milestones.

For a more detailed guide, refer to https://www.youtube.com/watch?v=GOrEYNVJnhw&ab_channel=Alan (1:42)

---

## Contribution Guidelines

We welcome contributions! [To get started](CONTRIBUTING.md)

---

## Technologies Used

- **Next.js** (React framework)
- **Prisma** (ORM)
- **PostgreSQL** (database)
- **NextAuth.js** (authentication)
- **Google Translate API** (server-side translation)
- **TypeScript**

---

## License

This project is licensed under the MIT License. See [LICENSE.txt](LICENSE.txt)
