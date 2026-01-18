#!/bin/bash
# Add the correct permission for Function URL

set -e

AWS_REGION="eu-west-2"
LAMBDA_FUNCTION_NAME="personal-assistant"

echo "Adding public access permission for Function URL with AuthType NONE..."
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
echo "Verifying the policy..."
aws lambda get-policy --function-name ${LAMBDA_FUNCTION_NAME} --region ${AWS_REGION}

echo ""
echo "Done! Try accessing the URL now:"
echo "https://szstlubgzvslmt73oy554boeim0ncaxd.lambda-url.eu-west-2.on.aws/"
