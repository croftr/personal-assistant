#!/bin/bash
# Debug Function URL configuration

set -e

AWS_REGION="eu-west-2"
LAMBDA_FUNCTION_NAME="personal-assistant"

echo "Getting Function URL configuration..."
aws lambda get-function-url-config \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --region ${AWS_REGION}

echo ""
echo "Getting Function policy..."
aws lambda get-policy \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --region ${AWS_REGION}
