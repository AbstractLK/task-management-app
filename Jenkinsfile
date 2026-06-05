pipeline {
  agent any

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
              sh 'npm run build'
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
        sh 'docker build -t $DOCKERHUB_NAMESPACE/task-management-frontend:$IMAGE_TAG frontend'
        sh 'docker build -t $DOCKERHUB_NAMESPACE/task-management-auth-service:$IMAGE_TAG services/auth-service'
        sh 'docker build -t $DOCKERHUB_NAMESPACE/task-management-task-service:$IMAGE_TAG services/task-service'
      }
    }

    stage('Push Docker Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_TOKEN')]) {
          sh 'echo $DOCKERHUB_TOKEN | docker login -u $DOCKERHUB_USER --password-stdin'
          sh 'docker push $DOCKERHUB_NAMESPACE/task-management-frontend:$IMAGE_TAG'
          sh 'docker push $DOCKERHUB_NAMESPACE/task-management-auth-service:$IMAGE_TAG'
          sh 'docker push $DOCKERHUB_NAMESPACE/task-management-task-service:$IMAGE_TAG'
        }
      }
    }

    stage('Update GitOps Config') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'github-creds', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
          sh 'rm -rf config'
          sh 'git clone https://$GIT_USER:$GIT_TOKEN@github.com/$GITHUB_USERNAME/$CONFIG_REPO_NAME.git config'
          sh 'sed -i "s/tag: .*/tag: $IMAGE_TAG/" config/environments/minikube/frontend-values.yaml'
          sh 'sed -i "s/tag: .*/tag: $IMAGE_TAG/" config/environments/minikube/auth-service-values.yaml'
          sh 'sed -i "s/tag: .*/tag: $IMAGE_TAG/" config/environments/minikube/task-service-values.yaml'
          dir('config') {
            sh 'git config user.email "jenkins@example.local"'
            sh 'git config user.name "jenkins"'
            sh 'git add environments/minikube/frontend-values.yaml environments/minikube/auth-service-values.yaml environments/minikube/task-service-values.yaml'
            sh 'git commit -m "Update application image tags to $IMAGE_TAG"'
            sh 'git push origin main'
          }
        }
      }
    }
  }
}
