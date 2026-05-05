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
                        -p 8081:8080 \
                        $BACKEND_IMAGE

                    echo "=== Run Frontend ==="
                    docker run -d \
                        --name $FRONTEND_IMAGE \
                        -p 3000:80 \
                        $FRONTEND_IMAGE
                '''
            }
        }
    }
}