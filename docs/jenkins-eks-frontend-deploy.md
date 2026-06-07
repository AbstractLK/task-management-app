# Jenkins EKS Frontend Deployment

The `task-management-app/Jenkinsfile` deploys the frontend to S3 + CloudFront for the EKS environment.

## What the EKS Pipeline Does

Jenkins:

1. Installs frontend dependencies.
2. Builds the frontend with:

   ```bash
   VITE_API_BASE_URL=http://<INGRESS_LOAD_BALANCER_DNS> npm run build
   ```

3. Uploads `frontend/dist` to S3:

   ```bash
   aws s3 sync frontend/dist s3://<S3_BUCKET> --delete
   ```

4. Invalidates CloudFront if `CLOUDFRONT_DISTRIBUTION_ID` is provided.
5. Builds and pushes only backend Docker images.
6. Updates only EKS backend image tags in the GitOps repository:

   ```text
   environments/eks/auth-service-values.yaml
   environments/eks/task-service-values.yaml
   ```

The EKS frontend values file remains with `replicaCount: 0` and `ingress.enabled: false` because production frontend delivery uses S3 + CloudFront.

## Jenkins Parameters

Set these when running the pipeline:

- `AWS_REGION`: AWS region for the frontend S3 bucket, for example `ap-southeast-1`
- `EKS_API_BASE_URL`: public API URL, for example `http://<INGRESS_LOAD_BALANCER_DNS>`
- `S3_BUCKET`: S3 bucket used by CloudFront
- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID

## Jenkins Credentials

Create these Jenkins credentials:

- `dockerhub-creds`: DockerHub username and token
- `github-creds`: GitHub username and personal access token
- `aws-creds`: AWS access key ID as username and AWS secret access key as password

The AWS user or role needs permission for:

- `s3:ListBucket`
- `s3:PutObject`
- `s3:DeleteObject`
- `cloudfront:CreateInvalidation`

## Jenkins Agent Requirements

The Jenkins agent must have:

- Node.js 20
- Git
- Docker CLI
- AWS CLI v2

## Run Order

Before running the Jenkins EKS pipeline, complete these once:

1. Apply `task-management-infrastructure` with Terraform.
2. Install NGINX Ingress.
3. Install ArgoCD.
4. Apply `argocd/eks` applications.
5. Copy the ingress-nginx load balancer hostname.
6. Use that hostname for `EKS_API_BASE_URL`.

After that, each Jenkins run can deploy:

- frontend changes to S3 + CloudFront
- backend image changes through GitOps + ArgoCD
