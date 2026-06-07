pipeline {
  agent any

  parameters {
    string(name: 'AWS_REGION', defaultValue: 'ap-southeast-1', description: 'AWS region for S3 deployment.')
    string(name: 'EKS_API_BASE_URL', defaultValue: 'https://api.example.com', description: 'Public EKS API URL used by the frontend build.')
    string(name: 'S3_BUCKET', defaultValue: 'task-management-frontend-example', description: 'S3 bucket that hosts the production frontend.')
    string(name: 'CLOUDFRONT_DISTRIBUTION_ID', defaultValue: '', description: 'CloudFront distribution ID. Leave blank to skip invalidation.')
  }

  environment {
    DOCKERHUB_NAMESPACE = 'abstraxlk'
    GITHUB_USERNAME = 'AbstractLK'
    CONFIG_REPO_NAME = 'task-management-k8s-config'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }

  stages {
    stage('Install and Test') {
      parallel {
        stage('Frontend') {
          steps {
            dir('frontend') {
              sh 'npm install'
              sh 'VITE_API_BASE_URL="$EKS_API_BASE_URL" npm run build'
            }
          }
        }

        stage('Auth Service') {
          steps {
            dir('services/auth-service') {
              sh 'npm install'
              sh 'npm test'
            }
          }
        }

        stage('Task Service') {
          steps {
            dir('services/task-service') {
              sh 'npm install'
              sh 'npm test'
            }
          }
        }
      }
    }

    stage('Build Docker Images') {
      steps {
        sh 'docker build -t $DOCKERHUB_NAMESPACE/task-management-auth-service:$IMAGE_TAG services/auth-service'
        sh 'docker build -t $DOCKERHUB_NAMESPACE/task-management-task-service:$IMAGE_TAG services/task-service'
      }
    }

    stage('Push Docker Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_TOKEN')]) {
          sh 'echo $DOCKERHUB_TOKEN | docker login -u $DOCKERHUB_USER --password-stdin'
          sh 'docker push $DOCKERHUB_NAMESPACE/task-management-auth-service:$IMAGE_TAG'
          sh 'docker push $DOCKERHUB_NAMESPACE/task-management-task-service:$IMAGE_TAG'
        }
      }
    }

    stage('Deploy Frontend to S3 and CloudFront') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'aws-creds', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
          sh 'aws s3 sync frontend/dist s3://$S3_BUCKET --delete --region $AWS_REGION'
          sh '''
            if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
              aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"
            else
              echo "CLOUDFRONT_DISTRIBUTION_ID is empty; skipping invalidation."
            fi
          '''
        }
      }
    }

    stage('Update GitOps Config') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'github-creds', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
          sh 'rm -rf config'
          sh 'git clone https://$GIT_USER:$GIT_TOKEN@github.com/$GITHUB_USERNAME/$CONFIG_REPO_NAME.git config'
          sh '''
            sed -i "s/tag: .*/tag: $IMAGE_TAG/" config/environments/eks/auth-service-values.yaml
            sed -i "s/tag: .*/tag: $IMAGE_TAG/" config/environments/eks/task-service-values.yaml
          '''
          dir('config') {
            sh 'git config user.email "jenkins@example.local"'
            sh 'git config user.name "jenkins"'
            sh '''
              git add environments/eks/auth-service-values.yaml environments/eks/task-service-values.yaml

              if git diff --cached --quiet; then
                echo "No GitOps image tag changes to commit."
              else
                git commit -m "Update EKS image tags to $IMAGE_TAG"
                git push origin main
              fi
            '''
          }
        }
      }
    }
  }
}
