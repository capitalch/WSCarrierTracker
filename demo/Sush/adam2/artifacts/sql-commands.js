let sqlCommands = {
	getInfos: `
	SELECT NO_ rn,[Shipping Agent Code] shippingAgentCode
	, [External Tracking No_] trackingNumber
	, status
	, Status_Date statusDate
	, Status_Time statusTime
	, EstimatedDeliveryDate estimatedDeliveryDate
	, CarrierStatusCode carrierStatusCode
	, CarrierStatusMessage carrierStatusMessage
	, SignedForByName signedForByName
	, ExceptionStatus exceptionStatus
	, RTS rts
	, RTSTrackingNo rtsTrackingNo
	, DAMAGE damage
	, DAMAGEMSG damageMsg
	FROM [Wineshipping$Package Info] 
   WHERE 
   [Shipment Date] BETWEEN dateadd(mm,-4,getdate()) and getdate() 
   and [Status] NOT IN ('Package returned to shipper', 'Delivered', 'Returned') 
   and [Shipping Agent Code] in ('UPS', 'FEX', 'GSO', 'TMC', 'FCC', 'TPS')  
   and NOT [CarrierStatusCode] IN ('VP','TU','UP') and    [DAMAGE] = 0  
   and    NOT [CarrierStatusMessage] like '%EXPIRED-UNABLE TO RESOLVE EXCEPTION'  
   and    NOT [CarrierStatusMessage] like '%PACKAGE COULD NOT BE LOCATED FOR INTERCEPT' 
   and    NOT [External Tracking No_] = ''  
   and    NOT ([RTS] = 1 AND [Shipping Agent Code] = 'FEX') 
   and ([StatusUpdated] >= dateadd(ww,-3,getdate()) OR [StatusUpdated] = '1900-01-01 00:00:00.000')
			order by NO_
			`,
	updateInfoAndInsertInPackageHistory: `
		update [Wineshipping$Package Info] 
		set Status= @Status,
		Status_Time = @Status_Time,
		Status_Date= @Status_Date,
		EstimatedDeliveryDate = @EstimatedDeliveryDate,
		CarrierStatusCode = @CarrierStatusCode,
		CarrierStatusMessage = @CarrierStatusMessage,
		SignedForByName = @SignedForByName,
		ExceptionStatus = @ExceptionStatus,
		RTS = @RTS,
		RTSTrackingNo = @RTSTrackingNo,
		DAMAGE = @DAMAGE,
		DAMAGEMSG = @DAMAGEMSG
		where No_ = @No_;
	`,
	insertPackageHistory: `
		if @activityJson <> 'null'
			exec sp_UpdateOrInsert  @activityJson,@rn,@trackingNumber,@shippingAgentCode
	`,
	insertPackageLog: `
	insert into packageLog(ApiRequests, ApiResponses, ApiErrors, DbRequests, DbResponses, DbErrors, StartTime, EndTime, Duration)
		values(@ApiRequests, @ApiResponses, @ApiErrors, @DbRequests, @DbResponses, @DbErrors, @StartTime, @EndTime, @Duration);
	`
};

module.exports = sqlCommands;
//, 'UPS', 'FEX', 'GSO', 'TMC', 'FCC', 'TPS'
