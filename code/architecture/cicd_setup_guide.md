# Step-by-Step CI/CD Deployment Guide for SlideSense Backend

This guide walks you through setting up an AWS EC2 instance, configuring it to run your Spring Boot application, and setting up a GitHub Actions CI/CD workflow to build and deploy your application automatically on every push to the `main` branch.

---

## Step 1: Create and Configure the EC2 Instance

1. **Log in to the AWS Console** and navigate to **EC2** -> **Instances** -> **Launch instances**.
2. **Name and tags**: Enter a name (e.g., `SlideSense-Backend`).
3. **Application and OS Images (AMI)**: Choose **Ubuntu Server 22.04 LTS** (or 24.04 LTS).
4. **Instance Type**: Select **t3.small** (2 GB RAM) or **t3.medium** (4 GB RAM) to handle both Spring Boot and Docker DB.
5. **Key pair**: Create a new key pair (e.g., `slidesense-key`), select **RSA** and **.pem**, then download it. Keep this key safe!
6. **Network Settings (Security Group)**:
   - Create security group.
   - **SSH (Port 22)**: Allow from "My IP" (for local access) or "Anywhere" (if needed, but less secure).
   - **Custom TCP (Port 8080)**: Allow from your frontend server's Security Group, or "Anywhere" for testing.
   - **HTTP (Port 80) / HTTPS (Port 443)**: Allow from anywhere.
7. **Configure Storage**: Ensure at least **20 GB** (gp3) to accommodate Docker DB logs/data.
8. Click **Launch Instance**.

---

## Step 2: Prepare the EC2 Instance for Java

Once the instance is running, connect to it using your terminal:
```bash
ssh -i /path/to/slidesense-key.pem ubuntu@<EC2-PUBLIC-IP>
```

Run the following commands on the EC2 command line to install Java 21 and prepare the folder structure:

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install Java 21 JRE
sudo apt install openjdk-21-jre-headless -y

