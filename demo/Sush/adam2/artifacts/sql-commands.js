let sqlCommands={};
sqlCommands.getInfos = `
SELECT top 10000 NO_ rn,[Shipping Agent Code] shipping,[External Tracking No_] trackingNumber,status
	FROM [Wineshipping$PackageinfoNew] 
	WHERE 
			NOT [Status] = 'Package returned to shipper' and 
			NOT [Status] = 'Delivered' and 
			NOT [Status] = 'Returned' and			
			[Shipping Agent Code] in ('FEX') 
			AND NOT [External Tracking No_] = ''
`;
module.exports = sqlCommands;
//, 'UPS', 'FEX', 'GSO', 'TMC', 'FCC', 'TPS'

// AND status = 'View Detail'