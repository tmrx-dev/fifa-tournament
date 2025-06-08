# FIFA Tournament - CI/CD Setup

This repository is configured for automatic deployment to Azure when code is pushed to the `main` branch.

## Required GitHub Secrets

To enable automatic application deployment, you need to configure the following secrets in your GitHub repository:

### Azure Authentication
1. **AZURE_CLIENT_ID** - Service principal client ID
2. **AZURE_TENANT_ID** - Azure tenant ID  
3. **AZURE_CLIENT_SECRET** - Service principal client secret
4. **AZURE_SUBSCRIPTION_ID** - Azure subscription ID

### Static Web App
5. **AZURE_STATIC_WEB_APPS_API_TOKEN** - API token for Static Web Apps deployment

Note: Infrastructure deployment secrets (AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP, SQL_ADMIN_PASSWORD) are no longer needed since infrastructure is deployed manually.

## Setting up Azure Credentials

1. Create a service principal:
```bash
az ad sp create-for-rbac --name "fifa-tournament-deploy" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group}
```

2. Copy the output values and add them as individual GitHub secrets:
   - `AZURE_CLIENT_ID` - The "appId" from the output
   - `AZURE_TENANT_ID` - The "tenant" from the output  
   - `AZURE_CLIENT_SECRET` - The "password" from the output
   - `AZURE_SUBSCRIPTION_ID` - Your Azure subscription ID

## Deployment Workflow

The deployment consists of a streamlined workflow (`deploy.yml`) that:

1. **Backend API Deployment** - Builds and deploys the .NET API to Azure App Service
2. **Frontend Deployment** - Builds and deploys the React app to Azure Static Web Apps

Both jobs run in parallel automatically when code is pushed to the `main` branch.
3. **Frontend Deployment** - Builds and deploys the React app to Azure Static Web Apps

Infrastructure deployments are handled manually from your local machine using the Azure CLI and Bicep templates.

All application deployments run automatically when code is pushed to the `main` branch.

## Infrastructure Deployment

Infrastructure is deployed manually from your local machine for better control over Azure resources.

### Prerequisites
- Azure CLI installed and logged in
- Proper Azure permissions for the target subscription and resource group

### Deploy Infrastructure
```bash
# Navigate to infrastructure directory
cd infrastructure

# Deploy using Azure CLI
az deployment group create \
  --resource-group $AZURE_RESOURCE_GROUP \
  --template-file main.bicep \
  --parameters @parameters/prod.parameters.json \
  --parameters sqlAdminPassword="YourSecurePassword"
```

## Manual Deployment

You can also trigger deployments manually using the "workflow_dispatch" trigger in the GitHub Actions tab.

## Resources Created

The infrastructure will create:
- SQL Server and Database (`fifa-prod-sql`, `fifa-prod-db`)
- App Service Plan and App Service (`fifa-prod-plan`, `fifa-prod-api`)
- Static Web App (`fifa-prod-web`)
- Storage Account (`fifaprodstorage`)
- Application Insights (`fifa-prod-insights`)
