using System;
using System.Collections.Generic;
using Microsoft.OData.Client;
using System.Linq;
using System.Text;
using System.Net;
using System.Threading.Tasks;
using Wineshipping.IT.PackageTracking.ODataUtility.Microsoft.Dynamics.DataEntities;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using System.IO;
using Newtonsoft.Json;

namespace Wineshipping.IT.PackageTracking.ImportPackage.Common
{
    public static class D365ImportPackages
    {
        public static string ODataEntityPath = D365ClientConfiguration.Default.UriString + "/data";

        public static void GetPackages()
        {
            string WHSContainerTableModifiedDateTime = GetQueryDateTime();
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            Uri oDataUri = new Uri(ODataEntityPath, UriKind.Absolute);
            var context = new Resources(oDataUri);
            context.SendingRequest2 += new EventHandler<SendingRequest2EventArgs>(delegate (object sender, SendingRequest2EventArgs e)
            {
                var response = Task.Run(async () =>
                {
                    return await D365OAuthHelper.AuthorizationHeader(true);
                });
                response.Wait();
                e.RequestMessage.SetHeader(D365OAuthHelper.OAuthHeader, response.Result.ToString());
            });

            
            DataServiceQuery<WINShipmentContainer> wsShipmentContainers = context.WINShipmentContainers.AddQueryOption("$filter", "(ShipmentStatus eq Microsoft.Dynamics.DataEntities.WHSShipmentStatus'Shipped' or ShipmentStatus eq Microsoft.Dynamics.DataEntities.WHSShipmentStatus'Loaded' or ShipmentStatus eq Microsoft.Dynamics.DataEntities.WHSShipmentStatus'Waved') and dataAreaId eq 'WS' and  WHSContainerTableModifiedDateTime ge " + WHSContainerTableModifiedDateTime).AddQueryOption("cross-company", "true");
            if (wsShipmentContainers != null)
            {
                int countPackages = wsShipmentContainers.Count();
                if (countPackages > 0)
                {
                    
                    Console.WriteLine("TimeStamp: " + WHSContainerTableModifiedDateTime + "New Package Count: " + countPackages.ToString());
                    Console.WriteLine(wsShipmentContainers.ToString());
                    using (SqlConnection sqlConn = new SqlConnection(ConfigurationManager.ConnectionStrings["ApplicationConnectionString"].ConnectionString.ToString()))
                    {
                        sqlConn.Open();
                        foreach (WINShipmentContainer wsShipmentContainer in wsShipmentContainers)
                        {
                            try
                            {
                                if (sqlConn.State != ConnectionState.Open)
                                {
                                    sqlConn.Open();
                                }
                                string containerId = wsShipmentContainer.ContainerId;
                                if (!string.IsNullOrEmpty(containerId))
                                {
                                    SqlCommand sqlComm = new SqlCommand("ImportPackages", sqlConn);
                                    sqlComm.CommandType = CommandType.StoredProcedure;
                                    sqlComm.Parameters.AddWithValue("@No", containerId);
                                    string winCarrier = Convert.ToString(wsShipmentContainer.WINCarrier);
                                    string winService = Convert.ToString(wsShipmentContainer.WINService);
                                    if (!string.IsNullOrEmpty(winCarrier))
                                    {
                                        winCarrier = winCarrier.Length > 3 ? winCarrier.Substring(0, 3) : winCarrier;
                                    }
                                    string shipCarrier = !string.IsNullOrEmpty(winCarrier) ? winCarrier : Convert.ToString(wsShipmentContainer.ShippingCarrier);
                                    string shipService = !string.IsNullOrEmpty(winService) ? winService : Convert.ToString(wsShipmentContainer.ShippingCarrierService);

                                    sqlComm.Parameters.AddWithValue("@ShippingAgentCode", shipCarrier);
                                    sqlComm.Parameters.AddWithValue("@ShippingAgentService", shipService);

                                    sqlComm.Parameters.AddWithValue("@ERPCarrierCode", winCarrier);
                                    sqlComm.Parameters.AddWithValue("@ERPCarrierServiceCode", winService);

                                    sqlComm.Parameters.AddWithValue("@ExternalTrackingNo", wsShipmentContainer.ShipCarrierTrackingNum);
                                    sqlComm.Parameters.AddWithValue("@ManifestNo", wsShipmentContainer.ShipmentId);
                                    sqlComm.Parameters.AddWithValue("@ExternalDocumentNo", wsShipmentContainer.CustomerOrderNumber);
                                    sqlComm.Parameters.AddWithValue("@ShiptoName", wsShipmentContainer.WINDeliveryPersonFirstName);
                                    sqlComm.Parameters.AddWithValue("@ShiptoName2", wsShipmentContainer.WINDeliveryPersonLastName);
                                    sqlComm.Parameters.AddWithValue("@ShiptoAddress", wsShipmentContainer.WINDeliveryAddress1);
                                    sqlComm.Parameters.AddWithValue("@ShiptoAddress2", wsShipmentContainer.WINDeliveryAddress2);
                                    sqlComm.Parameters.AddWithValue("@ShiptoCity", wsShipmentContainer.WINDeliveryCity);
                                    sqlComm.Parameters.AddWithValue("@ShiptoState", wsShipmentContainer.WINDeliveryState);
                                    sqlComm.Parameters.AddWithValue("@ShiptoZIPCode", wsShipmentContainer.WINDeliveryZipCode);
                                    sqlComm.Parameters.AddWithValue("@ShiptoCountryCode", wsShipmentContainer.WINDeliveryCountry);
                                    sqlComm.Parameters.AddWithValue("@ShiptoPhoneNo", wsShipmentContainer.WINDeliveryPhone);
                                    sqlComm.Parameters.AddWithValue("@ShipmentDate", wsShipmentContainer.ConfirmedShipDateTime);
                                    sqlComm.Parameters.AddWithValue("@SelltoCustomerNo", wsShipmentContainer.CustomerID);
                                    sqlComm.Parameters.AddWithValue("@CalculationWeight", string.Format(wsShipmentContainer.Weight + " " + wsShipmentContainer.WeightUnit));
                                    sqlComm.Parameters.AddWithValue("@NoOfBottles", wsShipmentContainer.WINBottleQty);
                                    //wsShipmentContainer.ShipmentStatus = WHSShipmentStatus.
                                    sqlComm.Parameters.AddWithValue("@Status", wsShipmentContainer.ShipmentStatus.ToString());
                                    sqlComm.Parameters.AddWithValue("@StatusDate", wsShipmentContainer.WINStatusDate);
                                    sqlComm.Parameters.AddWithValue("@StatusTime", DateTime.Now.ToLongTimeString());
                                    sqlComm.Parameters.AddWithValue("@WSDescription", "Internal Order Number: " + wsShipmentContainer.InternalOrderNumber);
                                    sqlComm.Parameters.AddWithValue("@ShipNotificationAttn", string.Format(wsShipmentContainer.WINDeliveryPersonFirstName + " " + wsShipmentContainer.WINDeliveryPersonLastName));
                                    sqlComm.Parameters.AddWithValue("@ShipNotificationEmail", wsShipmentContainer.WINDeliveryEmail);
                                    sqlComm.Parameters.AddWithValue("@SourceID", wsShipmentContainer.InternalOrderNumber);
                                    sqlComm.Parameters.AddWithValue("@OrderType", wsShipmentContainer.WINOrderType.ToString());
                                    sqlComm.Parameters.AddWithValue("@LocationCode", string.Format(wsShipmentContainer.ShipFromSite + " - " + wsShipmentContainer.ShipFromWarehouse));
                                    sqlComm.Parameters.AddWithValue("@OrderPool", wsShipmentContainer.SalesPoolId);
                                    sqlComm.Parameters.AddWithValue("@ShiptoContact", wsShipmentContainer.WINDeliveryCompanyName);
                                    sqlComm.Parameters.AddWithValue("@ExceptionNotificationEmail", wsShipmentContainer.WINDeliveryEmail);
                                    int numRowInserted = sqlComm.ExecuteNonQuery();
                                    if (numRowInserted >= 0) 
                                    {
                                        try
                                        {
                                            string endPointSequence = ODataEntityPath + "/ShipContainerLines?$filter=ContainerId eq '" + containerId + "'";
                                            var request = HttpWebRequest.Create(endPointSequence);
                                            request.Headers[D365OAuthHelper.OAuthHeader] = D365OAuthHelper.GetAuthenticationHeader(true);
                                            request.Method = "GET";
                                            request.ContentLength = 0;
                                            using (var response = (HttpWebResponse)request.GetResponse())
                                            {
                                                using (Stream responseStream = response.GetResponseStream())
                                                {
                                                    using (StreamReader streamReader = new StreamReader(responseStream))
                                                    {
                                                        string responseString = streamReader.ReadToEnd();
                                                        var dict = JsonConvert.DeserializeObject<dynamic>(responseString);
                                                        if (dict != null)
                                                        {
                                                            if (dict["value"] != null)
                                                            {
                                                                try
                                                                {
                                                                    if (sqlConn.State != ConnectionState.Open)
                                                                    {
                                                                        sqlConn.Open();
                                                                    }
                                                                    using (SqlCommand command = new SqlCommand("DELETE from [Wineshipping$Package Line] where ContainerId=@ContainerId", sqlConn))
                                                                    {
                                                                        command.Parameters.Add(new SqlParameter("ContainerId", containerId));
                                                                        command.ExecuteNonQuery();
                                                                    }
                                                                }
                                                                catch
                                                                {

                                                                }

                                                                foreach (dynamic entity in dict["value"])
                                                                {
                                                                    try
                                                                    {
                                                                        if (sqlConn.State != ConnectionState.Open)
                                                                        {
                                                                            sqlConn.Open();
                                                                        }
                                                                        using (SqlCommand command = new SqlCommand(
                                                                            "INSERT INTO [Wineshipping$Package Line] VALUES(@ContainerId, @ShipmentId, @ItemId, @ExternalItemId, @UoM, @Quantity, @ProductName)", sqlConn))
                                                                        {
                                                                            command.Parameters.Add(new SqlParameter("ContainerId", entity["ContainerId"].ToString()));
                                                                            command.Parameters.Add(new SqlParameter("ShipmentId", entity["ShipmentId"].ToString()));
                                                                            command.Parameters.Add(new SqlParameter("ItemId", entity["ItemId"].ToString()));
                                                                            command.Parameters.Add(new SqlParameter("ExternalItemId", entity["ExternalItemId"].ToString()));
                                                                            command.Parameters.Add(new SqlParameter("UoM", entity["UnitId"].ToString()));
                                                                            command.Parameters.Add(new SqlParameter("Quantity", entity["Qty"].ToString()));
                                                                            command.Parameters.Add(new SqlParameter("ProductName", entity["Description"].ToString()));
                                                                            command.ExecuteNonQuery();
                                                                        }
                                                                    }
                                                                    catch (Exception ex)
                                                                    {
                                                                        Console.WriteLine(ex.ToString());
                                                                        Log.LogToDB("Error occured", LogLevels.Error, ex);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        catch (Exception ex)
                                        {
                                            Console.WriteLine(ex.ToString());
                                            Log.LogToDB("Error occured", LogLevels.Error, ex);
                                        }
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine(ex.ToString());
                                Log.LogToDB("Error occured", LogLevels.Error, ex);
                            }
                            //Console.WriteLine(wsShipmentContainer.ContainerId.ToString());
                        }
                        sqlConn.Close();
                    }
                }
            }
        }

        public static string GetQueryDateTime()
        {
            string fDateTime = string.Empty;
            try
            {
                DateTime dtTimeStamp = DateTime.Now;
                if(dtTimeStamp.Hour == 21) //9 PM
                {
                    dtTimeStamp = dtTimeStamp.AddDays(-5); //At 9 PM run get packages for last five days
                }
                else
                {
                    System.TimeSpan tSpan = new System.TimeSpan(0, 0, 180, 0); // tSpan is 0 days, 0 hours, 180 minutes and 0 second
                    dtTimeStamp = dtTimeStamp - tSpan; //Go back 180 mins 
                }
                fDateTime = dtTimeStamp.ToUniversalTime().ToString("o"); //Example: 2018-02-14T17:03:09.1440844Z  
            }
            catch
            {
                fDateTime = DateTime.UtcNow.ToString("o");
            }
            return fDateTime;
        }
    }
}
