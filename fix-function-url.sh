#!/bin/bash
# Fix Lambda Function URL configuration

set -e

AWS_REGION="eu-west-2"
LAMBDA_FUNCTION_NAME="personal-assistant"

echo "Deleting existing Function URL..."
aws lambda delete-function-url-config \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --region ${AWS_REGION} 2>/dev/null || echo "No existing Function URL to delete"

echo "Creating new Function URL with NONE auth..."
FUNCTION_URL=$(aws lambda create-function-url-config \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --auth-type NONE \
  --region ${AWS_REGION} \
  --query 'FunctionUrl' \
  --output text)

echo "Removing old permission..."
aws lambda remove-permission \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --statement-id FunctionURLAllowPublicAccess \
  --region ${AWS_REGION} 2>/dev/null || echo "No permission to remove"

echo "Adding public access permission..."
aws lambda add-permission \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE \
  --region ${AWS_REGION}

echo ""
echo "Function URL configured successfully!"
echo "New URL: ${FUNCTION_URL}"
echo ""
echo "Wait 10 seconds for changes to propagate, then try accessing the URL."
