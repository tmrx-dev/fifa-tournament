# FIFA Tournament

This application has been successfully deployed to Azure with automated CI/CD pipeline.

## Infrastructure
- **App Service**: fifa-prod-api (F1 Free tier)
- **SQL Database**: fifa-prod-db (Basic tier, 1GB)
- **Static Web App**: fifa-prod-web (Free tier)
- **Storage Account**: fifaprodstorage (Cool tier)
- **Application Insights**: fifa-prod-insights

## Estimated Monthly Cost
- Approximately €7.70/month for minimal traffic
- Most services are using free/basic tiers for cost optimization

## Deployment
The application automatically deploys when changes are pushed to the main branch.
