#!/bin/bash

# FIFA Tournament - Azure Setup Script
# This script helps set up the Azure resources and GitHub secrets for CI/CD

set -e

echo "🏆 FIFA Tournament - Azure Setup"
echo "================================"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    echo "   Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI is not installed. Please install it first."
    echo "   Visit: https://cli.github.com/"
    exit 1
fi

# Variables
RESOURCE_GROUP="fifa-tournament-rg"
LOCATION="East US"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
APP_NAME="fifa-tournament-deploy"

echo "📋 Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   Subscription: $SUBSCRIPTION_ID"
echo ""

# Login to Azure
echo "🔐 Logging into Azure..."
az login

# Create resource group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Create service principal
echo "🔑 Creating service principal..."
SP_OUTPUT=$(az ad sp create-for-rbac --name $APP_NAME --role contributor --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP --sdk-auth)

echo "✅ Service principal created!"
echo ""
echo "📝 Please add the following secrets to your GitHub repository:"
echo ""
echo "Secret: AZURE_CREDENTIALS"
echo "Value:"
echo "$SP_OUTPUT"
echo ""
echo "Secret: AZURE_SUBSCRIPTION_ID"
echo "Value: $SUBSCRIPTION_ID"
echo ""
echo "Secret: AZURE_RESOURCE_GROUP"
echo "Value: $RESOURCE_GROUP"
echo ""

# Generate a secure password for SQL
SQL_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "Secret: SQL_ADMIN_PASSWORD"
echo "Value: ${SQL_PASSWORD}Aa1!"
echo ""

echo "🚀 Setup complete! Don't forget to:"
echo "   1. Add the above secrets to GitHub repository settings"
echo "   2. Get the Static Web Apps API token after first deployment"
echo "   3. Update the SQL password in prod.parameters.json if needed"