# Create directory for the backend application
sudo mkdir -p /var/www/slidesense
sudo chown -R ubuntu:ubuntu /var/www/slidesense
```

---

## Step 2.5: Install Docker and Run TimescaleDB

Since you are running your TimescaleDB database inside a Docker container, you must install Docker and Docker Compose on your EC2 instance, copy your `docker-compose.yml` file, and start the database.

### 1. Install Docker & Docker Compose on EC2
Run these commands on your EC2 terminal:

```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg -y
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker packages:
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# Add your user to the docker group so you don't need 'sudo' to run docker commands:
sudo usermod -aG docker ubuntu
# (Log out of your SSH session and log back in for this to take effect)
```

### 2. Copy and Run `docker-compose.yml`
You only need to configure the database container once on the EC2 host.

1. Create a folder for database configuration:
   ```bash
   mkdir -p /var/www/slidesense/database
   cd /var/www/slidesense/database
   ```
2. Create a new `docker-compose.yml` file on EC2:
   ```bash
   nano docker-compose.yml
   ```
3. Copy the contents of your local `code/backend/docker-compose.yml` and paste it here. For reference:
   ```yaml
   services:
     timescaledb:
       image: timescale/timescaledb:latest-pg16
       container_name: slidesense-timescaledb
       restart: unless-stopped
       environment:
         POSTGRES_DB: slidesense
         POSTGRES_USER: slidesense
         POSTGRES_PASSWORD: slidesense
       ports:
         - "127.0.0.1:5432:5432" # Bind to localhost (127.0.0.1) for security so external sources cannot access it
       volumes:
         - timescaledb_data:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U slidesense -d slidesense"]
         interval: 10s
         timeout: 5s
         retries: 5

   volumes:
     timescaledb_data:
   ```
4. Save the file (`Ctrl + O`, `Enter`, `Ctrl + X`).
5. Run your database in the background:
   ```bash
   docker compose up -d
   ```
6. Check that the container is up and healthy:
   ```bash
   docker ps
   ```

---

## Step 3: Configure systemd on EC2

To run your Spring Boot application as a background service that automatically restarts if the server reboots or if the application crashes, create a systemd service.

1. Open a new service configuration file:
   ```bash
   sudo nano /etc/systemd/system/slidesense-backend.service
   ```
2. Paste the following configuration, adapting environment variables (DB URLs, SQS details, JWT keys, etc.) to your production setup:
   ```ini
   [Unit]
   Description=SlideSense Spring Boot Backend
   After=syslog.target network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/var/www/slidesense
   ExecStart=/usr/bin/java -jar /var/www/slidesense/backend.jar
   SuccessExitStatus=143
   Restart=always
   RestartSec=10

   # Environment variables
   Environment=SPRING_PROFILES_ACTIVE=prod
   Environment=SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/slidesense
   Environment=SPRING_DATASOURCE_USERNAME=slidesense
   Environment=SPRING_DATASOURCE_PASSWORD=slidesense
   Environment=SECURITY_JWT_SECRET=your-prod-long-random-jwt-signing-secret-key-goes-here
   Environment=SECURITY_JWT_ACCESS_EXPIRATION_MS=86400000
   Environment=SQS_INGESTION_ENABLED=true

   [Install]
   WantedBy=multi-user.target
   ```
3. Save the file (`Ctrl + O`, `Enter`, `Ctrl + X`).
4. Reload the systemd daemon:
   ```bash
   sudo systemctl daemon-reload
   ```

*(Note: We will start the service in Step 5 after the first automated deployment uploads the `backend.jar` file.)*

---

## Step 4: Configure GitHub Repository Secrets

For GitHub Actions to connect to your EC2 instance securely, you need to add your SSH key and host details as Secrets in GitHub.

1. Go to your repository on GitHub.
2. Navigate to **Settings** -> **Secrets and variables** -> **Actions**.
3. Click **New repository secret** and add the following three secrets:
   - **`EC2_HOST`**: The public IP address of your EC2 instance (e.g. `54.123.45.67`).
   - **`EC2_USERNAME`**: `ubuntu`
   - **`EC2_SSH_KEY`**: Open your downloaded `.pem` key file in a text editor and copy the entire contents (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`), then paste it here.

---

## Step 5: Create the GitHub Actions Workflow

In your local codebase, create a workflow file that instructs GitHub on how to build the JAR and push it to EC2.

Create a new file at `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to AWS EC2

on:
  push:
    branches:
      - main
    paths:
      - 'code/backend/**' # Only trigger when backend code changes

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    # 1. Checkout codebase
    - name: Checkout Code
      uses: actions/checkout@v4

    # 2. Set up Java JDK 21
    - name: Set up JDK 21
      uses: actions/setup-java@v4
      with:
        java-version: '21'
        distribution: 'temurin'
        cache: 'maven'

    # 3. Compile and build executable JAR
    - name: Build with Maven
      run: |
        cd code/backend
        chmod +x mvnw
        ./mvnw clean package -DskipTests

    # 4. Copy JAR file to EC2 using SCP
    - name: Copy JAR file to EC2
      uses: appleboy/scp-action@v0.1.7
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USERNAME }}
        key: ${{ secrets.EC2_SSH_KEY }}
        source: "code/backend/target/*.jar"
        target: "/var/www/slidesense"
        strip_components: 3 # Strips 'code/backend/target' so the file lands directly in '/var/www/slidesense'

    # 5. Connect via SSH and restart systemd service
    - name: Restart Application Service
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USERNAME }}
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          # Rename the uploaded jar to a standardized name (backend.jar)
          mv /var/www/slidesense/*.jar /var/www/slidesense/backend.jar
          # Restart the background service
          sudo systemctl restart slidesense-backend
```

---

## Step 6: Test the Pipeline

1. **Commit and push** the new `.github/workflows/deploy-backend.yml` file to the `main` branch:
   ```bash
   git add .github/workflows/deploy-backend.yml
   git commit -m "ci: add GitHub Actions workflow for backend deployment"
   git push origin main
   ```
