Imports Microsoft.Azure.WebJobs
Imports System.Data.SqlClient
Imports System.Threading
Imports System.Net.Mail
Imports System.Net
Imports System.Configuration

' To learn more about Microsoft Azure WebJobs SDK, please see http://go.microsoft.com/fwlink/?LinkID=320976
Module Module1
    Dim azureURL As String = WebUtility.HtmlDecode(ConfigurationManager.AppSettings("AzureURL"))
    Dim DBConn As New SqlConnection(ConfigurationManager.ConnectionStrings("TrackPackageThreadConnectionString").ConnectionString)
    Dim ds As New DataSet
    Private StagingCount As Integer = 0
    Private TrackingCount As Integer = 0
    Private _pool As Semaphore
    Private TotalRunningThreadCount As Integer = 0
    Private TotalRunningThreads As Integer = 0
    Private TotalProcessed As Integer = 0
    Private ProcessingComplete As Boolean

    ' Please set the following connection strings in app.config for this WebJob to run:
    ' AzureWebJobsDashboard and AzureWebJobsStorage
    Sub Main()

        'Dim host As New JobHost()
        ' The following code ensures that the WebJob will be running continuously  
        CheckForExistingPackages()
        If StagingCount > 0 Or TrackingCount > 0 Then
            'EmailIT()
            WriteLog(2, "Packages Still Exist in PackagesToTrack!!")
        End If
        StartThreads()
        'host.RunAndBlock()
    End Sub
    Public Sub CheckForExistingPackages()
        Dim CheckStaging As New SqlCommand("Select Count(*) From PackageTrackStaging", DBConn)
        Dim CheckTracking As New SqlCommand("Select Count(*) From PackagesToTrack", DBConn)
        Dim a As New SqlDataAdapter(CheckStaging)
        Dim b As New SqlDataAdapter(CheckTracking)
        Dim tempds As New DataSet

        Try
            If Not DBConn.State = ConnectionState.Open Then
                DBConn.Open()
            End If
            a.Fill(tempds, "Staging")
            b.Fill(tempds, "Tracking")
        Catch ex As Exception
            Dim er As String = ex.Message.ToString
        End Try
        StagingCount = tempds.Tables(0).Rows(0).Item(0).ToString
        TrackingCount = tempds.Tables(1).Rows(0).Item(0).ToString
    End Sub
    Public Sub StartThreads()
        Dim sqlcomm As New SqlCommand("GetPackagesToTrack", DBConn)
        sqlcomm.CommandType = CommandType.StoredProcedure
        Dim sqlcomm2 As New SqlCommand("INSERT INTO PackagesToTrack ([rn],[External Tracking No_],[Shipping Agent Code],[Company],[threadno_],[PackageNo]) VALUES (@rn,@ExternalTrackingNo,@ShippingAgentCode,@Company,@ThreadNo,@PackageNo)", DBConn)
        Try
            If Not DBConn.State = ConnectionState.Open Then DBConn.Open()
            'Messages.Text = "Database Connection is Open"
            'Query Packages Table
            Dim r As New SqlDataAdapter(sqlcomm)
            r.Fill(ds, "WSTrackingInfo")
        Catch exp As Exception
            ' Console.WriteLine(exp.Message)
        Finally
            DBConn.Close() ' close the connection
            sqlcomm.Parameters.Clear()
        End Try

        Dim WSMaxPackages As Integer = 2500
        Dim WSTempCounter As Integer = 1
        Dim RowNo As Integer = 1
        Dim WSThreadNo As Integer = 1
        If (ds.Tables.Contains("WSTrackingInfo")) Then
            If (ds.Tables("WSTrackingInfo").Rows.Count > 0) Then
                For Each WSPackage As DataRow In ds.Tables("WSTrackingInfo").Rows
                    If WSTempCounter >= WSMaxPackages + 1 Then
                        WSTempCounter = 1
                        WSThreadNo += 1
                    End If
                    sqlcomm2.Parameters.AddWithValue("@rn", RowNo)
                    sqlcomm2.Parameters.AddWithValue("@ExternalTrackingNo", WSPackage.Item(0).ToString)
                    sqlcomm2.Parameters.AddWithValue("@ShippingAgentCode", WSPackage.Item(1).ToString)
                    sqlcomm2.Parameters.AddWithValue("@Company", "WS")
                    sqlcomm2.Parameters.AddWithValue("@ThreadNo", WSThreadNo)
                    sqlcomm2.Parameters.AddWithValue("@PackageNo", WSPackage.Item(14).ToString)
                    Try
                        If Not DBConn.State = ConnectionState.Open Then DBConn.Open()
                        sqlcomm2.ExecuteNonQuery()
                        WSTempCounter += 1
                        RowNo += 1
                        sqlcomm2.Parameters.Clear()
                    Catch ex As Exception
                        '
                    End Try
                Next
            End If
        End If

        Dim WSROWS As Integer = RowNo
        Console.WriteLine("Wineshipping Rows - " & WSROWS - 1)
        TotalRunningThreads = WSThreadNo
        Dim MaxThreads As Integer = 8

        'If TotalRunningThreads < MaxThreads Then MaxThreads = TotalRunningThreads
        '_pool = New Semaphore(MaxThreads, TotalRunningThreads)
        'Console.WriteLine("Total Running Thread Count - " & TotalRunningThreadCount)
        'Console.WriteLine("Total Running Threads - " & TotalRunningThreads)

        For I As Integer = 1 To WSThreadNo
            If I > 0 Then

                Dim param As Integer = I
                Dim arguments As String = String.Format(param.ToString())
                Dim userName As String = "$WSTrackingProd"
                Dim userPassword As String = "E849JpSjR5MR4SiAtcfugbu5KAaZkDQgQ3tvhujfN3LlNqNWxElu6bWivG3u"
                'userPWD 
                'change webJobName to your WebJob name 
                Dim webJobName As String = "WSPackageTracker"

                Dim unEncodedString = String.Format($"{userName}:{userPassword}")
                'Dim unEncodedString = String.Format($"{0}: {1}", userName, userPassword)
                Dim encodedString = Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes(unEncodedString))
                'Change this URL to your WebApp hosting the  
                'Dim URL As String = Convert.ToString(azureURL + "/api/triggeredwebjobs/" + webJobName + "/run?arguments=" + Parameter1 & " " & Parameter2)
                Dim URL As String = Convert.ToString(azureURL + "/api/triggeredwebjobs/" + webJobName + "/run?arguments=" + arguments)
                Dim request As System.Net.WebRequest = System.Net.WebRequest.Create(URL)
                request.Method = "POST"
                request.ContentLength = 0
                request.Headers("Authorization") = "Basic " + encodedString
                Dim response As System.Net.WebResponse = request.GetResponse()
                Dim dataStream As System.IO.Stream = response.GetResponseStream()
                Dim reader As New System.IO.StreamReader(dataStream)
                Dim responseFromServer As String = reader.ReadToEnd()
                reader.Close()
                response.Close()

                'Dim myThread As New ThreadObject()
                'myThread.Parameter = I
                'myThread.Start()
                'myThread.Join()
                'TotalRunningThreadCount += 1
                'Console.WriteLine("Total Running Thread Count - " & TotalRunningThreadCount)
            End If
        Next

        DBConn.Close()
        DBConn.Dispose()
        'Thread.Sleep(5000)
    End Sub

    Public Sub WriteLog(ByVal level As Integer, ByVal message As String, Optional ByVal stacktrace As String = vbNullString, Optional ByVal exception As String = vbNullString, Optional source As String = vbNullString)
        Dim sqlcomm As New SqlCommand("InsertLog", DBConn)
        sqlcomm.CommandType = CommandType.StoredProcedure
        sqlcomm.Parameters.AddWithValue("@level", level)
        sqlcomm.Parameters.AddWithValue("@callSite", "Track Package Thread")
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
    Class ThreadObject
        Public Parameter As Integer
        Public Status As Integer = 0
        Private t As Thread = Nothing

        Public Function Start() As Thread
            t = New Thread(AddressOf Me.work)
            t.Start()
            Return t
        End Function

        Public Sub Join()
            Try
                t.Join()
            Catch ex As Exception
                '
            End Try

        End Sub

        Private Sub work()
            Try
                _pool.WaitOne()
                Monitor.Enter(Me)
                Dim myProcess As Process = New Process()
                ' create a new process
                'myProcess.StartInfo.FileName = "C:\Scripts\PackageTracker.exe"

                myProcess.StartInfo.FileName = "C:\\Netwoven\\Wineshipping\\PackageTracker\\PackageTracker.exe"
                myProcess.StartInfo.Arguments = Parameter
                ' wait until it exits
                ' allow the process to raise events
                myProcess.EnableRaisingEvents = True

                ' add an Exited event handler
                AddHandler myProcess.Exited, AddressOf Me.ProcessExited

                ' start the process
                myProcess.Start()
                Monitor.Exit(Me)
            Catch ex As Exception
                WriteAt(ex.Message, 0, 0)
            End Try

        End Sub

        Friend Sub ProcessExited(ByVal sender As Object, ByVal e As System.EventArgs)
            Dim myProcess As Process = DirectCast(sender, Process)
            myProcess.Close()
            _pool.Release()
            TotalProcessed += 1
            If TotalRunningThreadCount = TotalProcessed Then ProcessingComplete = True
        End Sub

    End Class
End Module
