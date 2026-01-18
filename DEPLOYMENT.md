# AWS Lambda Deployment Guide

This guide explains how to deploy your Personal Assistant app to AWS Lambda using container images for a **read-only, serverless deployment**.

## Overview

**Architecture:**
- AWS Lambda function running your Next.js app in a container
- SQLite database baked into the Docker image (read-only)
- Lambda Function URL for HTTPS access
- Essentially **FREE** on AWS free tier (~$0.01-0.10/month for ECR storage)

**Workflow:**
1. Update data locally (add expenses, payslips, etc.)
2. Rebuild Docker image with updated database
3. Push to AWS ECR
4. Lambda automatically uses the new image
5. Access read-only app from any device via HTTPS URL

## Prerequisites

1. **AWS Account** with access to:
   - Lambda
   - ECR (Elastic Container Registry)
   - IAM

2. **AWS CLI** installed and configured:
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, and region
   ```

3. **Docker** installed on your local machine

4. **Node.js 20+** for local development

## Initial Setup (One-Time)

### Step 1: Configure Deployment Scripts

Edit both `setup-lambda.sh` and `deploy-lambda.sh` and update these values:

```bash
AWS_REGION="us-east-1"              # Your preferred AWS region
AWS_ACCOUNT_ID="123456789012"       # Your AWS account ID
ECR_REPO_NAME="personal-assistant"  # ECR repository name
LAMBDA_FUNCTION_NAME="personal-assistant"  # Lambda function name
```

**To find your AWS Account ID:**
```bash
aws sts get-caller-identity --query Account --output text
```

### Step 2: Make Scripts Executable

```bash
chmod +x setup-lambda.sh deploy-lambda.sh
```

### Step 3: Run Initial Setup

```bash
./setup-lambda.sh
```

This script will:
1. Create IAM role for Lambda execution
2. Create ECR repository
3. Build initial Docker image
4. Push image to ECR
5. Create Lambda function
6. Create Function URL for HTTPS access

**Expected output:**
```
Setup complete!
Your Personal Assistant is now deployed to AWS Lambda!
Access URL: https://abcdef123456.lambda-url.us-east-1.on.aws/
```

### Step 4: Configure Environment Variables

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Select your function: `personal-assistant`
3. Navigate to **Configuration > Environment variables**
4. Click **Edit** and update these variables:
   - `GOOGLE_GENAI_API_KEY`: Your Google Gemini API key
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASSWORD`: Your Gmail app password
   - `EMAIL_HOST`: `smtp.gmail.com`
   - `EMAIL_PORT`: `587`
   - `EMAIL_SECURE`: `false`

5. Click **Save**

### Step 5: Test Your Deployment

Open the Function URL in your browser (provided at the end of setup):
```
https://your-unique-id.lambda-url.us-east-1.on.aws/
```

You should see your Personal Assistant dashboard!

## Regular Workflow: Updating Your App

When you want to update the database with new expenses, payslips, or other data:

### 1. Update Data Locally

Run your app locally and add/process your data:

```bash
npm run dev
# Visit http://localhost:3000
# Add your expenses, payslips, etc.
```

### 2. Deploy Updated Image

Once you've updated your data, deploy the new version:

```bash
./deploy-lambda.sh
```

This script will:
1. Build new Docker image (includes your updated SQLite database)
2. Push to ECR
3. Update Lambda function with new image

**The entire process takes 2-5 minutes.**

### 3. Access Your Updated App

Visit your Function URL - it will now show your updated data!

**Note:** After deployment, the first request may take 5-10 seconds (cold start). Subsequent requests will be faster.

## Cost Breakdown

**AWS Free Tier (First 12 months):**
- Lambda: 1 million requests/month FREE
- Lambda: 400,000 GB-seconds compute FREE
- ECR: 500 MB storage FREE

**After Free Tier:**
- ECR storage: ~$0.10/GB/month → ~$0.01-0.10/month for your app
- Lambda requests: $0.20 per 1M requests (unlikely to exceed free tier for personal use)
- Lambda compute: $0.0000166667 per GB-second (unlikely to exceed free tier)

**Expected cost: $0.01-0.10/month** (essentially free for personal use)

## Authentication & Security

By default, the Function URL is **public** (no authentication). For better security, you have two options:

### Option 1: IAM Authentication (More Secure)

Edit `setup-lambda.sh` and change:
```bash
--auth-type NONE
```
to:
```bash
--auth-type AWS_IAM
```

Then access your app using AWS credentials (Sigv4 signing).

### Option 2: Add Custom Authentication

You can add HTTP Basic Auth or custom authentication to your Next.js app using middleware.

## Advanced Configuration

### Increase Lambda Memory/Timeout

If your app needs more resources:

```bash
aws lambda update-function-configuration \
  --function-name personal-assistant \
  --memory-size 1024 \
  --timeout 60
```

### View Logs

Lambda automatically logs to CloudWatch:

```bash
aws logs tail /aws/lambda/personal-assistant --follow
```

Or visit [CloudWatch Logs Console](https://console.aws.amazon.com/cloudwatch/logs)

### Delete Deployment

To completely remove the Lambda deployment:

```bash
# Delete Lambda function
aws lambda delete-function --function-name personal-assistant

# Delete ECR repository
aws ecr delete-repository --repository-name personal-assistant --force

# Delete IAM role
aws iam detach-role-policy \
  --role-name personal-assistant-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam delete-role --role-name personal-assistant-lambda-role
```

## Troubleshooting

### Issue: "Container image too large"

Lambda supports images up to 10GB. If your image exceeds this:
- Remove unnecessary files from the image
- Optimize your Next.js build
- Check `.dockerignore` is excluding dev dependencies

### Issue: "Function timeout"

Increase timeout:
```bash
aws lambda update-function-configuration \
  --function-name personal-assistant \
  --timeout 60
```

### Issue: "Memory limit exceeded"

Increase memory:
```bash
aws lambda update-function-configuration \
  --function-name personal-assistant \
  --memory-size 1024
```

### Issue: Cold starts are slow

Lambda cold starts can take 5-10 seconds for container images. Options:
- Enable **Provisioned Concurrency** (costs extra)
- Accept cold starts for personal use (they only happen after inactivity)
- Use Lambda **SnapStart** if available in your region

### Issue: Database changes not reflecting

Make sure you:
1. Updated data locally
2. Ran `./deploy-lambda.sh`
3. Waited for deployment to complete (2-5 minutes)
4. Refreshed your browser (clear cache if needed)

## Comparison: Lambda vs Lightsail

| Feature | Lambda Container | Lightsail |
|---------|-----------------|-----------|
| Cost | ~$0.10/month | $3.60/month |
| Server Management | None | Minimal |
| Cold Starts | 3-10 seconds | No cold starts |
| Read/Write | Read-only | Full read/write |
| Scalability | Automatic | Manual |
| Complexity | Medium | Low |

**Choose Lambda if:**
- You want the lowest possible cost
- You're okay with read-only deployment
- You don't mind occasional cold starts
- You want zero server maintenance

**Choose Lightsail if:**
- You want to add data from mobile devices
- You need instant response times
- You prefer traditional server deployment

## Next Steps

1. Set up automatic deployments with GitHub Actions (optional)
2. Add custom domain with Route 53 (optional)
3. Enable CloudFront for CDN caching (optional)
4. Add monitoring with CloudWatch dashboards (optional)

## Questions?

For AWS Lambda documentation:
- [Lambda Container Images](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html)
- [Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html)
