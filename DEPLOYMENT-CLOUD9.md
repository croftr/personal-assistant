# Deploy Using AWS Cloud9 (No Docker Desktop Needed)

If you can't run Docker Desktop locally (no virtualization support), you can build and deploy from AWS Cloud9.

## Setup AWS Cloud9 Environment

1. **Go to AWS Cloud9 Console:**
   - https://console.aws.amazon.com/cloud9

2. **Create Environment:**
   - Name: `personal-assistant-builder`
   - Instance type: `t3.small` (free tier eligible)
   - Platform: `Amazon Linux 2023`
   - Connection: `AWS Systems Manager (SSM)`
   - Click **Create**

3. **Wait for environment to start** (~2 minutes)

## Deploy from Cloud9

### Step 1: Upload Your Code

In Cloud9 terminal:

```bash
# Install Git LFS if needed
git lfs install

# Clone your repository (or upload files via File > Upload)
# If your code is on GitHub:
git clone https://github.com/your-username/personal-assistant.git
cd personal-assistant

# OR upload your local files:
# File > Upload Local Files > Select your project folder
```

### Step 2: Install Dependencies

```bash
# Node.js is pre-installed, verify version
node --version  # Should be 18+

# If you need Node 20:
nvm install 20
nvm use 20

# Install npm dependencies
npm install
```

### Step 3: Build Docker Image

```bash
# Docker is pre-installed in Cloud9
docker --version

# Make scripts executable
chmod +x setup-lambda.sh deploy-lambda.sh

# Update AWS credentials (already configured in Cloud9!)
# Just update the AWS_ACCOUNT_ID in the scripts:
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Edit setup-lambda.sh
sed -i "s/YOUR_AWS_ACCOUNT_ID/$AWS_ACCOUNT_ID/" setup-lambda.sh
sed -i "s/YOUR_AWS_ACCOUNT_ID/$AWS_ACCOUNT_ID/" deploy-lambda.sh

# Run setup
./setup-lambda.sh
```

### Step 4: Access Your App

The script will output your Function URL:
```
https://abc123.lambda-url.us-east-1.on.aws/
```

## Updating Your App (Regular Workflow)

### Option A: Update from Cloud9

1. Make changes locally on your Windows machine
2. Upload updated files to Cloud9 (File > Upload)
3. Run deployment:
   ```bash
   cd personal-assistant
   ./deploy-lambda.sh
   ```

### Option B: Update from Local Machine (Without Docker)

Use AWS CLI to update Lambda directly:

```bash
# 1. Zip your code locally (on Windows)
npm run build
tar -czf app.tar.gz .next/standalone public .next/static data

# 2. Upload to S3
aws s3 cp app.tar.gz s3://your-bucket/app.tar.gz

# 3. Update Lambda layer (for code-only updates)
# This won't work for container images, need Docker
```

### Option C: Push to GitHub, Pull in Cloud9

1. Commit changes locally:
   ```bash
   git add .
   git commit -m "Update data"
   git push
   ```

2. In Cloud9:
   ```bash
   git pull
   ./deploy-lambda.sh
   ```

## Cost of Cloud9

- **Free tier:** First month is free
- **After free tier:** ~$1-2/month if you stop the instance when not using it
- **Stop instance:** Environment > Stop (automatically stops after 30 min idle)

## Alternative: Use GitHub Codespaces

1. Push code to GitHub
2. Open Codespaces (free 60 hours/month)
3. Run deployment scripts from there
4. Docker works in Codespaces!

## Recommendation

For your situation, I recommend:

**Short term:** Use Cloud9 for initial deployment and occasional updates

**Long term:**
- Try to enable virtualization on your ThinkPad (check BIOS)
- Or use a cloud-based development environment (Codespaces/Cloud9)
- Or deploy from a different machine (friend's laptop, etc.)
