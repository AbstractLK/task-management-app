# Task Management App

Application source monorepo for the Task Management DevOps portfolio project.

This repository contains:

- `frontend`: React, Axios, Tailwind CSS frontend
- `services/auth-service`: Node.js and Express auth microservice
- `services/task-service`: Node.js and Express task CRUD microservice

Each component builds into a separate Docker image:

- `YOUR_DOCKERHUB_USERNAME/task-management-frontend`
- `YOUR_DOCKERHUB_USERNAME/task-management-auth-service`
- `YOUR_DOCKERHUB_USERNAME/task-management-task-service`

The root `Jenkinsfile` builds all components, pushes all images to DockerHub, then updates image tags in the separate `task-management-k8s-config` GitOps repository.

## Local Development

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Auth service:

```bash
cd services/auth-service
npm install
npm run dev
```

Task service:

```bash
cd services/task-service
npm install
npm run dev
```

Copy the root `.env.example` to `.env` for local development. The frontend reads `VITE_API_BASE_URL` from the root env file, and the backend services read prefixed monorepo variables such as `AUTH_MONGODB_URI`, `TASK_MONGODB_URI`, `AUTH_PORT`, and `TASK_PORT`.
