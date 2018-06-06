using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Wineshipping.IT.PackageTracking.ImportPackage.Common;


namespace Wineshipping.IT.PackageTracking.ImportPackage
{
    class Program
    {
        static void Main()
        {
            try
            {
                Common.D365ImportPackages.GetPackages();

                // Wait before quitting if running in debug mode
                if (!System.Diagnostics.Debugger.IsAttached)
                    return;

                Console.WriteLine("Press any key to exit...");
                Console.ReadKey();
            }
            catch(Exception ex)
            {
                Console.WriteLine(ex.ToString());
                Log.LogToDB("Error occured", LogLevels.Error, ex);
            }
        }
    }
}
