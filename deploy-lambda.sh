#!/bin/bash
# Deployment script for AWS Lambda Container Image
# This script builds, tags, and deploys your Next.js app to AWS Lambda

set -e

# Configuration - UPDATE THESE VALUES
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="905418468533"
ECR_REPO_NAME="personal-assistant"
LAMBDA_FUNCTION_NAME="personal-assistant"
IMAGE_TAG="latest"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting deployment to AWS Lambda...${NC}\n"

# Step 1: Build Docker image
echo -e "${GREEN}[1/6] Building Docker image...${NC}"
docker build --platform linux/amd64 -t ${ECR_REPO_NAME}:${IMAGE_TAG} .

# Step 2: Create ECR repository if it doesn't exist
echo -e "${GREEN}[2/6] Ensuring ECR repository exists...${NC}"
aws ecr describe-repositories --repository-names ${ECR_REPO_NAME} --region ${AWS_REGION} 2>/dev/null || \
  aws ecr create-repository --repository-name ${ECR_REPO_NAME} --region ${AWS_REGION}

# Step 3: Login to ECR
echo -e "${GREEN}[3/6] Logging into ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Step 4: Tag image for ECR
echo -e "${GREEN}[4/6] Tagging image for ECR...${NC}"
docker tag ${ECR_REPO_NAME}:${IMAGE_TAG} \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG}

# Step 5: Push image to ECR
echo -e "${GREEN}[5/6] Pushing image to ECR...${NC}"
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG}

# Step 6: Update Lambda function
echo -e "${GREEN}[6/6] Updating Lambda function...${NC}"
aws lambda update-function-code \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --image-uri ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG} \
  --region ${AWS_REGION}

echo -e "\n${GREEN}Deployment complete!${NC}"
echo -e "${BLUE}Your Lambda function has been updated with the latest image.${NC}\n"

# Get the Function URL
echo -e "${BLUE}Fetching Function URL...${NC}"
FUNCTION_URL=$(aws lambda get-function-url-config \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --region ${AWS_REGION} \
  --query 'FunctionUrl' \
  --output text 2>/dev/null || echo "Not configured yet")

if [ "$FUNCTION_URL" != "Not configured yet" ]; then
  echo -e "${GREEN}Access your app at: ${FUNCTION_URL}${NC}\n"
else
  echo -e "${RED}Function URL not configured. Run setup-lambda.sh first.${NC}\n"
fi
