@description('Main deployment template for FIFA Tournament App')

param location string = resourceGroup().location
param sqlAdminUsername string = 'sqladmin'
@secure()
param sqlAdminPassword string

// Naming convention - single production environment
var resourcePrefix = 'fifa-prod'

// Deploy SQL Server and Database
module sqlServer 'modules/sql-server.bicep' = {
  name: 'sqlServerDeployment'
  params: {
    serverName: '${resourcePrefix}-sql'
    location: location
    administratorLogin: sqlAdminUsername
    administratorLoginPassword: sqlAdminPassword
    databaseName: '${resourcePrefix}-db'
  }
}

// Deploy App Service Plan and App Service
module appService 'modules/app-service.bicep' = {
  name: 'appServiceDeployment'
  params: {
    appServicePlanName: '${resourcePrefix}-plan'
    appServiceName: '${resourcePrefix}-api'
    location: location
    sku: 'B1'
  }
}

// Deploy Static Web App
module staticWebApp 'modules/static-web-app.bicep' = {
  name: 'staticWebAppDeployment'
  params: {
    staticWebAppName: '${resourcePrefix}-web'
    location: location
    repositoryUrl: 'https://github.com/tmrx-dev/fifa-tournament'
    branch: 'main'
  }
}

// Deploy Storage Account
module storage 'modules/storage.bicep' = {
  name: 'storageDeployment'
  params: {
    storageAccountName: '${replace(resourcePrefix, '-', '')}storage'
    location: location
  }
}

// Deploy Application Insights
module appInsights 'modules/app-insights.bicep' = {
  name: 'appInsightsDeployment'
  params: {
    appInsightsName: '${resourcePrefix}-insights'
    location: location
  }
}

// Outputs
output sqlServerName string = sqlServer.outputs.serverName
output sqlDatabaseName string = sqlServer.outputs.databaseName
output appServiceName string = appService.outputs.appServiceName
output staticWebAppName string = staticWebApp.outputs.staticWebAppName
output storageAccountName string = storage.outputs.storageAccountName
output appInsightsInstrumentationKey string = appInsights.outputs.instrumentationKey