2. Go to the **Actions** tab in your GitHub repository. You will see the workflow running.
3. Once the deployment job finishes successfully, SSH back into your EC2 instance and enable the service so it runs automatically:
   ```bash
   sudo systemctl enable slidesense-backend
   sudo systemctl start slidesense-backend
   ```
4. Verify that the app is running:
   ```bash
   sudo systemctl status slidesense-backend
   ```
   Or check the application logs in real-time:
   ```bash
   journalctl -u slidesense-backend -f
   ```

Your backend CI/CD pipeline is now fully set up! Every time you push a backend change to `main`, it will automatically build, deploy, and restart on EC2.

---

## Step 7: Host React Frontend with Nginx (on the same EC2)

Hosting your frontend on the same EC2 instance is highly recommended because:
- **Cost**: It's completely free (uses Nginx, which uses minimal resources).
- **CORS**: You can configure Nginx to route `/api` requests to the backend. Since the frontend and API are served from the same domain/IP, you bypass all browser CORS blockages.

### 1. Install Nginx on EC2
Connect to your EC2 instance and install Nginx:
```bash
sudo apt update
sudo apt install nginx -y
```

### 2. Configure Directory for Frontend
Create a directory where Nginx will look for your React static files:
```bash
sudo mkdir -p /var/www/slidesense/frontend
sudo chown -R ubuntu:ubuntu /var/www/slidesense/frontend
```

### 3. Create Nginx Configuration
We will configure Nginx to:
1. Serve static React files on port `80` (HTTP).
2. Proxy any API request starting with `/api/` to your Spring Boot backend running locally on port `8080`.

1. Remove the default Nginx config:
   ```bash
   sudo rm /etc/nginx/sites-enabled/default
   ```
2. Create a new configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/slidesense
   ```
3. Paste the following configuration:
   ```nginx
   server {
       listen 80;
       server_name _; # Responds to your public EC2 IP address

       # Serve React Static Files
       location / {
           root /var/www/slidesense/frontend;
           index index.html;
           try_files $uri $uri/ /index.html; # Fallback to index.html for React Router
       }

       # Proxy API requests to Spring Boot
       location /api/ {
           proxy_pass http://127.0.0.1:8080/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           
           # Adjust headers for CORS/Forwarding
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
4. Enable the configuration and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/slidesense /etc/nginx/sites-enabled/
   sudo nginx -t # Test configuration syntax
   sudo systemctl restart nginx
   ```

---

## Step 8: Automating Frontend Deployment with GitHub Actions

Now, create a GitHub Actions workflow to build and deploy your React frontend to EC2 automatically.

Create a new file at `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to AWS EC2

on:
  push:
    branches:
      - main
    paths:
      - 'code/frontend-new/**' # Only trigger when frontend code changes

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    # 1. Checkout codebase
    - name: Checkout Code
      uses: actions/checkout@v4

    # 2. Set up Node.js
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: 'code/frontend-new/package-lock.json'

    # 3. Install dependencies and build React app
    - name: Install & Build
      run: |
        cd code/frontend-new
        npm install
        # Set VITE_API_BASE_URL to /api. Nginx will automatically proxy /api/ requests to http://localhost:8080/
        VITE_API_BASE_URL=/api npm run build

    # 4. Copy build folder (dist) to EC2 using SCP
    - name: Copy static files to EC2
      uses: appleboy/scp-action@v0.1.7
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USERNAME }}
        key: ${{ secrets.EC2_SSH_KEY }}
        source: "code/frontend-new/dist/*"
        target: "/var/www/slidesense/frontend"
        strip_components: 3 # Strips 'code/frontend-new/dist' so files land directly in '/var/www/slidesense/frontend'
```

Once pushed to `main`, GitHub will automatically build your React app and upload it to `/var/www/slidesense/frontend` where Nginx will serve it instantly!
