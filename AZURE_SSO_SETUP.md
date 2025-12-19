# Azure AD SSO Setup Guide

This guide will walk you through setting up Azure AD Single Sign-On (SSO) for Menufic.

## Prerequisites

- An Azure AD tenant (Azure Active Directory)
- Administrator access to Azure Portal
- Access to your Menufic application environment variables

## Step 1: Register Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**

### Application Registration Details

- **Name**: `Menufic` (or your preferred application name)
- **Supported account types**: Select **Accounts in this organizational directory only** (Single tenant)
- **Redirect URI**:
  - Platform: **Web**
  - URI: `http://localhost:3000/api/auth/callback/azure-ad` (for local development)
  - For production, use: `https://yourdomain.com/api/auth/callback/azure-ad`

4. Click **Register**

## Step 2: Create Client Secret

1. After registration, go to **Certificates & secrets** in the left menu
2. Click **New client secret**
3. Add a description (e.g., "Menufic Production")
4. Select an expiration period (recommended: 24 months)
5. Click **Add**
6. **IMPORTANT**: Copy the **Value** immediately - you won't be able to see it again
   - This is your `AZURE_AD_CLIENT_SECRET`

## Step 3: Get Application Configuration Values

### Client ID
1. Go to **Overview** page of your app registration
2. Copy the **Application (client) ID**
   - This is your `AZURE_AD_CLIENT_ID`

### Tenant ID
1. On the same **Overview** page
2. Copy the **Directory (tenant) ID**
   - This is your `AZURE_AD_TENANT_ID`

## Step 4: Configure API Permissions (Optional)

By default, Azure AD provides basic profile information. If you need additional permissions:

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add the following permissions:
   - `User.Read` (already included by default)
   - `email`
   - `profile`
   - `openid`

6. Click **Add permissions**
7. Click **Grant admin consent** (if you're an admin)

## Step 5: Update Environment Variables

Add the following to your `.env` file:

```bash
AZURE_AD_CLIENT_ID="your-application-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret-value"
AZURE_AD_TENANT_ID="your-tenant-id"
```

Replace the placeholder values with the actual values you copied from Azure Portal.

## Step 6: Test the Integration

1. Start your application:
   ```bash
   npm run dev
   ```

2. Navigate to the sign-in page
3. You should see a new "Sign in with Microsoft" button
4. Click the button to test the Azure AD authentication flow
5. Sign in with your Azure AD credentials
6. Verify you're redirected back to the application and logged in successfully

## Production Deployment

When deploying to production:

1. Add the production redirect URI in Azure Portal:
   - Go to **Authentication** in your app registration
   - Under **Platform configurations** > **Web**
   - Add redirect URI: `https://yourdomain.com/api/auth/callback/azure-ad`

2. Update your production environment variables with the same Azure AD credentials

3. Ensure `NEXTAUTH_URL` is set to your production domain:
   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   ```

## Troubleshooting

### Common Issues

**Error: "AADSTS50011: The reply URL specified in the request does not match"**
- Solution: Ensure the redirect URI in Azure Portal exactly matches your callback URL
- Check protocol (http vs https), domain, and path

**Error: "AADSTS700016: Application with identifier was not found"**
- Solution: Verify `AZURE_AD_CLIENT_ID` is correct
- Ensure the app registration is in the correct tenant

**Error: "AADSTS7000215: Invalid client secret is provided"**
- Solution: The client secret may have expired or is incorrect
- Generate a new client secret in Azure Portal

**Users from other organizations cannot sign in**
- This is expected behavior for single-tenant configuration
- Only users from your Azure AD tenant can sign in
- To allow multi-tenant access, change the app registration to support multi-tenant accounts

### Debug Mode

To enable debug logging for NextAuth:

1. Add to your `.env` file:
   ```bash
   NEXTAUTH_DEBUG=true
   ```

2. Check the console and server logs for detailed authentication flow information

## Security Best Practices

1. **Rotate Client Secrets**: Set reminders to rotate secrets before expiration
2. **Use Environment Variables**: Never commit secrets to version control
3. **Monitor Sign-ins**: Use Azure AD sign-in logs to monitor authentication activity
4. **Enable MFA**: Require multi-factor authentication for your Azure AD tenant
5. **Restrict Access**: Use Conditional Access policies if available in your Azure AD tier

## Additional Resources

- [NextAuth.js Azure AD Provider Documentation](https://next-auth.js.org/providers/azure-ad)
- [Azure AD App Registration Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Identity Platform Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review NextAuth.js logs in development mode
3. Check Azure AD sign-in logs in Azure Portal
4. Open an issue on the Menufic GitHub repository
