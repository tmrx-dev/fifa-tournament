# FIFA Tournament Application

A full-stack web application for managing FIFA tournaments with ASP.NET Core backend and modern frontend.

## 🏗️ Architecture

- **Backend**: ASP.NET Core 8.0 Web API
- **Frontend**: Modern JavaScript/TypeScript SPA
- **Infrastructure**: Azure App Service + Azure Static Web Apps
- **CI/CD**: GitHub Actions with automated testing and deployment

## 🚀 Quick Start

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+
- Azure CLI (for deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/tmrx-dev/fifa-tournament.git
cd fifa-tournament

# Backend setup
cd backend/FifaTournament.Api
dotnet restore
dotnet run

# Frontend setup (in another terminal)
cd frontend
npm install
npm run dev
```

## 🔄 CI/CD Pipeline

The project uses two streamlined GitHub Actions workflows:

### 1. Main CI/CD Workflow (`ci-cd.yml`)
**Triggers:**
- Push to `main` branch
- Pull requests to `main`
- Manual dispatch

**Features:**
- Automated testing for backend and frontend
- Build artifact generation
- Environment-protected deployments
- Separate test and deployment jobs

### 2. Path-based Deployment (`path-deployment.yml`)
**Triggers:**
- Push to `main` with changes in `backend/` or `frontend/` directories

**Features:**
- Intelligent path detection using `dorny/paths-filter`
- Deploys only changed components
- Optimized for incremental updates

## 🌐 Deployment

### Automatic Deployment
- **Main Branch**: All pushes to `main` trigger automatic deployment
- **Path Changes**: Changes to specific paths trigger targeted deployments
- **Environment Protection**: Production deployments require environment approval

### Manual Deployment
```bash
# Trigger main CI/CD workflow manually
gh workflow run ci-cd.yml

# Or via GitHub UI: Actions → CI/CD → Run workflow
```

## 🔧 Environment Configuration

### Required Secrets
- `AZURE_WEBAPP_PUBLISH_PROFILE`: Backend deployment profile
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: Frontend deployment token

### Environment URLs
- **Backend API**: https://fifa-dev-api.azurewebsites.net
- **Frontend**: https://victorious-pond-05d5a0403.6.azurestaticapps.net

## 📁 Project Structure

```
fifa-tournament/
├── .github/
│   └── workflows/          # GitHub Actions workflows
│       ├── ci-cd.yml       # Main CI/CD pipeline
│       └── path-deployment.yml  # Path-based deployment
├── backend/
│   └── FifaTournament.Api/ # ASP.NET Core Web API
├── frontend/               # Frontend application
├── infrastructure/         # Azure infrastructure configs
└── README.md
```

## 🧪 Testing

### Backend Tests
```bash
cd backend/FifaTournament.Api
dotnet test --verbosity normal
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📝 Development Workflow

1. **Feature Development**: Create feature branches from `main`
2. **Pull Request**: Submit PR with automated testing
3. **Review & Merge**: Code review and merge to `main`
4. **Automatic Deployment**: Changes automatically deploy to production
5. **Monitoring**: Check deployment status in GitHub Actions

## 🔄 Workflow Improvements (December 2024)

### Changes Made
- **Consolidated**: Reduced 5 redundant workflows to 2 comprehensive ones
- **Modernized**: Updated to latest GitHub Actions versions (v4)
- **Optimized**: Added path-based deployment for efficiency
- **Enhanced**: Improved error handling and environment protection
- **Streamlined**: Better separation of concerns between testing and deployment

### Benefits
- ✅ Reduced maintenance overhead
- ✅ Faster deployments with path detection
- ✅ Better test coverage and reliability
- ✅ Consistent deployment strategies
- ✅ Modern CI/CD best practices

## 🛠️ Troubleshooting

### Common Issues
1. **Deployment Failures**: Check secrets configuration in repository settings
2. **Test Failures**: Ensure all dependencies are installed and up to date
3. **Build Errors**: Verify .NET 8.0 and Node.js 18+ compatibility

### Getting Help
- Check [GitHub Actions runs](https://github.com/tmrx-dev/fifa-tournament/actions) for detailed logs
- Review workflow files in `.github/workflows/` for configuration
- Consult Azure portal for deployment status and logs

## 📋 License

This project is licensed under the MIT License.
