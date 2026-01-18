#!/bin/bash
# Initial setup script for AWS Lambda deployment
# Run this once to create the Lambda function and configure it

set -e

# Configuration - UPDATE THESE VALUES
AWS_REGION="eu-west-2"
AWS_ACCOUNT_ID="905418468533"
ECR_REPO_NAME="personal-assistant"
LAMBDA_FUNCTION_NAME="personal-assistant"
LAMBDA_ROLE_NAME="personal-assistant-lambda-role"
IMAGE_TAG="latest"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up AWS Lambda for Personal Assistant...${NC}\n"

# Step 1: Create IAM role for Lambda
echo -e "${GREEN}[1/7] Creating IAM role for Lambda...${NC}"

# Check if role exists
if aws iam get-role --role-name ${LAMBDA_ROLE_NAME} 2>/dev/null; then
  echo "Role already exists, skipping creation."
  ROLE_ARN=$(aws iam get-role --role-name ${LAMBDA_ROLE_NAME} --query 'Role.Arn' --output text)
else
  # Create trust policy (inline to avoid Windows path issues)
  ROLE_ARN=$(aws iam create-role \
    --role-name ${LAMBDA_ROLE_NAME} \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
    --query 'Role.Arn' \
    --output text)

  # Attach basic Lambda execution policy
  aws iam attach-role-policy \
    --role-name ${LAMBDA_ROLE_NAME} \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  echo "Created role: ${ROLE_ARN}"

  # Wait for role to propagate
  echo "Waiting for IAM role to propagate..."
  sleep 10
fi

# Step 2: Create ECR repository
echo -e "${GREEN}[2/7] Creating ECR repository...${NC}"
aws ecr describe-repositories --repository-names ${ECR_REPO_NAME} --region ${AWS_REGION} 2>/dev/null || \
  aws ecr create-repository --repository-name ${ECR_REPO_NAME} --region ${AWS_REGION}

# Step 3: Login to ECR first
echo -e "${GREEN}[3/7] Logging into ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Step 4: Build and push using buildx (ensures proper manifest)
echo -e "${GREEN}[4/7] Building and pushing Docker image...${NC}"
docker buildx create --use --name lambda-builder 2>/dev/null || docker buildx use lambda-builder 2>/dev/null || true
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG} \
  --push \
  .

# Step 5: Create Lambda function
echo -e "${GREEN}[5/7] Creating Lambda function...${NC}"

if aws lambda get-function --function-name ${LAMBDA_FUNCTION_NAME} --region ${AWS_REGION} 2>/dev/null; then
  echo "Lambda function already exists, skipping creation."
else
  aws lambda create-function \
    --function-name ${LAMBDA_FUNCTION_NAME} \
    --package-type Image \
    --code ImageUri=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG} \
    --role ${ROLE_ARN} \
    --timeout 30 \
    --memory-size 512 \
    --region ${AWS_REGION} \
    --environment "Variables={NODE_ENV=production,GOOGLE_GENAI_API_KEY=your_key_here,EMAIL_HOST=smtp.gmail.com,EMAIL_PORT=587,EMAIL_SECURE=false,EMAIL_USER=your_email,EMAIL_PASSWORD=your_password}"

  echo "Lambda function created successfully!"
fi

# Step 6: Create Function URL
echo -e "${GREEN}[6/7] Creating Function URL...${NC}"

# Check if Function URL already exists
FUNCTION_URL=$(aws lambda get-function-url-config \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --region ${AWS_REGION} \
  --query 'FunctionUrl' \
  --output text 2>/dev/null || echo "")

if [ -z "$FUNCTION_URL" ]; then
  # Create Function URL with NONE auth (public access)
  # Change to AWS_IAM for authenticated access
  FUNCTION_URL=$(aws lambda create-function-url-config \
    --function-name ${LAMBDA_FUNCTION_NAME} \
    --auth-type NONE \
    --region ${AWS_REGION} \
    --query 'FunctionUrl' \
    --output text)

  # Add resource-based policy to allow public access
  aws lambda add-permission \
    --function-name ${LAMBDA_FUNCTION_NAME} \
    --statement-id FunctionURLAllowPublicAccess \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE \
    --region ${AWS_REGION} 2>/dev/null || echo "Permission already exists"

  echo "Function URL created: ${FUNCTION_URL}"
else
  echo "Function URL already exists: ${FUNCTION_URL}"
fi

echo -e "\n${GREEN}Setup complete!${NC}\n"
echo -e "${BLUE}Your Personal Assistant is now deployed to AWS Lambda!${NC}"
echo -e "${GREEN}Access URL: ${FUNCTION_URL}${NC}\n"
echo -e "${RED}IMPORTANT: Update environment variables in Lambda console:${NC}"
echo -e "  1. Go to AWS Lambda console"
echo -e "  2. Select function: ${LAMBDA_FUNCTION_NAME}"
echo -e "  3. Configuration > Environment variables"
echo -e "  4. Update GOOGLE_GENAI_API_KEY and EMAIL_* variables\n"
echo -e "${BLUE}To deploy updates:${NC}"
echo -e "  ./deploy-lambda.sh\n"
