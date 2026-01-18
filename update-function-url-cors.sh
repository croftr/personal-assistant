#!/bin/bash
# Try alternative permission without condition

set -e

AWS_REGION="eu-west-2"
LAMBDA_FUNCTION_NAME="personal-assistant"

echo "Removing existing permission..."
aws lambda remove-permission \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --statement-id FunctionURLAllowPublicAccess \
  --region ${AWS_REGION} 2>/dev/null || echo "No permission to remove"

echo "Adding public access permission WITHOUT condition..."
aws lambda add-permission \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --region ${AWS_REGION}

echo ""
echo "Permission updated!"
echo ""
echo "Checking function policy..."
aws lambda get-policy --function-name ${LAMBDA_FUNCTION_NAME} --region ${AWS_REGION}

echo ""
echo "Wait 5 seconds then try:"
echo "https://szstlubgzvslmt73oy554boeim0ncaxd.lambda-url.eu-west-2.on.aws/"
