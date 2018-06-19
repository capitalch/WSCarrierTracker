SELECT	NO_,[Shipping Agent Code],[External Tracking No_],status
	FROM [Wineshipping$Package Info] 
	WHERE [Shipment Date] BETWEEN dateadd(mm,-4,getdate()) and getdate() and
			NOT [Status] = 'Package returned to shipper' and 
			NOT [Status] = 'Delivered' and 
			NOT [Status] = 'Returned' and			
			[Shipping Agent Code] in ('UPS', 'FEX', 'GSO', 'TMC', 'FCC', 'TPS') 
			AND NOT [External Tracking No_] = ''
			and ([StatusUpdated] >= dateadd(mm,-5,getdate()) OR [StatusUpdated] = '1900-01-01 00:00:00.000') 