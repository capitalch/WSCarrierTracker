let sqlCommands = {
	getInfos: `
SELECT top 1000 NO_ rn,[Shipping Agent Code] shippingAgentCode,[External Tracking No_] trackingNumber,status
	FROM [Wineshipping$PackageinfoNew] 
	WHERE 
			NOT [Status] = 'Package returned to shipper' and 
			NOT [Status] = 'Delivered' and 
			NOT [Status] = 'Returned' and			
			[Shipping Agent Code] in ('FEX') 
			AND NOT [External Tracking No_] = ''
			`,
	updateAndInsertStatus: `
	update Wineshipping$PackageInfoNew
	set Status='test',
		Status_Date=getDate(), 
		Status_Time = getDate(),
		SignedForByName = 'xxx',
		CarrierStatusMessage = 'ddd',
		CarrierStatusCode = 'aaa'
	where No_ = '';
	insert into PackageHistory(rn, TrackingNumber, ShippingAgentCode, ActivityJson)
	values(
		rn,'','',''
)
	`
};
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