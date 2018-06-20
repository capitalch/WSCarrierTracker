let sqlCommands={};
sqlCommands.getInfos = `
SELECT top 200	NO_,[Shipping Agent Code],[External Tracking No_],status
	FROM [Wineshipping$Package Info] 
	WHERE 
			NOT [Status] = 'Package returned to shipper' and 
			NOT [Status] = 'Delivered' and 
			NOT [Status] = 'Returned' and			
			[Shipping Agent Code] in ('UPS', 'FEX', 'GSO', 'TMC', 'FCC', 'TPS') 
			AND NOT [External Tracking No_] = ''
`;
module.exports = sqlCommands;