#!/bin/bash

# FIFA Tournament App - Azure Infrastructure Deployment Script

set -e

# Configuration
RESOURCE_GROUP_PREFIX="rg-fifa-tournament"
LOCATION="West Europe"
ENVIRONMENT=${1:-dev}

# Validate environment parameter
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "Error: Environment must be 'dev', 'staging', or 'prod'"
    echo "Usage: ./deploy.sh [environment]"
    exit 1
fi

# Set resource group name
RESOURCE_GROUP="${RESOURCE_GROUP_PREFIX}-${ENVIRONMENT}"

echo "🚀 Deploying FIFA Tournament App infrastructure to ${ENVIRONMENT} environment"
echo "📍 Resource Group: ${RESOURCE_GROUP}"
echo "📍 Location: ${LOCATION}"

# Login check
echo "🔐 Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Create resource group if it doesn't exist
echo "📦 Creating resource group if it doesn't exist..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output table

# Deploy infrastructure
echo "🏗️  Deploying infrastructure..."
DEPLOYMENT_NAME="fifa-tournament-$(date +%Y%m%d-%H%M%S)"

az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "main.bicep" \
    --parameters "@parameters/${ENVIRONMENT}.parameters.json" \
    --name "$DEPLOYMENT_NAME" \
    --output table

# Get deployment outputs
echo "📋 Getting deployment outputs..."
OUTPUTS=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query "properties.outputs" \
    --output json)

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Static Web App: $(echo $OUTPUTS | jq -r '.staticWebAppName.value')"
echo "🖥️  App Service: $(echo $OUTPUTS | jq -r '.appServiceName.value')"
echo "🗄️  SQL Server: $(echo $OUTPUTS | jq -r '.sqlServerName.value')"
echo "💾 Database: $(echo $OUTPUTS | jq -r '.sqlDatabaseName.value')"
echo "📦 Storage Account: $(echo $OUTPUTS | jq -r '.storageAccountName.value')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Next steps:"
echo "1. Update your GitHub repository secrets with Azure service principal credentials"
echo "2. Update the connection strings in your application configuration"
echo "3. Set up Azure AD B2C tenant and configure authentication"
echo "4. Deploy your application code"
echo ""
echo "💡 For more information, see the INFRASTRUCTURE.md file"
