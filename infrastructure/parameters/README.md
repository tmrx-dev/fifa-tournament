# Infrastructure Parameters

This directory contains Azure Bicep deployment parameters for different environments.

## 🔒 Security Notice

**Parameter files (*.parameters.json) are excluded from version control** because they contain sensitive information like database passwords.

## 📋 Setup Instructions

### For New Developers:

1. Copy the template files to create your parameter files:
   ```bash
   cp dev.parameters.template.json dev.parameters.json
   cp prod.parameters.template.json prod.parameters.json
   ```

2. Replace placeholder values with actual secrets:
   - Update `sqlAdminPassword` with a secure password
   - Add any other environment-specific values

### For Production Deployments:

**Never put real passwords in parameter files!** Instead, use one of these secure approaches:

#### Option 1: Azure Key Vault Integration
```bash
az deployment group create \
  --resource-group your-rg \
  --template-file ../main.bicep \
  --parameters dev.parameters.json \
  --parameters sqlAdminPassword="@Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/sql-admin-password/)"
```

#### Option 2: Command Line Override
```bash
az deployment group create \
  --resource-group your-rg \
  --template-file ../main.bicep \
  --parameters dev.parameters.json \
  --parameters sqlAdminPassword="$(az keyvault secret show --vault-name your-keyvault --name sql-admin-password --query value -o tsv)"
```

#### Option 3: Azure DevOps/GitHub Actions Variables
Use pipeline variables or GitHub secrets to inject values during deployment.

## 📁 File Structure

- `*.template.json` - Template files (safe to commit)
- `*.parameters.json` - Actual parameter files (excluded from git)
- `README.md` - This documentation

## 🛡️ Best Practices

1. **Never commit real secrets to version control**
2. **Use strong, unique passwords for each environment**
3. **Rotate passwords regularly**
4. **Use Azure Key Vault for production secrets**
5. **Limit access to parameter files on local machines**

## 🔧 Environment-Specific Notes

### Development Environment
- Use the dev.parameters.json file
- Passwords can be simpler but still secure
- Consider using Azure SQL Database with managed identity

### Production Environment
- Use the prod.parameters.json file
- Must use strong, complex passwords
- Should integrate with Azure Key Vault
- Enable Azure SQL Advanced Threat Protection
