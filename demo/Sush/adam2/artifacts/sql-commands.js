let sqlCommands = {
	getInfos: `
		SELECT top 100 NO_ rn,[Shipping Agent Code] shippingAgentCode,[External Tracking No_] trackingNumber,status
		FROM [Wineshipping$PackageinfoNew] 
		WHERE 
				NOT [Status] = 'Package returned to shipper' and 
				NOT [Status] = 'Delivered' and 
				NOT [Status] = 'Returned' and			
				[Shipping Agent Code] in ('GSO') 
				AND NOT [External Tracking No_] = ''
			`,
	updateInfoAndInsertInPackageHistory: `
		update Wineshipping$PackageInfoNew
		set Status= @Status,
		Status_Date= @Status_Date,
		Status_Time = @Status_Time,
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
		insert into PackageHistory(rn, TrackingNumber, ShippingAgentCode, ActivityJson, IsDeleted)
		values (@rn, @trackingNumber, @shippingAgentCode,@activityJson, 0);
	`
};

/*
set 
	
		
*/



// insert into PackageHistory(rn, TrackingNumber, ShippingAgentCode, ActivityJson)
// 	values(
// 		rn,'','','')

// sqlCommands.getInfos = `
// SELECT top 1000 NO_ rn,[Shipping Agent Code] shipping,[External Tracking No_] trackingNumber,status
// 	FROM [Wineshipping$PackageinfoNew] 
// 	WHERE 
// 			NOT [Status] = 'Package returned to shipper' and 
// 			NOT [Status] = 'Delivered' and 
// 			NOT [Status] = 'Returned' and			
// 			[Shipping Agent Code] in ('FEX') 
// 			AND NOT [External Tracking No_] = ''
// `;

module.exports = sqlCommands;
//, 'UPS', 'FEX', 'GSO', 'TMC', 'FCC', 'TPS'

// AND status = 'View Detail'