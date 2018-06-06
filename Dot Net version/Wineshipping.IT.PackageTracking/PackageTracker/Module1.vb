Imports Microsoft.Azure.WebJobs
Imports System
Imports System.Net.Mail
Imports System.Collections
Imports System.Text
Imports System.Data
Imports System.Data.SqlClient
Imports System.Data.SqlTypes
Imports System.Xml.XPath
Imports System.Xml
Imports System.Xml.XmlDocument
Imports System.IO
Imports System.Collections.Generic
Imports System.Web.Services.Protocols
Imports PackageTracker.TrackServiceWebReference
Imports System.Net
Imports System.Linq
Imports System.Configuration

' To learn more about Microsoft Azure WebJobs SDK, please see http://go.microsoft.com/fwlink/?LinkID=320976
Module Module1
    Dim DBConn As New SqlConnection(ConfigurationManager.ConnectionStrings("PackageTrackerConnectionString").ConnectionString)
    Dim FedExPackagesDelivered As Integer = 0
    Dim FedExPackagesNotDelivered As Integer = 0
    Dim UPSPackagesDelivered As Integer = 0
    Dim UPSPackagesNotDelivered As Integer = 0
    Dim GSOPackagesDelivered As Integer = 0
    Dim GSOPackagesNotDelivered As Integer = 0
    Dim USPSPackagesDelivered As Integer = 0
    Dim USPSPackagesNotDelivered As Integer = 0
    Dim PackagesUpdated As Integer = 0
    Dim PackagesNotUpdated As Integer = 0
    Dim Count As Integer = 0
    Dim errorcount As Integer = 0
    Public origRow As Integer
    Public origCol As Integer
    Dim NoStatusCount As Integer = 0
    Dim ExceptionCount As Integer = 0
    Dim RTSCOUNTER As Integer = 0
    Dim DAMAGECOUNTER As Integer = 0
    Dim ReturnCount As Integer = 0
    Dim ds As New DataSet
    Dim tempcount As Integer = 0
    Dim startcount As Integer = 0
    Dim fedexUID As String
    Dim UIDCount As Integer = 0
    Dim RunningCompany As String
    Dim DSFedEx As New DataTable
    Dim DSUPS As New DataTable
    Dim CommandLineArgs As System.Collections.ObjectModel.ReadOnlyCollection(Of String) = My.Application.CommandLineArgs
    Dim PackageStatus As PackageStats
    Dim PackageArray As New ArrayList
    Public UniqueIDS As List(Of UniqudID)
    ' Please set the following connection strings in app.config for this WebJob to run:
    ' AzureWebJobsDashboard and AzureWebJobsStorage
    Sub Main()
        'Dim config As New JobHostConfiguration(storageConnectionString)
        'Dim host As New JobHost(config)
        ' The following code ensures that the WebJob will be running continuously  
        'Console.WriteLine("Press any key to begin")
        'Console.ReadLine()
        LoadExceptionMessages()

        WriteAt("Currently Processing WS Date: " & DateString & " and 4 months Prior.", 0, 0)
        runitWS(CommandLineArgs(0))

        'ClearStagingTable()
        DBConn.Close()
        DBConn.Dispose()
        'host.RunAndBlock()
    End Sub
    Public Sub LoadExceptionMessages()
        Try
            DBConn.Open() ' Open the connection
            If DBConn.State = ConnectionState.Open Then
                Dim FedExCommand As New SqlDataAdapter("select [Code], [PortalStatus] from [FedEx_Exception]", DBConn)
                FedExCommand.Fill(DSFedEx)
                Dim UPSCommand As New SqlDataAdapter("Select [Code], [PortalStatus] from [UPS_Exception]", DBConn)
                UPSCommand.Fill(DSUPS)
            End If
        Catch ex As Exception
            ' do nothing yet!
        Finally
            DBConn.Close()
        End Try
    End Sub
    Private Function CreateFedExTrackRequest(ByVal UID As String, ByVal trackingno As String) As TrackRequest

        Dim request As TrackRequest = New TrackRequest() 'Build a track request object
        '
        request.WebAuthenticationDetail = New WebAuthenticationDetail()
        request.WebAuthenticationDetail.UserCredential = New WebAuthenticationCredential()
        request.WebAuthenticationDetail.UserCredential.Key = "JfSbK7tkzfRBMf8G" ' Replace "XXX" with the Key
        request.WebAuthenticationDetail.UserCredential.Password = "dbc2GzV8LXPIcc7BQ4NPTMdUE" ' Replace "XXX" with the Password
        '
        request.ClientDetail = New ClientDetail()
        request.ClientDetail.AccountNumber = "510087348" ' Replace "XXX" with clients account number
        request.ClientDetail.MeterNumber = "5690072" ' Replace "XXX" with clients meter number
        request.TransactionDetail = New TransactionDetail()
        request.TransactionDetail.CustomerTransactionId = "***Track v8 Request using VB.NET***" 'The client will get the same value back in the response
        request.Version = New VersionId()
        '
        'request.PackageIdentifier = New TrackPackageIdentifier() 'Tracking information
        'request.PackageIdentifier.Value = TrackingNo.Text ' Replace "XXX" with your tracking number
        'request.TrackingNumberUniqueIdentifier = UID
        'request.PackageIdentifier.Type = TrackIdentifierType.TRACKING_NUMBER_OR_DOORTAG
        ''
        'request.IncludeDetailedScans = True
        'request.IncludeDetailedScansSpecified = True
        '
        'Tracking information
        Dim SelectionDetails(0) As TrackSelectionDetail
        SelectionDetails(0) = New TrackSelectionDetail()
        SelectionDetails(0).PackageIdentifier = New TrackPackageIdentifier
        SelectionDetails(0).PackageIdentifier.Type = TrackIdentifierType.TRACKING_NUMBER_OR_DOORTAG
        SelectionDetails(0).PackageIdentifier.Value = trackingno ' Replace "XXX" with tracking number or door tag
        SelectionDetails(0).TrackingNumberUniqueIdentifier = UID '"2456644000~797066594150~FX"

        ' Date range is optional.
        ' If omitted, set to false
        'SelectionDetails(0).ShipDateRangeBegin = DateTime.Parse("06/18/2012") ' MM/DD/YYYY
        'SelectionDetails(0).ShipDateRangeEnd = DateTime.Parse("06/18/2012") ' MM/DD/YYYY
        SelectionDetails(0).ShipDateRangeBeginSpecified = False
        SelectionDetails(0).ShipDateRangeEndSpecified = False
        request.SelectionDetails = SelectionDetails
        '
        ' Include detailed scans is optional.
        ' If omitted, set to false
        Dim ProcessingOptions(0) As TrackRequestProcessingOptionType
        ProcessingOptions(0) = New TrackRequestProcessingOptionType()
        ProcessingOptions(0) = TrackRequestProcessingOptionType.INCLUDE_DETAILED_SCANS
        request.ProcessingOptions = ProcessingOptions
        Return request
    End Function
    Sub GetFedExReply(ByRef Reply As TrackReply, ByVal TrackingNo As String)
        Try
            ' This is the call to the web service passing in a request object and returning a reply object
            If (Not Reply.CompletedTrackDetails Is Nothing) Then
                For Each CompletedTrackDetail As CompletedTrackDetail In Reply.CompletedTrackDetails
                    For Each TrackDetail As TrackDetail In CompletedTrackDetail.TrackDetails
                        'ShowNotification(TrackDetail.Notification)
                        If (TrackDetail.StatusDetail IsNot Nothing) Then
                            PackageStatus.ResponseStatus = IIf(TrackDetail.StatusDetail.Description IsNot Nothing, TrackDetail.StatusDetail.Description, "")
                            PackageStatus.CarrierStatusMessage = IIf(TrackDetail.StatusDetail.Description IsNot Nothing, TrackDetail.StatusDetail.Description, "")
                            Dim tempvarb As Date = Convert.ToDateTime(TrackDetail.Events(0).Timestamp)
                            PackageStatus.ResponseStatusDate = (tempvarb.ToString("MMM. dd, yyyy"))
                            PackageStatus.ResponseStatusTime = (tempvarb.ToString("h:mm tt"))
                        Else
                            PackageStatus.ResponseStatus = "No Status"
                        End If
                        PackageStatus.ResponseStatusCode = IIf(TrackDetail.StatusDetail.Code IsNot Nothing, TrackDetail.StatusDetail.Code, "")
                        If TrackDetail.EstimatedDeliveryTimestamp <> "1/1/0001 12:00:00 AM" Then PackageStatus.EstimatedDeliveryDate = TrackDetail.EstimatedDeliveryTimestamp

                        If UCase(PackageStatus.ResponseStatus).Contains("DELIVERED") Then
                            Dim tempvara As Date = Convert.ToDateTime(TrackDetail.ActualDeliveryTimestamp)
                            PackageStatus.ResponseStatusDate = (tempvara.ToString("MMM. dd, yyyy"))
                            PackageStatus.ResponseStatusTime = (tempvara.ToString("h:mm tt"))
                            PackageStatus.SignedForByName = TrackDetail.DeliverySignatureName
                            FedExPackagesDelivered += 1
                        Else
                            FedExPackagesNotDelivered += 1
                            For Each damageevent As TrackEvent In TrackDetail.Events
                                If Not damageevent.StatusExceptionCode Is Nothing And UCase(damageevent.EventDescription).Contains("DAMAGE") Then
                                    CheckFedExException(damageevent.StatusExceptionCode, UCase(damageevent.EventDescription))
                                    PackageStatus.DAMAGE = 1
                                    PackageStatus.DAMAGEMSG = damageevent.EventDescription
                                    DAMAGECOUNTER += 1
                                    PackageStatus.ResponseException = 1
                                    Dim tempvarb As Date = Convert.ToDateTime(damageevent.Timestamp)
                                    PackageStatus.ResponseStatusDate = (tempvarb.ToString("MMM. dd, yyyy"))
                                    PackageStatus.ResponseStatusTime = (tempvarb.ToString("h:mm tt"))
                                    Exit For
                                End If
                            Next

                            For Each exceptionevent As TrackEvent In TrackDetail.Events
                                If Not exceptionevent.StatusExceptionDescription Is Nothing Then
                                    If Not exceptionevent.StatusExceptionCode = "71" And Not UCase(exceptionevent.StatusExceptionDescription).Contains("NEXT SCHEDULED TRACKING UPDATE") Then
                                        CheckFedExException(exceptionevent.StatusExceptionCode, UCase(exceptionevent.StatusExceptionDescription))
                                        PackageStatus.CarrierStatusMessage = exceptionevent.StatusExceptionDescription
                                        PackageStatus.ResponseException = 1
                                        Dim tempvarb As Date = Convert.ToDateTime(exceptionevent.Timestamp)
                                        PackageStatus.ResponseStatusDate = (tempvarb.ToString("MMM. dd, yyyy"))
                                        PackageStatus.ResponseStatusTime = (tempvarb.ToString("h:mm tt"))
                                        Exit For
                                    End If
                                End If
                            Next

                            If (TrackDetail.OtherIdentifiers IsNot Nothing) Then
                                For Each identifier As TrackOtherIdentifierDetail In TrackDetail.OtherIdentifiers
                                    If identifier.PackageIdentifier.Type = TrackIdentifierType.RETURNED_TO_SHIPPER_TRACKING_NUMBER Then
                                        PackageStatus.RTS = 1
                                        PackageStatus.ResponseStatus = "Package returned to shipper"
                                        PackageStatus.RTSTrackingNo = identifier.PackageIdentifier.Value
                                        PackageStatus.ReturnTracking = TrackingNo
                                        PackageStatus.CarrierStatusMessage = "Package returned to shipper: " & identifier.PackageIdentifier.Value
                                        PackageStatus.ReturnStatus = "Return to shipper tracking #: " & identifier.PackageIdentifier.Value
                                        For Each TrackEvent As TrackEvent In TrackDetail.Events
                                            If TrackEvent.EventType = "RS" Then
                                                PackageStatus.ResponseStatusCode = TrackEvent.StatusExceptionCode
                                                Dim tempvarb As Date = Convert.ToDateTime(TrackEvent.Timestamp)
                                                PackageStatus.ResponseStatusDate = (tempvarb.ToString("MMM. dd, yyyy"))
                                                PackageStatus.ResponseStatusTime = (tempvarb.ToString("h:mm tt"))
                                                Exit For
                                            End If
                                        Next
                                        ReturnCount += 1
                                        PackageStatus.ResponseException = 1
                                        Exit For
                                    End If
                                Next
                            End If

                        End If

                        'If (TrackDetail.Service IsNot Nothing) Then
                        '    'ResponseBox.Text += "ServiceInfo: " & TrackDetail.Service.Description & vbCrLf
                        'End If

                        'If (TrackDetail.PackageWeight IsNot Nothing) Then
                        '    'ResponseBox.Text += "Package weight: " & TrackDetail.PackageWeight.Value & " " & TrackDetail.PackageWeight.Units & vbCrLf
                        'End If

                        'If (TrackDetail.ShipmentWeight IsNot Nothing) Then
                        '    'ResponseBox.Text += "Shipment weight: " & TrackDetail.ShipmentWeight.Value & " " & TrackDetail.ShipmentWeight.Units & vbCrLf
                        'End If

                        'If (TrackDetail.Packaging IsNot Nothing) Then
                        '    'ResponseBox.Text += "Packaging: " & TrackDetail.Packaging & vbCrLf
                        'End If

                        ''ResponseBox.Text += "Package Sequence Number: " & TrackDetail.PackageSequenceNumber & vbCrLf
                        ''ResponseBox.Text += "Package Count: " & TrackDetail.PackageCount & vbCrLf

                        'If (TrackDetail.ShipTimestampSpecified) Then
                        '    'ResponseBox.Text += "Ship timestamp: " & TrackDetail.ShipTimestamp & vbCrLf
                        'End If

                        'If (TrackDetail.DestinationAddress IsNot Nothing) Then
                        '    'ResponseBox.Text += "Destination: " & TrackDetail.DestinationAddress.City & ", " & TrackDetail.DestinationAddress.StateOrProvinceCode & vbCrLf
                        'End If

                        'If (TrackDetail.ActualDeliveryTimestampSpecified) Then
                        '    'ResponseBox.Text += "Actual delivery timestamp: " & TrackDetail.ActualDeliveryTimestamp & vbCrLf
                        'End If

                        'If (TrackDetail.AvailableImages IsNot Nothing) Then
                        '    For Each ImageType As AvailableImageType In TrackDetail.AvailableImages
                        '        'ResponseBox.Text += "Image availability: " & ImageType & vbCrLf
                        '    Next
                        'End If

                        'If (TrackDetail.NotificationEventsAvailable IsNot Nothing) Then
                        '    For Each notificationEventType As EMailNotificationEventType In TrackDetail.NotificationEventsAvailable
                        '        'ResponseBox.Text += "EmailNotificationEvent type : " & notificationEventType & vbCrLf
                        '    Next
                        'End If

                        '' Events
                        ''ResponseBox.Text += vbCrLf
                        'If (TrackDetail.Events IsNot Nothing) Then
                        '    'ResponseBox.Text += "Track Events:" & vbCrLf
                        '    For Each trackevent As TrackEvent In TrackDetail.Events
                        '        If (trackevent.TimestampSpecified) Then
                        '            'ResponseBox.Text += "Timestamp: " & trackevent.Timestamp & vbCrLf
                        '        End If
                        '        'ResponseBox.Text += "Event: " & trackevent.EventDescription & " (" & trackevent.EventType & ")" & vbCrLf
                        '        'ResponseBox.Text += "***" & vbCrLf
                        '    Next
                        '    'ResponseBox.Text += vbCrLf
                        'End If
                        ''ResponseBox.Text += "**************************************" & vbCrLf
                    Next
                Next
            Else
                For Each notification As Notification In Reply.Notifications
                    If Not PackageStatus.Retry >= 1 Then
                        PackageStatus.Retry = 1
                    Else
                        PackageStatus.ResponseStatus = "No Status"
                        PackageStatus.ResponseError = (notification.Message)
                        PackageStatus.TrackingError = TrackingNo
                        errorcount += 1
                    End If

                Next
            End If
            'ShowNotifications(Reply)
        Catch se As SoapException
            PackageStatus.ResponseStatus = "No Status"
            PackageStatus.ResponseError = (se.Detail.ToString())
            PackageStatus.TrackingError = TrackingNo
            errorcount += 1
        Catch e As Exception
            PackageStatus.ResponseStatus = "No Status"
            PackageStatus.ResponseError = (e.Message)
            PackageStatus.TrackingError = TrackingNo
            errorcount += 1
        End Try

    End Sub
    Public Sub ProcessFedex(ByVal trackingNo As String, ByVal UID As String)
        Dim AddID As New UniqudID
        Dim request As TrackRequest = CreateFedExTrackRequest("", trackingNo)
        Dim service As TrackService = New TrackService()
        UniqueIDS = New List(Of UniqudID)
        Dim CurrentUID As String = ""
        Try
            Dim reply As TrackReply = service.track(request)
            If ((Not reply.HighestSeverity = NotificationSeverityType.ERROR) And (Not reply.HighestSeverity = NotificationSeverityType.FAILURE)) Then
                If (Not reply.CompletedTrackDetails Is Nothing) Then
                    For Each CompletedTrackDetail As CompletedTrackDetail In reply.CompletedTrackDetails
                        For Each TrackDetail As TrackDetail In CompletedTrackDetail.TrackDetails
                            'If we have a UID we need to add it to the list..  If there are muiltples we need to see which has newer info!
                            AddID.FedExUID = TrackDetail.TrackingNumberUniqueIdentifier()
                            CurrentUID = TrackDetail.TrackingNumberUniqueIdentifier()
                            If (TrackDetail.ShipTimestampSpecified) Then
                                AddID.ShipTimeStamp = TrackDetail.ShipTimestamp
                            End If
                            UniqueIDS.Add(AddID)
                        Next
                    Next
                End If
            End If
            If UniqueIDS.Count > 1 Then
                Dim GetUID = (From o In UniqueIDS Order By o.ShipTimeStamp Descending Select o.FedExUID).FirstOrDefault
                request = CreateFedExTrackRequest(GetUID, trackingNo)
                reply = service.track(request)
                If ((Not reply.HighestSeverity = NotificationSeverityType.ERROR) And (Not reply.HighestSeverity = NotificationSeverityType.FAILURE)) Then
                    GetFedExReply(reply, trackingNo)
                End If
            Else
                GetFedExReply(reply, trackingNo)
            End If
        Catch ex As Exception

        End Try

    End Sub
    Public Sub ProcessGSO(ByVal trackingno As String)
        Dim gsotrackrequest As New gso.trackshipment.GetShippingActivityRequest
        gsotrackrequest.SearchType = gso.trackshipment.ShippingActivitySearchType.TRACKINGNUM
        gsotrackrequest.SearchValue = trackingno
        Dim AccountNo As String = trackingno.Substring(0, 5)
        'gsotrackrequest.AccountNumber = "50308"

        Dim userinfo As New gso.trackshipment.AuthenticationHeader

        If AccountNo = "50308" Then
            gsotrackrequest.AccountNumber = AccountNo
            userinfo.UserName = "Wineshipping"
            userinfo.Password = "WS50308"
        ElseIf AccountNo = "50874" Then
            gsotrackrequest.AccountNumber = AccountNo
            userinfo.UserName = "VintageLogistics"
            userinfo.Password = "VL50874"
        ElseIf AccountNo = "60278" Then
            gsotrackrequest.AccountNumber = AccountNo
            userinfo.UserName = "Wineshipping"
            userinfo.Password = "WS60278"
        ElseIf AccountNo = "11111" Then
            gsotrackrequest.AccountNumber = "50874"
            userinfo.UserName = "VintageLogistics"
            userinfo.Password = "VL50874"
        End If

        Dim gsoservice As New gso.trackshipment.GSOWebService
        gsoservice.AuthenticationHeaderValue = userinfo
        Try
            Dim gsoreply = gsoservice.GetShippingActivity(gsotrackrequest)

            If gsoreply.Result.Code = 0 Then
                For Each Package As PackageTracker.gso.trackshipment.ShipmentInfo In gsoreply.ShipmentInfo
                    Try
                        PackageStatus.EstimatedDeliveryDate = Package.Delivery.ScheduledDate
                    Catch ex As Exception
                        PackageStatus.EstimatedDeliveryDate = ""
                    End Try
                    If Package.Delivery.TransitStatus.ToString = "DELIVERED" Then
                        PackageStatus.SignedForByName = Package.Delivery.SignedBy.ToString
                        PackageStatus.ResponseStatus = Package.Delivery.TransitStatus.ToString
                        Dim tempvar As Date = Package.Delivery.DeliveryDate.ToString
                        PackageStatus.ResponseStatusDate = tempvar.ToString("MMM. dd, yyyy")
                        Dim tempvar2 As Date = Package.Delivery.DeliveryTime.ToString
                        PackageStatus.ResponseStatusTime = tempvar2.ToString("h:mm tt")
                        GSOPackagesDelivered += 1
                    ElseIf Package.Delivery.TransitStatus.ToString = "IN_TRANSIT" Then
                        PackageStatus.ResponseStatus = "In Transit"
                        GSOPackagesNotDelivered += 1
                    ElseIf Package.Delivery.TransitStatus.ToString = "DELAYED" Then
                        PackageStatus.ResponseStatus = "Delayed"
                        GSOPackagesNotDelivered += 1
                        For Each detail As PackageTracker.gso.trackshipment.TransitNote In Package.TransitNotes
                            PackageStatus.CarrierStatusMessage = detail.Comments
                            If UCase(detail.Comments).Contains("DEL ATTEMPTED") Then
                                PackageStatus.ExceptionStatus = Package.Delivery.TransitStatus.ToString
                                PackageStatus.ResponseException = 1
                                PackageStatus.ExceptionTracking = trackingno
                                ExceptionCount += 1
                                Exit For
                            End If
                        Next
                    Else
                        PackageStatus.ResponseStatus = Package.Delivery.TransitStatus.ToString
                        PackageStatus.ExceptionStatus = Package.Delivery.TransitStatus.ToString
                        PackageStatus.ExceptionTracking = trackingno
                        ExceptionCount += 1
                    End If
                    For Each detail As PackageTracker.gso.trackshipment.TransitNote In Package.TransitNotes
                        PackageStatus.CarrierStatusMessage = detail.Comments
                        If detail.Comments.Contains("RTS") Then PackageStatus.RTS = 1
                    Next
                Next
            ElseIf gsoreply.Result.Code > 0 Then
                'PackageStatus.ResponseStatus = gsoreply.result.message.ToString
                PackageStatus.ResponseStatus = "Shipment Data Received"
                PackageStatus.ResponseError = gsoreply.Result.Message.ToString
                PackageStatus.TrackingError = trackingno
                errorcount += 1
            End If
            If PackageStatus.RTS = trackingno Then RTSCOUNTER += 1
        Catch ex As Exception
            '
        End Try
    End Sub
    Sub runitWS(ByVal ThreadNo As Integer)
        'Dim sqlcomm As New SqlCommand("exec GetPackagesToTrack 'Wineshipping'", DBConn)
        Dim sqlcomm As New SqlCommand("SELECT * FROM PackagesToTrack WHERE ThreadNo_ = @ThreadNo AND NOT EXISTS (SELECT T2.[External Tracking No_] FROM [PackageTrackStaging] as T2 WHERE PackagesToTrack.[External Tracking No_] = T2.[External Tracking No_])", DBConn)
        sqlcomm.Parameters.AddWithValue("@ThreadNo", ThreadNo)
        Try
            DBConn.Open() ' Open the connection if it fails
            If DBConn.State = ConnectionState.Open Then
                'Messages.Text = "Database Connection is Open"
                'Query Packages Table
                Dim r As New SqlDataAdapter(sqlcomm)
                r.Fill(ds, "TrackingInfo")
            Else
                Console.WriteLine("Error - Could not open database for connection.")
            End If
        Catch exp As Exception
            Console.WriteLine(exp.Message)
            Dim tmperror As String = "Error - Could not execute GetPackagesToTrack Stored Procedure.  Error Below" & vbCrLf & vbCrLf
            tmperror += exp.Message
            WriteAt(tmperror, 0, 10)
            'EmailError(tmperror)
            WriteLog(1, tmperror, exp.StackTrace, exp.InnerException.Message, exp.Source)
        Finally
            DBConn.Close() ' close the connection
        End Try

        Dim Arraystarttime As Date = Date.Now

        If ds.Tables("TrackingInfo").Rows.Count > 0 Then
            For i As Integer = 0 To ds.Tables("TrackingInfo").Rows.Count - 1
                Dim custRow As DataRow
                custRow = ds.Tables("TrackingInfo").Rows(i)
                WriteAt("External Tracking Number - " & custRow.Item("External Tracking No_"), 0, 0)
                WriteAt("Shipping Agent Code - " & custRow.Item("Shipping Agent Code"), 0, 0)
                WriteAt("PackageNo - " & custRow.Item("PackageNo"), 0, 0)
                If custRow.Item("External Tracking No_") <> "" Then
                    Select Case custRow.Item("Shipping Agent Code")
                        'Case "FEDEX"
                        Case "FEX"
                            'Process FedEx Package
                            PackageStatus.ThreadNo = ThreadNo
                            PackageStatus.PackageNo = custRow.Item("PackageNo")
                            PackageStatus.TrackingNumber = custRow.Item("External Tracking No_")
                            ProcessFedex(PackageStatus.TrackingNumber, "")
                            If PackageStatus.Retry = 1 Then ProcessFedex(PackageStatus.TrackingNumber, "")
                            If UIDCount > 1 Then ProcessFedex(PackageStatus.TrackingNumber, fedexUID)
                            WriteAt("Tracking #: " & PackageStatus.TrackingNumber & "                                             ", 0, 2)
                            WriteAt("Status: " & PackageStatus.ResponseStatus & "                                                ", 0, 3)
                            WriteAt("Est. Delivery Date: " & PackageStatus.EstimatedDeliveryDate & "                                                ", 0, 4)
                            WriteAt("Signed By: " & PackageStatus.SignedForByName & "                                                ", 0, 5)
                            WriteAt("Date & Time: " & PackageStatus.ResponseStatusDate & " " & PackageStatus.ResponseStatusTime & "                                                ", 0, 6)
                            WriteAt("Package " & Count + 1 & " of " & ds.Tables("TrackingInfo").Rows.Count & "                                               ", 0, 7)
                            Count += 1
                            PackageArray.Add(PackageStatus)
                            UpdateDBWS(ThreadNo)
                        'Case "FEDEXCC"
                        Case "FCC"
                            'Process FedEx Package
                            PackageStatus.ThreadNo = ThreadNo
                            PackageStatus.PackageNo = custRow.Item("PackageNo")
                            PackageStatus.TrackingNumber = custRow.Item("External Tracking No_")
                            ProcessFedex(PackageStatus.TrackingNumber, "")
                            If PackageStatus.Retry = 1 Then ProcessFedex(PackageStatus.TrackingNumber, "")
                            If UIDCount > 1 Then ProcessFedex(PackageStatus.TrackingNumber, fedexUID)
                            WriteAt("Tracking #: " & PackageStatus.TrackingNumber & "                                             ", 0, 2)
                            WriteAt("Status: " & PackageStatus.ResponseStatus & "                                                ", 0, 3)
                            WriteAt("Est. Delivery Date: " & PackageStatus.EstimatedDeliveryDate & "                                                ", 0, 4)
                            WriteAt("Signed By: " & PackageStatus.SignedForByName & "                                                ", 0, 5)
                            WriteAt("Date & Time: " & PackageStatus.ResponseStatusDate & " " & PackageStatus.ResponseStatusTime & "                                                ", 0, 6)
                            WriteAt("Package " & Count + 1 & " of " & ds.Tables("TrackingInfo").Rows.Count & "                                               ", 0, 7)
                            Count += 1
                            PackageArray.Add(PackageStatus)
                            UpdateDBWS(ThreadNo)
                        Case "UPS", "TMC"
                            'Process UPS Package
                            PackageStatus.ThreadNo = ThreadNo
                            PackageStatus.PackageNo = custRow.Item("PackageNo")
                            PackageStatus.TrackingNumber = custRow.Item("External Tracking No_")
                            ProcessUps(PackageStatus.TrackingNumber)
                            WriteAt("Tracking #: " & PackageStatus.TrackingNumber & "                                               ", 0, 2)
                            WriteAt("Status: " & PackageStatus.ResponseStatus & "                                               ", 0, 3)
                            WriteAt("Est. Delivery Date: " & PackageStatus.EstimatedDeliveryDate & "                                                ", 0, 4)
                            WriteAt("Signed By: " & PackageStatus.SignedForByName & "                                                ", 0, 5)
                            WriteAt("Date & Time: " & PackageStatus.ResponseStatusDate & " " & PackageStatus.ResponseStatusTime & "                                                ", 0, 6)
                            WriteAt("Package " & Count + 1 & " of " & ds.Tables("TrackingInfo").Rows.Count & "                                               ", 0, 7)
                            Count += 1
                            PackageArray.Add(PackageStatus)
                            UpdateDBWS(ThreadNo)
                        Case "GSO"
                            'Process GSO Package
                            PackageStatus.ThreadNo = ThreadNo
                            PackageStatus.PackageNo = custRow.Item("PackageNo")
                            PackageStatus.TrackingNumber = custRow.Item("External Tracking No_")
                            ProcessGSO(PackageStatus.TrackingNumber)
                            WriteAt("Tracking #: " & PackageStatus.TrackingNumber & "                                             ", 0, 2)
                            WriteAt("Status: " & PackageStatus.ResponseStatus & "                                                ", 0, 3)
                            WriteAt("Est. Delivery Date: " & PackageStatus.EstimatedDeliveryDate & "                                                ", 0, 4)
                            WriteAt("Signed By: " & PackageStatus.SignedForByName & "                                                ", 0, 5)
                            WriteAt("Date & Time: " & PackageStatus.ResponseStatusDate & " " & PackageStatus.ResponseStatusTime & "                                                ", 0, 6)
                            WriteAt("Package " & Count + 1 & " of " & ds.Tables("TrackingInfo").Rows.Count & "                                               ", 0, 7)
                            Count += 1
                            PackageArray.Add(PackageStatus)
                            UpdateDBWS(ThreadNo)
                        ' Case "USMAIL"
                        Case "TPS"
                            'Process USPS Package
                            PackageStatus.ThreadNo = ThreadNo
                            PackageStatus.PackageNo = custRow.Item("PackageNo")
                            PackageStatus.TrackingNumber = custRow.Item("External Tracking No_")
                            ProcessUSPS(PackageStatus.TrackingNumber)
                            WriteAt("Tracking #: " & PackageStatus.TrackingNumber & "                                             ", 0, 2)
                            WriteAt("Status: " & PackageStatus.ResponseStatus & "                                                ", 0, 3)
                            WriteAt("Est. Delivery Date: " & PackageStatus.EstimatedDeliveryDate & "                                                ", 0, 4)
                            WriteAt("Signed By: " & PackageStatus.SignedForByName & "                                                ", 0, 5)
                            WriteAt("Date & Time: " & PackageStatus.ResponseStatusDate & " " & PackageStatus.ResponseStatusTime & "                                                ", 0, 6)
                            WriteAt("Package " & Count + 1 & " of " & ds.Tables("TrackingInfo").Rows.Count & "                                               ", 0, 7)
                            Count += 1
                            PackageArray.Add(PackageStatus)
                            UpdateDBWS(ThreadNo)
                        Case Else
                            Count += 1
                    End Select
                    'UpdateDBWS(ThreadNo)
                    ClearPackageStatus()
                End If
                tempcount += 1
                WriteAt("Tempcount: " & tempcount & "                                ", 0, 8)
                WriteAt("Startcount: " & startcount & "                                ", 0, 9)

            Next
            Dim Arraystoptime As Date = Date.Now
            Dim DBStartTime As Date = Date.Now

            FinalDBUpdate(ThreadNo)
            'ClearStagingTable(ThreadNo)

            DBConn.Close()
            DBConn.Dispose()

            Dim DBStopTime As Date = Date.Now

            ' Send Email 
            Dim eMail As New MailMessage()
            eMail.[To].Add(New MailAddress("sandip@wineshipping.com"))
            'eMail.[To].Add(New MailAddress("IT-Help@wineshipping.com"))
            eMail.From = New MailAddress("WSIIS01@wineshipping.com")
            eMail.Subject = "Package Activity Update for " & DateString & " and 4 Months Prior."

            If ReturnCount > 0 Then
                eMail.Body += vbLf
                eMail.Body += ReturnCount & " FedEx Packages are being returned" & vbLf
                eMail.Body += vbLf
                For Each package As PackageStats In PackageArray
                    If package.RTS = 1 Then
                        eMail.Body += package.ReturnTracking & "  -  " & package.ReturnStatus & " " & vbLf
                    End If
                Next
                'For a As Integer = 0 To ReturnCount - 1
                'eMail.Body += ReturnTracking(a) & "  -  " & ReturnStatus(a) & " " & vbLf
                'Next
            End If

            If errorcount > 0 Then
                eMail.Body += vbLf
                eMail.Body += errorcount & " Errors where detected.  Below are the errors" & vbLf
                eMail.Body += vbLf
                For Each package As PackageStats In PackageArray
                    If package.TrackingError <> "" Then
                        eMail.Body += package.TrackingError & "  -  " & package.ResponseError & " " & vbLf
                    End If
                Next
                'For a As Integer = 0 To errorcount - 1
                ' eMail.Body += TrackingError(a) & "  -  " & ResponseError(a) & " " & vbLf
                'Next
            End If

            If NoStatusCount > 0 Then
                eMail.Body += vbLf
                eMail.Body += NoStatusCount & " No Status packages where Detected.  Below are the packages" & vbLf
                eMail.Body += vbLf
                For Each package As PackageStats In PackageArray
                    If package.NoResponseTracking <> "" Then
                        eMail.Body += package.NoResponseTracking & "  -  " & package.NoResponseStatus & " " & vbLf
                    End If
                Next
                'For b As Integer = 0 To NoStatusCount - 1
                'eMail.Body += NoResponseTracking(b) & "  -  " & NoResponseStatus(b) & " " & vbLf
                'Next
            End If

            If ExceptionCount > 0 Then
                eMail.Body += vbLf
                eMail.Body += ExceptionCount & " Exception packages where Detected.  Below are the packages" & vbCrLf
                eMail.Body += vbLf
                For Each package As PackageStats In PackageArray
                    If package.ExceptionTracking <> "" Then
                        eMail.Body += package.ExceptionTracking & "  -  " & package.ExceptionStatus & " " & vbLf
                    End If
                Next
                'For c As Integer = 0 To ExceptionCount - 1
                'eMail.Body += ExceptionTracking(c) & "  -  " & ExceptionStatus(c) & " " & vbLf
                'Next
            End If

            eMail.Body += vbLf & "Package Tracking Activity update counts:" & vbLf & vbLf
            eMail.Body += "Total Items in Table: " & ds.Tables("TrackingInfo").Rows.Count & vbLf
            eMail.Body += "FedEx Packages Delivered: " & FedExPackagesDelivered & vbLf
            eMail.Body += "FedEx Packages Not Delivered: " & FedExPackagesNotDelivered & vbLf
            eMail.Body += "UPS Packages Delivered: " & UPSPackagesDelivered & vbLf
            eMail.Body += "UPS Packages Not Delivered: " & UPSPackagesNotDelivered & vbLf
            eMail.Body += "GSO Packages Delivered: " & GSOPackagesDelivered & vbLf
            eMail.Body += "GSO Packages Not Delivered: " & GSOPackagesNotDelivered & vbLf
            eMail.Body += "USPS Packages Delivered: " & USPSPackagesDelivered & vbLf
            eMail.Body += "USPS Packages Not Delivered: " & USPSPackagesNotDelivered & vbLf
            eMail.Body += "Package Exceptions: " & ExceptionCount & vbLf
            eMail.Body += "No Status Packages: " & NoStatusCount & vbLf
            eMail.Body += "Errors: " & errorcount & vbLf
            eMail.Body += "Total Packages Inserted into Staging Table: " & PackagesUpdated & vbLf
            'eMail.Body += "Total Packages Updated: " & TotalPackagesUpdated & vbLf
            'eMail.Body += "Total Packages NOT Update in DB: " & PackagesUpdated - TotalPackagesUpdated & " (This is because status has not changed)" & vbLf
            eMail.Body += "Total FedEx Packages Returned: " & ReturnCount & vbLf
            eMail.Body += "Start Time to build array: " & Arraystarttime & vbLf
            eMail.Body += vbLf
            eMail.Body += "End Time to build array: " & Arraystoptime
            'eMail.Body += vbLf
            'eMail.Body += "Start Time to UpdateDB: " & DBStartTime
            'eMail.Body += vbLf
            'eMail.Body += "End Time to UpdateDB: " & DBStopTime
            'eMail.Body += vbLf

            WriteAt(eMail.Body, 0, 10)
            Dim client As New SmtpClient("10.10.1.40")
            'client.Send(eMail)

            FedExPackagesDelivered = 0
            FedExPackagesNotDelivered = 0
            UPSPackagesDelivered = 0
            UPSPackagesNotDelivered = 0
            GSOPackagesDelivered = 0
            GSOPackagesNotDelivered = 0
            USPSPackagesDelivered = 0
            USPSPackagesNotDelivered = 0
            ExceptionCount = 0
            NoStatusCount = 0
            errorcount = 0
            PackagesUpdated = 0
            PackagesNotUpdated = 0
            Count = 0
            ReturnCount = 0
            startcount = 0
            tempcount = 0
            RTSCOUNTER = 0
            DAMAGECOUNTER = 0
            ds.Clear()

            WriteAt("Database Update Completed!", 0, 8)
        End If
    End Sub
    Public Sub ProcessUps(ByVal trackingNo As String)
        Dim strBuild As New StringBuilder()
        Dim accessLicenseNumber As String = "FC312F9BE62AFF90"
        Dim upsUserId As String = "UPSwineshipping"
        Dim upsUserPass As String = "easyship"
        Dim xpciVersion As String = "1.0001"
        Dim requestOption As String = "1"

        strBuild.Append("<?xml version=""1.0""?>")
        strBuild.Append("<AccessRequest xml:lang=""en-US"">")
        strBuild.Append("<AccessLicenseNumber>" + accessLicenseNumber + "</AccessLicenseNumber>")
        strBuild.Append("<UserId>" + upsUserId + "</UserId>")
        strBuild.Append("<Password>" + upsUserPass + "</Password>")
        strBuild.Append("</AccessRequest>")

        strBuild.Append("<?xml version=""1.0""?>")
        strBuild.Append("<TrackRequest xml:lang=""en-US"">")
        strBuild.Append("<Request>")
        strBuild.Append("<TransactionReference>")
        strBuild.Append("<XpciVersion>" + xpciVersion + "</XpciVersion>")
        strBuild.Append("</TransactionReference>")
        strBuild.Append("<RequestAction>Track</RequestAction>")
        strBuild.Append("<RequestOption>" + requestOption + "</RequestOption>")
        strBuild.Append("</Request>")
        If trackingNo <> String.Empty Then
            strBuild.Append("<TrackingNumber>" + trackingNo + "</TrackingNumber>")
        End If
        strBuild.Append("</TrackRequest>")

        Dim UPSresponse As String
        Dim m_xmld As XmlDocument
        Dim m_nodelist As XmlNodeList
        Dim package As XmlNode
        Dim packageb As XmlNode
        Dim UPSURL = "https://onlinetools.ups.com/ups.app/xml/Track"
        Dim oHttp = CreateObject("MSXML2.ServerXMLHttp")
        oHttp.SetTimeouts(20000, 20000, 20000, 20000)
        oHttp.open("POST", UPSURL, False)
        oHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
        Try
            oHttp.send(strBuild.ToString)
        Catch exp As Exception
            PackageStatus.ResponseError = (exp.Message)
            PackageStatus.TrackingError = trackingNo
            errorcount += 1
            Exit Sub
        End Try

        Try
            UPSresponse = oHttp.responseText.ToString.Replace("&lt;", "<")
            'Return UPSresponse.ToString

            'Create the XML Document
            m_xmld = New XmlDocument()
            'Load the Xml file
            m_xmld.LoadXml(oHttp.responseText.Replace("&lt;", "<"))
            'Get the list of name nodes
        Catch exp As Exception
            PackageStatus.ResponseError = (exp.Message)
            PackageStatus.TrackingError = trackingNo
            errorcount += 1
            Exit Sub
        End Try
        m_nodelist = m_xmld.SelectNodes("TrackResponse/Shipment/Package/Activity")

        'Check for Damaged Packages
        Try
            For Each packagecheck As XmlNode In m_nodelist
                If Not packagecheck.SelectSingleNode("Status/StatusType/Description").InnerText Is Nothing And packagecheck.SelectSingleNode("Status/StatusType/Description").InnerText.Contains("DAMAGE") Then
                    PackageStatus.DAMAGE = 1
                    PackageStatus.DAMAGEMSG = packagecheck.SelectSingleNode("Status/StatusType/Description").InnerText
                    DAMAGECOUNTER += 1
                    PackageStatus.ResponseException = 1
                    Exit For
                End If
            Next
        Catch ex As Exception
            '
        End Try

        'Check for RTS's Packages
        Try
            For Each rtscheck As XmlNode In m_nodelist
                If Not rtscheck.SelectSingleNode("Status/StatusType/Description").InnerText Is Nothing And rtscheck.SelectSingleNode("Status/StatusType/Description").InnerText.Contains("RETURNED TO") Then
                    PackageStatus.RTS = 1
                    RTSCOUNTER += 1
                    PackageStatus.ResponseStatus = "Package Returned to shipper"
                    PackageStatus.ResponseException = 1
                    Exit For
                End If
            Next
        Catch ex As Exception
            '
        End Try

        'Loop through the nodes

        Try
            Dim pkgcount As Integer = 0
            For Each package In m_nodelist
                pkgcount += 1
                UPSresponse = package.SelectSingleNode("Status/StatusType/Code").InnerText
                If Not package.ParentNode.ParentNode.SelectSingleNode("ScheduledDeliveryDate") Is Nothing Then PackageStatus.EstimatedDeliveryDate = Date.ParseExact(package.ParentNode.ParentNode.SelectSingleNode("ScheduledDeliveryDate").InnerText, "yyyyMMdd", System.Globalization.DateTimeFormatInfo.InvariantInfo)
                If Not package.ParentNode.SelectSingleNode("RescheduledDeliveryDate") Is Nothing Then PackageStatus.EstimatedDeliveryDate = Date.ParseExact(package.ParentNode.SelectSingleNode("RescheduledDeliveryDate").InnerText, "yyyyMMdd", System.Globalization.DateTimeFormatInfo.InvariantInfo)
                Select Case UPSresponse
                    Case "D"
                        PackageStatus.ResponseStatus = "Delivered"
                        PackageStatus.ResponseStatusCode = UCase(package.SelectSingleNode("Status/StatusType/Code").InnerText)
                        Dim Tempvar As Date = Date.ParseExact(package.SelectSingleNode("Date").InnerText, "yyyyMMdd", System.Globalization.DateTimeFormatInfo.InvariantInfo)
                        PackageStatus.ResponseStatusDate = (Tempvar.ToString("MMM. dd, yyyy"))
                        Dim tempvar2 As Date = Date.ParseExact(package.SelectSingleNode("Time").InnerText, "HHmmss", System.Globalization.DateTimeFormatInfo.InvariantInfo)
                        PackageStatus.ResponseStatusTime = (tempvar2.ToString("h:mm tt"))
                        If Not package.SelectSingleNode("ActivityLocation/SignedForByName") Is Nothing Then PackageStatus.SignedForByName = package.SelectSingleNode("ActivityLocation/SignedForByName").InnerText
                        Exit For
                    Case "I"
                        'If Not package.SelectSingleNode("Status/StatusCode/Code") Is Nothing Then CheckUPSException(UCase(package.SelectSingleNode("Status/StatusCode/Code").InnerText), UCase(package.SelectSingleNode("Status/StatusType/Description").InnerText))
                        PackageStatus.ResponseStatus = "In Transit"
                        PackageStatus.ResponseStatusCode = UCase(package.SelectSingleNode("Status/StatusType/Code").InnerText)
                        Dim Tempvar As Date = Date.ParseExact(package.SelectSingleNode("Date").InnerText, "yyyyMMdd", System.Globalization.DateTimeFormatInfo.InvariantInfo)
                        PackageStatus.ResponseStatusDate = (Tempvar.ToString("MMM. dd, yyyy"))
                        Dim tempvar2 As Date = Date.ParseExact(package.SelectSingleNode("Time").InnerText, "HHmmss", System.Globalization.DateTimeFormatInfo.InvariantInfo)
                        PackageStatus.ResponseStatusTime = (tempvar2.ToString("h:mm tt"))
                        Exit For
                    Case "X"
                        PackageStatus.ResponseException = 1
                        'For Each packaged In m_nodelist
                        If Not package.SelectSingleNode("Status/StatusCode/Code") Is Nothing Then CheckUPSException(UCase(package.SelectSingleNode("Status/StatusCode/Code").InnerText), UCase(package.SelectSingleNode("Status/StatusType/Description").InnerText))
                        'Next
                        For Each packageb In m_nodelist
                            If UCase(packageb.SelectSingleNode("Status/StatusType/Code").InnerText) = "D" Then
                                PackageStatus.ResponseStatus = "Delivered"
                                PackageStatus.ResponseStatusCode = "D"
                                Dim Tempvara As Date = Date.ParseExact(package.SelectSingleNode("Date").InnerText, "yyyyMMdd", System.Globalization.DateTimeFormatInfo.InvariantInfo)
                                PackageStatus.ResponseStatusDate = (Tempvara.ToString("MMM. dd, yyyy"))
                                Dim tempvarb As Date = Date.ParseExact(package.SelectSingleNode("Time").InnerText, "HHmmss", System.Globalization.DateTimeFormatInfo.InvariantInfo)
                                PackageStatus.ResponseStatusTime = (tempvarb.ToString("h:mm tt"))
                                If Not packageb.SelectSingleNode("ActivityLocation/SignedForByName") Is Nothing Then PackageStatus.SignedForByName = packageb.SelectSingleNode("ActivityLocation/SignedForByName").InnerText
                                Exit For
                            End If
                        Next
                        If PackageStatus.ResponseStatus = "Delivered" Then
                            Exit For
                        Else
                            If Not package.SelectSingleNode("Status/StatusCode/Code") Is Nothing Then CheckUPSException(UCase(package.SelectSingleNode("Status/StatusCode/Code").InnerText), UCase(package.SelectSingleNode("Status/StatusType/Description").InnerText))
                            If Not package.SelectSingleNode("Status/StatusCode/Code") Is Nothing Then PackageStatus.CarrierStatusMessage = (package.SelectSingleNode("Status/StatusType/Description").InnerText)
                            PackageStatus.ResponseStatus = CheckExceptionStatusCode("UPS", UCase(package.SelectSingleNode("Status/StatusCode/Code").InnerText))
                            PackageStatus.ResponseStatusCode = UCase(package.SelectSingleNode("Status/StatusCode/Code").InnerText)
                            Dim Tempvar As Date = Date.ParseExact(package.SelectSingleNode("Date").InnerText, "yyyyMMdd", System.Globalization.DateTimeFormatInfo.InvariantInfo)
                            PackageStatus.ResponseStatusDate = (Tempvar.ToString("MMM. dd, yyyy"))
                            Dim tempvar2 As Date = Date.ParseExact(package.SelectSingleNode("Time").InnerText, "HHmmss", System.Globalization.DateTimeFormatInfo.InvariantInfo)
                            PackageStatus.ResponseStatusTime = (tempvar2.ToString("h:mm tt"))
                            PackageStatus.ExceptionStatus = package.SelectSingleNode("Status/StatusType/Description").InnerText
                            PackageStatus.ExceptionTracking = trackingNo
                            ExceptionCount += 1
                            Exit For
                        End If
                    Case Else
                        If pkgcount = 1 Then
                            PackageStatus.ResponseStatus = "No Status"
                            If Not package.SelectSingleNode("Status/StatusCode/Code") Is Nothing Then CheckUPSException(UCase(package.SelectSingleNode("Status/StatusCode/Code").InnerText), UCase(package.SelectSingleNode("Status/StatusType/Description").InnerText))
                            If Not package.SelectSingleNode("Status/StatusCode/Code") Is Nothing Then PackageStatus.CarrierStatusMessage = (package.SelectSingleNode("Status/StatusType/Description").InnerText)
                            PackageStatus.ResponseStatusCode = UCase(package.SelectSingleNode("Status/StatusCode/Code").InnerText)
                            PackageStatus.NoResponseStatus = package.SelectSingleNode("Status/StatusType/Description").InnerText
                            PackageStatus.NoResponseTracking = trackingNo
                            NoStatusCount += 1
                            Exit For
                        End If
                End Select
            Next

            For Each ExceptionPackage As XmlNode In m_nodelist
                Dim tempresponse As String = ""
                If Not ExceptionPackage.SelectSingleNode("Status/StatusType/Code") Is Nothing Then tempresponse = ExceptionPackage.SelectSingleNode("Status/StatusType/Code").InnerText
                If tempresponse = "X" Then
                    PackageStatus.ResponseException = 1
                    PackageStatus.CarrierStatusMessage = ExceptionPackage.SelectSingleNode("Status/StatusType/Description").InnerText
                    Exit For
                End If
            Next

            If PackageStatus.ResponseStatus = "Delivered" Then
                UPSPackagesDelivered += 1
            ElseIf PackageStatus.ResponseStatus = "In Transit" Then
                UPSPackagesNotDelivered += 1
            End If
            If PackageStatus.ResponseStatus = "" Or Nothing Then
                PackageStatus.ResponseStatus = "No Status"
                PackageStatus.NoResponseStatus = "No Status"
                PackageStatus.NoResponseTracking = trackingNo
                NoStatusCount += 1
            End If
        Catch exp As Exception
            PackageStatus.ResponseStatus = "No Status"
            PackageStatus.ResponseError = (exp.Message)
            PackageStatus.TrackingError = trackingNo
            errorcount += 1
            Exit Sub
        End Try
    End Sub
    Public Function CheckExceptionStatusCode(ByVal Carrier, ByVal CodeToVerify)
        If Carrier = "UPS" Then
            For Each result As DataRow In DSUPS.Rows
                If UCase(result("Code").ToString) = UCase(CodeToVerify) Then Return result("PortalStatus").ToString
            Next
        ElseIf Carrier = "FEDEX" Then
            For Each result As DataRow In DSFedEx.Rows
                If UCase(result("Code").ToString) = UCase(CodeToVerify) Then Return result("PortalStatus").ToString
            Next
        End If
        Return "View Details"
    End Function
    Function CheckUPSException(ByVal Code As String, ByVal Description As String)
        For Each result As DataRow In DSUPS.Rows
            If UCase(result("Code").ToString) = UCase(Code) Then Return True
        Next
        Dim RUN As New Data.SqlClient.SqlCommand("", DBConn)
        Dim rc As Integer = 0
        If Not DBConn.State = ConnectionState.Open Then
            DBConn.Open()
        End If
        RUN.CommandText = "INSERT [UPS_Exception] (Code, Description, InsertDate)" & vbLf
        RUN.CommandText += "Values (@Code, @Description, @InsertDate)" & vbLf
        RUN.Parameters.AddWithValue("@Code", Code)
        RUN.Parameters.AddWithValue("@Description", Description)
        RUN.Parameters.AddWithValue("@InsertDate", Date.Now)
        Try
            rc = RUN.ExecuteNonQuery()
        Catch exp As Exception
            'we should do soemthing here..
        End Try
        DBConn.Close()
        LoadExceptionMessages()
        Return True
    End Function
    Function CheckFedExException(ByVal Code As String, ByVal Description As String)
        For Each result As DataRow In DSFedEx.Rows
            If UCase(result("Code").ToString) = UCase(Code) Then Return True
        Next
        Dim RUN As New Data.SqlClient.SqlCommand("", DBConn)
        Dim rc As Integer = 0
        If Not DBConn.State = ConnectionState.Open Then
            DBConn.Open()
        End If
        RUN.CommandText = "INSERT [FedEx_Exception] (Code, Description, InsertDate)" & vbLf
        RUN.CommandText += "Values (@Code, @Description, @InsertDate)" & vbLf
        RUN.Parameters.AddWithValue("@Code", Code)
        RUN.Parameters.AddWithValue("@Description", Description)
        RUN.Parameters.AddWithValue("@InsertDate", Date.Now)
        Try
            rc = RUN.ExecuteNonQuery()
        Catch exp As Exception
            'we should do soemthing here..
        End Try
        DBConn.Close()
        LoadExceptionMessages()
        Return True
    End Function
    Public Sub UpdateDBWS(ByVal ThreadNo As Integer)
        Dim RUN As Data.SqlClient.SqlCommand
        Dim rc As Integer
        WriteAt("Updating DataBase", 0, 9)
        Dim insert As String = "INSERT INTO [PackageTrackStaging]" & vbCrLf
        insert += "           ([External Tracking No_]" & vbCrLf
        insert += "           ,[ThreadNo]" & vbCrLf
        insert += "           ,[Company]" & vbCrLf
        insert += "           ,[Status]" & vbCrLf
        insert += "           ,[Status_Date]" & vbCrLf
        insert += "           ,[Status_Time]" & vbCrLf
        insert += "           ,[SignedForByName]" & vbCrLf
        insert += "           ,[EstimatedDeliveryDate]" & vbCrLf
        insert += "           ,[CarrierStatusCode]" & vbCrLf
        insert += "           ,[CarrierStatusMessage]" & vbCrLf
        If PackageStatus.RTS = 1 Then insert += "           ,[RTS]" & vbCrLf
        If PackageStatus.RTS = 1 Then insert += "           ,[RTSTrackingNo]" & vbCrLf
        If PackageStatus.DAMAGE = 1 Then insert += "           ,[DAMAGE]" & vbCrLf
        If PackageStatus.DAMAGE = 1 Then insert += "           ,[DAMAGEMSG]" & vbCrLf
        insert += "           ,[StatusUpdated]" & vbCrLf
        insert += "           ,[PackageNo]" & vbCrLf
        If PackageStatus.ResponseException = 1 Then insert += "           ,[ExceptionStatus]" & vbCrLf
        insert += "                           )" & vbCrLf
        insert += "VALUES(" & vbCrLf
        insert += "           @TrackingNumber" & vbCrLf
        insert += "           ,@ThreadNo" & vbCrLf
        insert += "           ,'WS'" & vbCrLf
        insert += "           ,@Status" & vbCrLf
        insert += "           ,@StatusDate" & vbCrLf
        insert += "           ,@StatusTime" & vbCrLf
        insert += "           ,@SignedForByName" & vbCrLf
        insert += "           ,@EstimatedDeliveryDate" & vbCrLf
        insert += "           ,@CarrierStatusCode" & vbCrLf
        insert += "           ,@CarrierStatusMessage" & vbCrLf
        If PackageStatus.RTS = 1 Then insert += "           ,@RTS" & vbCrLf
        If PackageStatus.RTS = 1 Then insert += "           ,@RTSTrackingNo" & vbCrLf
        If PackageStatus.DAMAGE = 1 Then insert += "           ,@DAMAGE" & vbCrLf
        If PackageStatus.DAMAGE = 1 Then insert += "           ,@DAMAGEMSG" & vbCrLf
        insert += "           ,@StatusUpdated" & vbCrLf
        insert += "           ,@PackageNo" & vbCrLf
        If PackageStatus.ResponseException = 1 Then insert += "           ,@ExceptionStatus" & vbCrLf
        insert += "                           )" & vbCrLf
        RUN = New Data.SqlClient.SqlCommand(insert, DBConn)

        If PackageStatus.ResponseStatus <> "" Then RUN.Parameters.AddWithValue("@Status", StrConv(PackageStatus.ResponseStatus, vbProperCase)) Else RUN.Parameters.AddWithValue("@Status", "")
        If PackageStatus.ResponseStatusDate <> "" Then RUN.Parameters.AddWithValue("@StatusDate", PackageStatus.ResponseStatusDate) Else RUN.Parameters.AddWithValue("@StatusDate", "")
        If PackageStatus.ResponseStatusTime <> "" Then RUN.Parameters.AddWithValue("@StatusTime", PackageStatus.ResponseStatusTime) Else RUN.Parameters.AddWithValue("@StatusTime", "")
        If PackageStatus.SignedForByName <> "" Then RUN.Parameters.AddWithValue("@SignedForByName", PackageStatus.SignedForByName) Else RUN.Parameters.AddWithValue("@SignedForByName", "")
        If PackageStatus.ResponseStatusCode <> "" Then RUN.Parameters.AddWithValue("@CarrierStatusCode", PackageStatus.ResponseStatusCode) Else RUN.Parameters.AddWithValue("@CarrierStatusCode", "")
        If Not PackageStatus.EstimatedDeliveryDate = "1/1/0001 12:00:00 AM" Then RUN.Parameters.AddWithValue("@EstimatedDeliveryDate", PackageStatus.EstimatedDeliveryDate) Else RUN.Parameters.AddWithValue("@EstimatedDeliveryDate", "")
        If PackageStatus.CarrierStatusMessage <> "" Then RUN.Parameters.AddWithValue("@CarrierStatusMessage", PackageStatus.CarrierStatusMessage) Else RUN.Parameters.AddWithValue("@CarrierStatusMessage", "")
        If PackageStatus.ResponseException = 1 Then RUN.Parameters.AddWithValue("@ExceptionStatus", PackageStatus.ResponseException)
        If PackageStatus.RTS = 1 Then RUN.Parameters.AddWithValue("@RTS", 1)
        If PackageStatus.RTS = 1 Then If PackageStatus.RTSTrackingNo <> "" Then RUN.Parameters.AddWithValue("RTSTrackingNo", PackageStatus.RTSTrackingNo) Else RUN.Parameters.AddWithValue("RTSTrackingNo", "")
        If PackageStatus.DAMAGE = 1 Then RUN.Parameters.AddWithValue("@DAMAGE", 1)
        If PackageStatus.DAMAGE = 1 Then If PackageStatus.DAMAGEMSG <> "" Then RUN.Parameters.AddWithValue("@DAMAGEMSG", PackageStatus.DAMAGEMSG) Else RUN.Parameters.AddWithValue("@DAMAGEMSG", "")
        RUN.Parameters.AddWithValue("@StatusUpdated", Date.Now)
        RUN.Parameters.AddWithValue("@TrackingNumber", PackageStatus.TrackingNumber)
        RUN.Parameters.AddWithValue("@PackageNo", PackageStatus.PackageNo)
        RUN.Parameters.AddWithValue("@ThreadNo", ThreadNo)

        Try
            If Not DBConn.State = ConnectionState.Open Then DBConn.Open()
            rc = RUN.ExecuteNonQuery()
            If rc > 0 Then
                PackagesUpdated += 1
                WriteAt("Package " & PackagesUpdated & " of " & Count & " Inserted into Staging Table!", 0, 10)
                RUN.Parameters.Clear()
            End If
        Catch ex As Exception
            Dim tmperror As String = "Error Could not execute UpdateDBWS.  Error Below" & vbCrLf & vbCrLf
            tmperror += ex.Message & vbCrLf & vbCrLf
            tmperror += "List of Parameters and the Values:" & vbCrLf & vbCrLf
            For Each parameter As SqlParameter In RUN.Parameters
                tmperror += parameter.ToString & ": " & parameter.Value & vbCrLf
            Next
            WriteAt(tmperror, 0, 10)
            'EmailError(tmperror)
            WriteLog(1, tmperror, ex.StackTrace, ex.InnerException.Message, ex.Source)
            RUN.Parameters.Clear()
        End Try
        'DBConn.Close()
    End Sub
    Public Sub ClearPackageStatus()
        PackageStatus.TrackingNumber = ""
        PackageStatus.ResponseStatus = ""
        PackageStatus.ResponseStatusCode = ""
        PackageStatus.ResponseStatusDate = ""
        PackageStatus.ResponseStatusTime = ""
        PackageStatus.ResponseError = ""
        PackageStatus.ResponseException = 0
        PackageStatus.TrackingError = ""
        PackageStatus.NoResponseStatus = ""
        PackageStatus.NoResponseTracking = ""
        PackageStatus.ExceptionStatus = ""
        PackageStatus.ExceptionTracking = ""
        PackageStatus.ReturnStatus = ""
        PackageStatus.ReturnTracking = ""
        PackageStatus.SignedForByName = ""
        PackageStatus.EstimatedDeliveryDate = "1/1/0001 12:00:00 AM"
        PackageStatus.CarrierStatusMessage = ""
        PackageStatus.RTS = 0
        PackageStatus.DAMAGE = 0
        PackageStatus.DAMAGEMSG = ""
        PackageStatus.RTSTrackingNo = ""
        PackageStatus.Retry = 0
    End Sub
    Public Sub ProcessUSPS(ByVal trackingno As String)
        Dim wsClient As New WebClient()
        'Dim USPSURL As String = "http://testing.shippingapis.com/ShippingAPITest.dll"
        Dim USPSURL As String = "http://production.shippingapis.com/ShippingAPI.dll"
        Dim USPSUserName As String = "487WINES7756"
        Dim Request As String = USPSURL + "?API=TrackV2&XML=<TrackFieldRequest USERID=""" & USPSUserName & """>"
        Request += "<TrackID ID=""" & trackingno & """>"
        Request += "</TrackID>"
        Request += "</TrackFieldRequest>"
        Dim ResponseData() As Byte = wsClient.DownloadData(Request)
        Dim StrResponse As String = ""
        For Each oItem As Byte In ResponseData
            StrResponse += Chr(oItem)
        Next
        Dim m_xmld As XmlDocument
        Dim m_nodelist As XmlNodeList
        m_xmld = New XmlDocument()
        m_xmld.LoadXml(StrResponse)
        m_nodelist = m_xmld.SelectNodes("TrackResponse/TrackInfo/TrackSummary")
        Try
            For Each PackageSummary As XmlNode In m_nodelist
                If Not PackageSummary.SelectSingleNode("Event").InnerText Is Nothing Then
                    If UCase(PackageSummary.SelectSingleNode("Event").InnerText) = "DELIVERED" Then USPSPackagesDelivered += 1 Else USPSPackagesNotDelivered += 1
                    PackageStatus.ResponseStatus = PackageSummary.SelectSingleNode("Event").InnerText
                    PackageStatus.ResponseStatusDate = PackageSummary.SelectSingleNode("EventDate").InnerText
                    PackageStatus.ResponseStatusTime = PackageSummary.SelectSingleNode("EventTime").InnerText
                    'ResponseBox.Text += "*********************** Tracking Summary ***********************" & vbCrLf & vbCrLf
                    'ResponseBox.Text += "Time         : " & PackageSummary.SelectSingleNode("EventTime").InnerText & vbCrLf
                    'ResponseBox.Text += "Date         : " & PackageSummary.SelectSingleNode("EventDate").InnerText & vbCrLf
                    'ResponseBox.Text += "Event        : " & PackageSummary.SelectSingleNode("Event").InnerText & vbCrLf
                    'ResponseBox.Text += "EventCity    : " & PackageSummary.SelectSingleNode("EventCity").InnerText & vbCrLf
                    'ResponseBox.Text += "EventState   : " & PackageSummary.SelectSingleNode("EventState").InnerText & vbCrLf
                    'ResponseBox.Text += "EventZIPCode : " & PackageSummary.SelectSingleNode("EventZIPCode").InnerText & vbCrLf
                    'ResponseBox.Text += "FirmName     : " & PackageSummary.SelectSingleNode("FirmName").InnerText & vbCrLf
                    'ResponseBox.Text += "Name         : " & PackageSummary.SelectSingleNode("Name").InnerText & vbCrLf & vbCrLf
                    'ResponseBox.Text += "*********************** Tracking Summary ***********************" & vbCrLf & vbCrLf
                End If
            Next
        Catch ex As Exception
            '
        End Try
        m_nodelist = m_xmld.SelectNodes("TrackResponse/TrackInfo/TrackDetail")
        Try
            For Each PackageDetail As XmlNode In m_nodelist
                If Not PackageDetail.SelectSingleNode("Event").InnerText Is Nothing Then
                    'ResponseBox.Text += "*********************** Tracking Detail ***********************" & vbCrLf & vbCrLf
                    'ResponseBox.Text += "Time         : " & PackageDetail.SelectSingleNode("EventTime").InnerText & vbCrLf
                    'ResponseBox.Text += "Date         : " & PackageDetail.SelectSingleNode("EventDate").InnerText & vbCrLf
                    'ResponseBox.Text += "Event        : " & PackageDetail.SelectSingleNode("Event").InnerText & vbCrLf
                    'ResponseBox.Text += "EventCity    : " & PackageDetail.SelectSingleNode("EventCity").InnerText & vbCrLf
                    'ResponseBox.Text += "EventState   : " & PackageDetail.SelectSingleNode("EventState").InnerText & vbCrLf
                    'ResponseBox.Text += "EventZIPCode : " & PackageDetail.SelectSingleNode("EventZIPCode").InnerText & vbCrLf
                    'ResponseBox.Text += "FirmName     : " & PackageDetail.SelectSingleNode("FirmName").InnerText & vbCrLf
                    'ResponseBox.Text += "Name         : " & PackageDetail.SelectSingleNode("Name").InnerText & vbCrLf & vbCrLf
                    'ResponseBox.Text += "*********************** Tracking Detail ***********************" & vbCrLf & vbCrLf
                End If
            Next
        Catch ex As Exception
            '
        End Try
        m_nodelist = m_xmld.SelectNodes("Error")
        Try
            For Each PackageError As XmlNode In m_nodelist
                If Not PackageError.SelectSingleNode("Number").InnerText Is Nothing Then
                    'ResponseBox.Text += "*********************** Tracking Error ***********************" & vbCrLf & vbCrLf
                    'ResponseBox.Text += "Number     : " & PackageError.SelectSingleNode("Number").InnerText & vbCrLf
                    'ResponseBox.Text += "Source     : " & PackageError.SelectSingleNode("Source").InnerText & vbCrLf
                    'ResponseBox.Text += "Description: " & PackageError.SelectSingleNode("Description").InnerText & vbCrLf
                    'ResponseBox.Text += "HelpFile   : " & PackageError.SelectSingleNode("HelpFile").InnerText & vbCrLf
                    'ResponseBox.Text += "HelpContext: " & PackageError.SelectSingleNode("HelpContext").InnerText & vbCrLf & vbCrLf
                    'ResponseBox.Text += "*********************** Tracking Error ***********************" & vbCrLf & vbCrLf
                End If
            Next
        Catch ex As Exception
            '
        End Try
    End Sub
    Public Function FinalDBUpdate(ByVal ThreadNo As Integer)
        Dim UpdateStatus As New SqlCommand("UpdateTrackingStatus", DBConn)
        UpdateStatus.CommandTimeout = 180
        UpdateStatus.CommandType = CommandType.StoredProcedure
        UpdateStatus.Parameters.AddWithValue("@ThreadNo", ThreadNo)
        Dim parmRowCount As SqlParameter = UpdateStatus.Parameters.Add("@RowCount", SqlDbType.Int)
        parmRowCount.Direction = ParameterDirection.ReturnValue

        Try
            If Not DBConn.State = ConnectionState.Open Then DBConn.Open()
            UpdateStatus.ExecuteNonQuery()
            Dim rowCount As Int32 = CInt(UpdateStatus.Parameters("@RowCount").Value)
            Return rowCount
        Catch ex As Exception
            Dim tmperror As String = "Error - Could not execute stored procedure UpdateTrackingStatus.  Error Below - " & vbCrLf & vbCrLf
            tmperror += ex.Message & vbCrLf & vbCrLf
            tmperror += "List of Parameters and the Values:" & vbCrLf & vbCrLf
            For Each parameter As SqlParameter In UpdateStatus.Parameters
                tmperror += parameter.ToString & ": " & parameter.Value & vbCrLf
            Next
            UpdateStatus.Parameters.Clear()
        End Try
        Return -1
    End Function
    Public Sub ClearStagingTable(ByVal ThreadNo As Integer)
        Dim ClearStaging As New SqlCommand("TRUNCATE TABLE PackageTrackStaging", DBConn)
        Dim ClearTracking As New SqlCommand("TRUNCATE TABLE PackagesToTrack", DBConn)

        Try
            If Not DBConn.State = ConnectionState.Open Then DBConn.Open()
            ClearStaging.ExecuteNonQuery()
            ClearTracking.ExecuteNonQuery()
        Catch ex As Exception

        End Try
    End Sub
    Public Sub EmailError(ByVal errormsg As String)
        Dim eMail As New MailMessage()
        eMail.[To].Add(New MailAddress("sandip@wineshipping.com"))
        'eMail.[To].Add(New MailAddress("IT-Help@wineshipping.com"))
        eMail.From = New MailAddress("WSIIS01@wineshipping.com")
        eMail.Subject = "Exception Event with Package Tracker"
        eMail.Body = "There was an error while running Package Tracker:" & vbCrLf
        eMail.Body += vbCrLf
        eMail.Body += errormsg & vbCrLf
        Try
            Dim client As New SmtpClient("10.10.1.40")
            client.Send(eMail)
        Catch ex As Exception
            '
        End Try
    End Sub
    Public Sub WriteLog(ByVal level As Integer, ByVal message As String, Optional ByVal stacktrace As String = vbNullString, Optional ByVal exception As String = vbNullString, Optional source As String = vbNullString)
        Dim sqlcomm As New SqlCommand("InsertLog", DBConn)
        sqlcomm.CommandType = CommandType.StoredProcedure
        sqlcomm.Parameters.AddWithValue("@level", level)
        sqlcomm.Parameters.AddWithValue("@callSite", "Package Tracker")
        sqlcomm.Parameters.AddWithValue("@type", DBNull.Value)
        sqlcomm.Parameters.AddWithValue("@message", message)
        sqlcomm.Parameters.AddWithValue("@additionalInfo", DBNull.Value)
        sqlcomm.Parameters.AddWithValue("@userDetails", DBNull.Value)

        If (stacktrace = vbNullString) Then
            sqlcomm.Parameters.AddWithValue("@stackTrace", DBNull.Value)
            sqlcomm.Parameters.AddWithValue("@innerException", DBNull.Value)
            sqlcomm.Parameters.AddWithValue("@source", DBNull.Value)
        Else
            sqlcomm.Parameters.AddWithValue("@stackTrace", stacktrace)
            sqlcomm.Parameters.AddWithValue("@innerException", exception)
            sqlcomm.Parameters.AddWithValue("@source", source)
        End If

        Try
            If DBConn.State <> ConnectionState.Open Then
                DBConn.Open() ' Open the connection if it's not open
            End If

            If DBConn.State = ConnectionState.Open Then
                sqlcomm.ExecuteNonQuery()
            Else
                Console.WriteLine("Error - Could not open the database for connection.")
            End If
        Catch exp As Exception
            Console.WriteLine(exp.Message)
            Dim tmperror As String = "Error - Could not execute InsertLog Stored Procedure. Error Below - " & vbCrLf & vbCrLf
            tmperror += exp.Message
            WriteAt(tmperror, 0, 10)
        Finally
            DBConn.Close() ' close the connection
        End Try
    End Sub
    Sub WriteAt(ByVal s As String, ByVal x As Integer, ByVal y As Integer)
        Try
            Console.WriteLine(s)
        Catch e As ArgumentOutOfRangeException
            Console.WriteLine(e.Message)
        End Try
    End Sub
    Public Structure PackageStats
        Dim ThreadNo As Integer
        Dim TrackingNumber As String
        Dim PackageNo As String
        Dim ResponseStatus As String
        Dim ResponseStatusCode As String
        Dim ResponseStatusDate As String
        Dim ResponseStatusTime As String
        Dim ResponseError As String
        Dim ResponseException As Integer
        Dim TrackingError As String
        Dim NoResponseStatus As String
        Dim NoResponseTracking As String
        Dim ExceptionStatus As String
        Dim ExceptionTracking As String
        Dim ReturnStatus As String
        Dim ReturnTracking As String
        Dim SignedForByName As String
        Dim EstimatedDeliveryDate As Date
        Dim CarrierStatusMessage As String
        Dim RTS As Integer
        Dim DAMAGE As Integer
        Dim DAMAGEMSG As String
        Dim RTSTrackingNo As String
        Dim Retry As Integer
    End Structure
    Public Structure UniqudID
        Public FedExUID As String
        Public ShipTimeStamp As Date
    End Structure
End Module
