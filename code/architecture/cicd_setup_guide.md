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
        host: ${{ secrets::EC2_HOST }}
        username: ${{ secrets::EC2_USERNAME }}
        key: ${{ secrets::EC2_SSH_KEY }}
        source: "code/backend/target/*.jar"
        target: "/var/www/slidesense"
        strip_components: 3 # Strips 'code/backend/target' so the file lands directly in '/var/www/slidesense'

    # 5. Connect via SSH and restart systemd service
    - name: Restart Application Service
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ secrets::EC2_HOST }}
        username: ${{ secrets::EC2_USERNAME }}
        key: ${{ secrets::EC2_SSH_KEY }}
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
