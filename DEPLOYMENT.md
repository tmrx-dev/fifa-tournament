# FIFA Tournament - CI/CD Setup

This repository is configured for automatic deployment to Azure when code is pushed to the `main` branch.

## Required GitHub Secrets

To enable automatic deployment, you need to configure the following secrets in your GitHub repository:

### Azure Authentication
1. **AZURE_CREDENTIALS** - Service principal credentials for Azure authentication
2. **AZURE_SUBSCRIPTION_ID** - Your Azure subscription ID
3. **AZURE_RESOURCE_GROUP** - The Azure resource group name

### Database
4. **SQL_ADMIN_PASSWORD** - SQL Server administrator password

### Static Web App
5. **AZURE_STATIC_WEB_APPS_API_TOKEN** - API token for Static Web Apps deployment

## Setting up Azure Credentials

1. Create a service principal:
```bash
az ad sp create-for-rbac --name "fifa-tournament-deploy" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} --sdk-auth
```

2. Copy the JSON output and add it as the `AZURE_CREDENTIALS` secret in GitHub.

## Deployment Workflow

The deployment consists of a single comprehensive workflow (`deploy.yml`) that:

1. **Tests** - Runs frontend linting/tests and backend builds/tests
2. **Infrastructure Deployment** - Deploys Azure resources using Bicep templates
3. **Backend API Deployment** - Builds and deploys the .NET API to Azure App Service
4. **Frontend Deployment** - Builds and deploys the React app to Azure Static Web Apps

All steps run automatically when code is pushed to the `main` branch.

## Manual Deployment

You can also trigger deployments manually using the "workflow_dispatch" trigger in the GitHub Actions tab.

## Resources Created

The infrastructure will create:
- SQL Server and Database (`fifa-prod-sql`, `fifa-prod-db`)
- App Service Plan and App Service (`fifa-prod-plan`, `fifa-prod-api`)
- Static Web App (`fifa-prod-web`)
- Storage Account (`fifaprodstorage`)
- Application Insights (`fifa-prod-insights`)
