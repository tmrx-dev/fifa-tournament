@description('Main deployment template for FIFA Tournament App')

param environmentName string = 'dev'
param location string = resourceGroup().location
param sqlAdminUsername string = 'sqladmin'
@secure()
param sqlAdminPassword string

// Naming convention
var resourcePrefix = 'fifa-${environmentName}'

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
    sku: environmentName == 'prod' ? 'B1' : 'F1'
  }
}

// Deploy Static Web App
module staticWebApp 'modules/static-web-app.bicep' = {
  name: 'staticWebAppDeployment'
  params: {
    staticWebAppName: '${resourcePrefix}-web'
    location: location
    repositoryUrl: 'https://github.com/tmrx-dev/fifa-tournament'
    branch: environmentName == 'prod' ? 'main' : 'develop'
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
