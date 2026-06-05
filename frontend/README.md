# Task Management Frontend

React + Axios + Tailwind CSS frontend for the task management DevOps portfolio project.

## Local Development

```bash
npm install
npm run dev
```

Set `VITE_API_BASE_URL` only when the API is hosted on a different origin. In Kubernetes local mode, the frontend calls `/api/...` through NGINX Ingress.
