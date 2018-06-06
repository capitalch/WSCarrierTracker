using System;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Clients.ActiveDirectory;

namespace Wineshipping.IT.PackageTracking.ImportPackage.Common
{
    public class D365OAuthHelper
    {
        // Class variables
        private static string _authorizationHeader;
        private static AuthenticationResult _authResult { get; set; }

        /// <summary>
        /// The header to use for OAuth.
        /// </summary>
        public const string OAuthHeader = "Authorization";

        /// <summary>
        /// Retrieves an authentication header from the service.
        /// </summary>
        /// <returns>The authentication header for the Web API call.</returns>
        public static async Task<string> AuthorizationHeader(bool useWebAppAuthentication = true)
        {
            string aadTenant = D365ClientConfiguration.Default.ActiveDirectoryTenant;
            string aadResource = D365ClientConfiguration.Default.ActiveDirectoryResource;
            string azureEndPoint = D365ClientConfiguration.Default.AzureAuthEndPoint;
            string aadClientAppId = D365ClientConfiguration.Default.ActiveDirectoryClientAppId;
            string aadClientSecret = D365ClientConfiguration.Default.ActiveDirectoryClientAppSecret;

            try
            {
                if (!string.IsNullOrEmpty(_authorizationHeader) && DateTime.UtcNow.AddSeconds(180) < _authResult.ExpiresOn)
                    return _authorizationHeader;
                var uri = new UriBuilder(azureEndPoint) { Path = aadTenant };
                var authContext = new AuthenticationContext(uri.ToString());
                if (useWebAppAuthentication == true)
                {
                    var credentials = new ClientCredential(aadClientAppId, aadClientSecret);
                    bool validateAuthority = authContext.ValidateAuthority;
                    _authResult = await authContext.AcquireTokenAsync(aadResource, credentials);
                    _authorizationHeader = _authResult.CreateAuthorizationHeader();
                }
                else
                {
                    // OAuth through username and password.
                    string username = D365ClientConfiguration.Default.UserName;
                    string password = D365ClientConfiguration.Default.Password;

                    // Get token object
                    var userCredential = new UserPasswordCredential(username, password);
                    _authResult = authContext.AcquireTokenAsync(aadResource, aadClientAppId, userCredential).Result;
                }
                return _authorizationHeader;
            }
            catch (Exception ex)
            {
                //CrossCutting.LogHelper.Log("Dynamics 365 OAuth Error: ", CrossCutting.LogLevels.Error, ex);
                return null;
            }
        }

        public static string GetAuthenticationHeader(bool useWebAppAuthentication = true)
        {
            string aadTenant = D365ClientConfiguration.Default.ActiveDirectoryTenant;
            string azureEndPoint = D365ClientConfiguration.Default.AzureAuthEndPoint;
            string aadClientAppId = D365ClientConfiguration.Default.ActiveDirectoryClientAppId;
            string aadResource = D365ClientConfiguration.Default.ActiveDirectoryResource;
            var uri = new UriBuilder(azureEndPoint) { Path = aadTenant };
            AuthenticationContext authenticationContext = new AuthenticationContext(uri.ToString());
            AuthenticationResult authenticationResult;

            if (useWebAppAuthentication)
            {
                string aadClientAppSecret = D365ClientConfiguration.Default.ActiveDirectoryClientAppSecret;
                var creadential = new ClientCredential(aadClientAppId, aadClientAppSecret);
                authenticationResult = authenticationContext.AcquireTokenAsync(aadResource, creadential).Result;
            }
            else
            {
                // OAuth through username and password.
                string username = D365ClientConfiguration.Default.UserName;
                string password = D365ClientConfiguration.Default.Password;

                // Get token object
                var userCredential = new UserPasswordCredential(username, password);
                authenticationResult = authenticationContext.AcquireTokenAsync(aadResource, aadClientAppId, userCredential).Result;
            }

            // Create and get JWT token
            return authenticationResult.CreateAuthorizationHeader();
        }
    }
}
