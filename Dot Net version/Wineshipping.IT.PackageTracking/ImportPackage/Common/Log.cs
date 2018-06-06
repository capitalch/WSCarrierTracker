using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Wineshipping.IT.PackageTracking.ImportPackage.Common
{
    public enum LogLevels
    {
        Info = 1,
        Error,
        Debug,
        Fatal,
        Trace,
        Warn
    }

    public static class Log
    {
        public static void LogToDB(string Message, LogLevels Level = LogLevels.Info, Exception ex = null)
        {
            using (SqlConnection sqlConn = new SqlConnection(ConfigurationManager.ConnectionStrings["ApplicationConnectionString"].ConnectionString.ToString()))
            {
                sqlConn.Open();
                try
                {

                    SqlCommand sqlComm = new SqlCommand("InsertLog", sqlConn);
                    sqlComm.CommandType = CommandType.StoredProcedure;
                    sqlComm.Parameters.AddWithValue("@level", Level);
                    sqlComm.Parameters.AddWithValue("@message", Convert.ToString(Message));
                    string curAssembly = Convert.ToString(System.Reflection.Assembly.GetExecutingAssembly().GetName().Name);
                    string curClass = Convert.ToString(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);
                    string curMethod = Convert.ToString(System.Reflection.MethodInfo.GetCurrentMethod().Name);
                    string source = curAssembly + "/ " + curClass + "/ " + curMethod;
                    sqlComm.Parameters.AddWithValue("@source", Convert.ToString(source));
                    if (ex != null)
                    {
                        sqlComm.Parameters.AddWithValue("@stackTrace", Convert.ToString(ex.StackTrace));
                        sqlComm.Parameters.AddWithValue("@innerException", Convert.ToString(ex.InnerException));
                        sqlComm.Parameters.AddWithValue("@additionalInfo", Convert.ToString(ex.Message));
                    }
                    int numRowInserted = sqlComm.ExecuteNonQuery();
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.ToString());
                }
            }
        }
    }
}
