pipeline {
    agent any

    environment {
        FRONTEND_IMAGE = "tisi-frontend"
        BACKEND_IMAGE  = "tisi-backend"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    echo "=== Build Frontend ==="
                    docker build -t $FRONTEND_IMAGE ./frontend

                    echo "=== Build Backend ==="
                    sed -i 's/{ENV}/prd/g' ./backend/Dockerfile
                    docker build -t $BACKEND_IMAGE ./backend
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    echo "=== Stop Old Containers ==="
                    docker rm -f $FRONTEND_IMAGE || true
                    docker rm -f $BACKEND_IMAGE || true

                    echo "=== Run Backend ==="
                    docker run -d \
                        --name $BACKEND_IMAGE \
                        -p 8081:80 \
                        $BACKEND_IMAGE

                    echo "=== Run Frontend ==="
                    docker run -d \
                        --name $FRONTEND_IMAGE \
                        --link $BACKEND_IMAGE:backend \
                        -p 80:80 \
                        $FRONTEND_IMAGE
                '''
            }
        }
    }
}