let sqlCommands = {
	getInfos: `
		SELECT top 10 NO_ rn,[Shipping Agent Code] shippingAgentCode,[External Tracking No_] trackingNumber,status
		FROM [Wineshipping$PackageinfoNew] 
		WHERE 
				NOT [Status] = 'Package returned to shipper' and 
				--NOT [Status] = 'Delivered' and 
				NOT [Status] = 'Returned' and			
				[Shipping Agent Code] in ('UPS', 'FEX', 'GSO') 
				AND NOT [External Tracking No_] = ''
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
	updateInfoAndInsertInPackageHistory1: `
		update Wineshipping$PackageInfoNew
		set Status= 'Test 1',
		Status_Time = '',
		Status_Date= '',
		EstimatedDeliveryDate = '',
		CarrierStatusCode = '',
		CarrierStatusMessage = '',
		SignedForByName = '',
		ExceptionStatus = 0,
		RTS = 0,
		RTSTrackingNo = '',
		DAMAGE = 0,
		DAMAGEMSG = ''
		where No_ = @No;
	`,
	insertPackageHistory: `
		insert into PackageHistory(rn, TrackingNumber, ShippingAgentCode, 
			ActivityJson, 
			IsDeleted)
		values (@rn, @trackingNumber, @shippingAgentCode
			,@activityJson
			, 0);
	`,
	insertPackageLog:`
	insert into packageLog(ApiRequests, ApiResponses, ApiErrors, DbRequests, DbResponses, DbErrors, StartTime, EndTime, Duration)
		values(@ApiRequests, @ApiResponses, @ApiErrors, @DbRequests, @DbResponses, @DbErrors, @StartTime, @EndTime, @Duration);
	`
	// ,
	// updateTest: `
	// update Wineshipping$PackageInfoNew
	// set Status = ''
	// where No_ = 'CONT-000005331'
	// `,
	// updateTest1:`
	// update Product set unitPrice = 0 where id = 1;
	// `
};

module.exports = sqlCommands;
//, 'UPS', 'FEX', 'GSO', 'TMC', 'FCC', 'TPS'

/*

		--

*/