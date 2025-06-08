# FIFA Tournament App - Azure Infrastructure Plan

## Overview
This document outlines the Azure infrastructure setup for the FIFA Tournament web application. The architecture is designed to be cost-effective while providing scalability and reliability for a small to medium user base.

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Azure CDN     │    │  Static Web App │    │   App Service   │
│   (Frontend)    │◄───┤   (Frontend)    │    │   (Backend API) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                └───────────────────────┼─────────────┐
                                                        │             │
                                                        ▼             ▼
                                               ┌─────────────────┐    ┌─────────────────┐
                                               │ Azure SQL DB    │    │ Azure AD B2C    │
                                               │ (Database)      │    │ (Authentication)│
                                               └─────────────────┘    └─────────────────┘
```

## Azure Services

### 1. Azure Static Web Apps (Frontend)
- **Purpose**: Host the React/Vite frontend application
- **Tier**: Free tier (100GB bandwidth/month, custom domains)
- **Features**:
  - Built-in CI/CD from GitHub
  - Global CDN distribution
  - Custom domains and SSL certificates
  - API integration with Azure Functions or App Service

### 2. Azure App Service (Backend API)
- **Purpose**: Host the .NET Web API
- **Tier**: Basic B1 (1 Core, 1.75GB RAM) - ~$13/month
- **Features**:
  - Auto-scaling capabilities
  - Deployment slots for staging
  - Built-in monitoring and diagnostics
  - Easy integration with Azure AD B2C

### 3. Azure SQL Database
- **Purpose**: Store application data (users, teams, tournaments, matches)
- **Tier**: Basic (5 DTU, 2GB) - ~$5/month
- **Features**:
  - Automatic backups
  - Point-in-time restore
  - Built-in security features
  - Can scale up when needed

### 4. Azure AD B2C (Authentication)
- **Purpose**: Handle user authentication with social logins
- **Tier**: Free tier (50,000 MAU)
- **Features**:
  - Social identity providers (Google, Facebook, Microsoft)
  - Custom user journeys
  - Multi-factor authentication
  - User profile management

### 5. Azure Storage Account (Optional)
- **Purpose**: Store team icons and other static assets
- **Tier**: Standard LRS - ~$1-2/month for small usage
- **Features**:
  - Blob storage for images
  - CDN integration
  - Image resizing with Azure Functions

## Cost Estimation

| Service | Tier | Monthly Cost (USD) |
|---------|------|-------------------|
| Static Web Apps | Free | $0 |
| App Service | Basic B1 | $13 |
| SQL Database | Basic | $5 |
| Azure AD B2C | Free | $0 |
| Storage Account | Standard LRS | $2 |
| **Total** | | **~$20/month** |

## Deployment Strategy

### Environment Setup
1. **Development**: Local development with local SQL Server/SQLite
2. **Staging**: Separate resource group with same services (lower tiers)
3. **Production**: Full infrastructure as described above

### CI/CD Pipeline
1. **Frontend**: GitHub Actions → Azure Static Web Apps
2. **Backend**: GitHub Actions → Azure App Service
3. **Database**: Entity Framework migrations via deployment pipeline

## Security Considerations

### Authentication & Authorization
- Azure AD B2C for user authentication
- JWT tokens for API authorization
- Role-based access control (Tournament Admin, Team Owner)

### Data Protection
- HTTPS everywhere (enforced)
- SQL Database encryption at rest
- Network security groups
- API rate limiting

### Best Practices
- Separate resource groups for different environments
- Use managed identities where possible
- Regular security updates and patching
- Monitor with Azure Security Center

## Scalability Plan

### Initial Setup (0-1000 users)
- Current architecture is sufficient
- Monitor performance metrics

### Growth Phase (1000-10000 users)
- Scale App Service to Standard tier
- Consider Azure SQL Database elastic pool
- Implement Redis cache for session management

### High Growth (10000+ users)
- Move to Premium App Service with multiple instances
- Implement Application Gateway for load balancing
- Consider Azure Cosmos DB for global distribution
- Implement Azure CDN for static assets

## Monitoring & Analytics

### Application Monitoring
- Application Insights for performance monitoring
- Custom telemetry for business metrics
- Automated alerts for errors and performance issues

### Business Analytics
- Track tournament participation
- Monitor user engagement
- Performance metrics for matches and tournaments

## Backup & Disaster Recovery

### Database Backups
- Automatic daily backups (7-day retention)
- Point-in-time restore capability
- Cross-region backup replication for production

### Application Recovery
- Multi-region deployment for high availability
- Infrastructure as Code for quick environment recreation
- Regular disaster recovery testing

## Infrastructure as Code

All infrastructure will be defined using Azure Bicep templates with the following structure:
- `main.bicep` - Main deployment template
- `modules/` - Reusable modules for each service
- `parameters/` - Environment-specific parameters

This ensures:
- Consistent deployments across environments
- Version control for infrastructure changes
- Easy rollback capabilities
- Compliance and audit trails
