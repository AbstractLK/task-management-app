# Jenkins EKS Deployment

The `task-management-app/Jenkinsfile` deploys the frontend and backend services to the EKS environment.

## What the EKS Pipeline Does

Jenkins:

1. Installs frontend and backend dependencies, and runs tests.
2. Builds the frontend and backend Docker images.
3. Pushes all Docker images to DockerHub.
4. Updates all EKS image tags in the GitOps repository for:
   - `environments/eks/frontend-values.yaml`
   - `environments/eks/auth-service-values.yaml`
   - `environments/eks/task-service-values.yaml`

The EKS frontend is deployed identically to backend microservices, running as a Kubernetes workload managed through ArgoCD.

## Jenkins Credentials

Create these Jenkins credentials:

- `dockerhub-creds`: DockerHub username and token
- `github-creds`: GitHub username and personal access token

## Jenkins Agent Requirements

The Jenkins agent must have:

- Node.js 20
- Git
- Docker CLI

## Run Order

Before running the Jenkins EKS pipeline, complete these once:

1. Apply `task-management-infrastructure` with Terraform.
2. Install NGINX Ingress.
3. Install ArgoCD.
4. Apply `argocd/eks` applications.

After that, each Jenkins run can deploy all image changes through GitOps + ArgoCD.
