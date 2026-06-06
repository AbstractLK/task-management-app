# Local Jenkins in Docker

Run Jenkins locally with Docker Compose from the workspace root:

```bash
docker compose -f docker-compose.jenkins.yml up -d --build
```

The compose setup builds a Jenkins image with:

- Docker CLI
- Git
- Node.js 20

It also mounts Docker Desktop's Docker socket so Jenkins can build and push the app images.

Open Jenkins:

```text
http://localhost:8080
```

Get the initial admin password:

```bash
docker exec task-management-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Create credentials:

- `dockerhub-creds`: DockerHub username and access token
- `github-creds`: GitHub username and personal access token

The `task-management-app` repository uses one root `Jenkinsfile`. Jenkins builds the frontend, auth service, and task service images, pushes them to DockerHub, then updates the image tags in the `task-management-k8s-config` GitOps repository.

Stop Jenkins:

```bash
docker compose -f docker-compose.jenkins.yml down
```
