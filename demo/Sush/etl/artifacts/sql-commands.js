let sqlCommands = {
	getPackageHistory:`
	SELECT [rn]
	,[TrackingNumber]
	,[ShippingAgentCode]
	,[ActivityJson]
	,[IsProcessed]
FROM [dbo].[PackageHistory]
where [IsProcessed]=0
order by [rn]
	`,
	processEtl: `	
	delete from [dbo].[ActivityDetails] where rn=@rn
	insert into [dbo].[ActivityDetails]([rn]
			   ,[TrackingNumber]
			   ,[ShippingAgentCode]
			   ,[ActivityDateTime]
			   ,[Location]
			   ,[ActivityCode]
			   ,[ActivityDetails])
	select @rn,@TrackingNumber,@ShippingAgentCode,ActivityDateTime,Location,ActivityCode,ActivityDetails from openjson(@ActivityJson)
	WITH (   
				  Location   varchar(200)   '$.Location',  
				  ActivityCode     varchar(200)     '$.ActivityCode',  
				  ActivityDetails varchar(200)   '$.ActivityDetails',
				  ActivityDateTime varchar(200)   '$.ActivityDateTime'
	 )
	 update [dbo].[PackageHistory] set [IsProcessed] =1 where rn =@rn
	 `
};

module.exports = sqlCommands;