using System;
using ConfigManager = System.Configuration.ConfigurationManager;

namespace Wineshipping.IT.PackageTracking.ImportPackage.Common
{
    public partial class D365ClientConfiguration
    {
        public string UriString { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
        public string ActiveDirectoryResource { get; set; }
        public string ActiveDirectoryTenant { get; set; }
        public string ActiveDirectoryClientAppId { get; set; }
        public string ActiveDirectoryClientAppSecret { get; set; }
        public string AzureAuthEndPoint { get; set; }

        public static D365ClientConfiguration Default
        {
            get
            {
                return D365ClientConfiguration.OneBox;
            }
        }

        public static D365ClientConfiguration OneBox = new D365ClientConfiguration()
        {
            UriString = Convert.ToString(ConfigManager.AppSettings["D365OperationEndPoint"]) + "/",
            UserName = Convert.ToString(ConfigManager.AppSettings["D365OperationUserName"]),
            Password = Convert.ToString(ConfigManager.AppSettings["D365OperationPassword"]),
            ActiveDirectoryResource = Convert.ToString(ConfigManager.AppSettings["D365OperationEndPoint"]),
            ActiveDirectoryTenant = Convert.ToString(ConfigManager.AppSettings["D365OperationTenant"]),
            ActiveDirectoryClientAppId = Convert.ToString(ConfigManager.AppSettings["D365OperationClientAppId"]),
            ActiveDirectoryClientAppSecret = Convert.ToString(ConfigManager.AppSettings["D365OperationClientAppSecret"]),
            AzureAuthEndPoint = Convert.ToString(ConfigManager.AppSettings["D365OperationAuthEndPoint"])
        };
    }
}
