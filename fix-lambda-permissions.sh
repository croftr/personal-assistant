#!/bin/bash
# Fix Lambda Function URL permissions

set -e

AWS_REGION="eu-west-2"
LAMBDA_FUNCTION_NAME="personal-assistant"

echo "Removing existing permission..."
aws lambda remove-permission \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --statement-id FunctionURLAllowPublicAccess \
  --region ${AWS_REGION} 2>/dev/null || echo "No existing permission to remove"

echo "Adding public access permission to Lambda Function URL..."
aws lambda add-permission \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE \
  --region ${AWS_REGION}

echo ""
echo "Permission added successfully!"
echo ""
echo "Try accessing your Function URL again:"
echo "https://olryn5m3vtknot47kj2hhffqu40ioagy.lambda-url.eu-west-2.on.aws/"
