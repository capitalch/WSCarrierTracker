let sqlCommands = {
	getInfos: `
		SELECT top 100 NO_ rn,[Shipping Agent Code] shippingAgentCode
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
		FROM [Wineshipping$PackageinfoNew] 
		WHERE 
				NOT [Status] = 'Package returned to shipper' and 
				--NOT [Status] = 'Delivered' and 
				NOT [Status] = 'Returned' and			
				[Shipping Agent Code] in ( 'UPS', 'FEX', 'GSO', 'TMC', 'FCC', 'TPS') 
				AND NOT [External Tracking No_] = ''
				order by NO_
			`,
	updateInfoAndInsertInPackageHistory: `
		update Wineshipping$PackageInfoNew
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
			insert into PackageHistory(rn, TrackingNumber, ShippingAgentCode, 
				ActivityJson, 
				IsDeleted)
			values (@rn, @trackingNumber, @shippingAgentCode
				,@activityJson
				, 0);
	`,
	insertPackageLog: `
	insert into packageLog(ApiRequests, ApiResponses, ApiErrors, DbRequests, DbResponses, DbErrors, StartTime, EndTime, Duration)
		values(@ApiRequests, @ApiResponses, @ApiErrors, @DbRequests, @DbResponses, @DbErrors, @StartTime, @EndTime, @Duration);
	`
};

module.exports = sqlCommands;
//, 'UPS', 'FEX', 'GSO', 'TMC', 'FCC', 'TPS'

/*

		--

*/