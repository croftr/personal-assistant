# AWS Lambda Deployment Guide

Deploy your Personal Assistant app to AWS Lambda for read-only access from anywhere. Costs ~$0.01-0.10/month.

## Prerequisites

1. **Docker Desktop** - Must be running
2. **AWS Account** with CLI configured
3. **Node.js 20+**

## Initial Setup (One Time Only)

### 1. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID and Secret Access Key
```

### 2. Get Your AWS Account ID

```bash
aws sts get-caller-identity --query Account --output text
```

### 3. Update Deployment Scripts

Edit both `setup-lambda.sh` and `deploy-lambda.sh`:
- Set `AWS_ACCOUNT_ID` to your 12-digit account ID (from step 2)
- Set `AWS_REGION` to your preferred region (default: us-east-1)

### 4. Run Initial Deployment

```bash
./setup-lambda.sh
```

This creates:
- IAM role for Lambda
- ECR repository for Docker images
- Lambda function
- Public HTTPS Function URL

### 5. Configure Environment Variables

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Select your function: `personal-assistant`
3. Go to **Configuration > Environment variables**
4. Update:
   - `GOOGLE_GENAI_API_KEY`
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`

### 6. Access Your App

Use the Function URL from the setup output (e.g., `https://xyz.lambda-url.us-east-1.on.aws/`)

## Updating Your Deployment

When you make changes to your app or add new data:

### 1. Test Changes Locally

```bash
npm run dev
# Add your data (expenses, payslips, etc.)
```

### 2. Deploy Updates

```bash
./deploy-lambda.sh
```

Takes 2-5 minutes. Your Function URL remains the same.

## Important Notes

- **Database is read-only once deployed** - Add data locally, then redeploy
- **First request after deploy** - May take 5-10 seconds (cold start)
- **Environment variables** - Only need to be set once
- **Cost** - ~$0.01-0.10/month (essentially free for personal use)

## Troubleshooting

**AWS credentials expired:**
```bash
aws configure  # Re-enter credentials
```

**Docker not running:**
- Start Docker Desktop before deploying

**Build fails:**
```bash
docker system prune -a  # Clean Docker cache
./deploy-lambda.sh      # Try again
```

## Files

- `setup-lambda.sh` - Initial deployment (run once)
- `deploy-lambda.sh` - Update deployment (run when you make changes)
- `Dockerfile` - Container configuration
- `.dockerignore` - Files excluded from Docker image
