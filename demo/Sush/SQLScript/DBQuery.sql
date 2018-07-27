CREATE TABLE [dbo].[PackageHistory](
	[rn] [varchar](50) NOT NULL,
	[TrackingNumber] [varchar](50) NOT NULL,
	[ShippingAgentCode] [varchar](50) NOT NULL,
	[ActivityJson] [varchar](max) NULL,
	[IsProcessed] [bit] NOT NULL,
 CONSTRAINT [PK_PackageHistory] PRIMARY KEY CLUSTERED 
(
	[rn] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[PackageHistory] ADD  CONSTRAINT [DF_Wineshipping$PackageHistory_TrackingNumber]  DEFAULT ('') FOR [TrackingNumber]
GO

ALTER TABLE [dbo].[PackageHistory] ADD  CONSTRAINT [DF_Wineshipping$PackageHistory_ShippingAgentCode]  DEFAULT ('') FOR [ShippingAgentCode]
GO

ALTER TABLE [dbo].[PackageHistory] ADD  CONSTRAINT [DF_Wineshipping$PackageHistory_ActivityJson]  DEFAULT ('') FOR [ActivityJson]
GO

ALTER TABLE [dbo].[PackageHistory] ADD  CONSTRAINT [DF_Wineshipping$PackageHistory_isProcessed]  DEFAULT ((0)) FOR [IsProcessed]
GOs


CREATE NONCLUSTERED INDEX [IX_PackageHistory_IsProcessed] ON [dbo].[PackageHistory]
(
	[IsProcessed] ASC
)
WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF) ON [PRIMARY]
GO


/****** Object:  Table [dbo].[ActivityDetails]    Script Date: 27-07-2018 15:13:01 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[ActivityDetails](
	[ActivityID] [bigint] IDENTITY(1,1) NOT NULL,
	[rn] [varchar](50) NOT NULL,
	[TrackingNumber] [varchar](50) NULL,
	[ShippingAgentCode] [varchar](50) NULL,
	[ActivityDateTime] [datetime] NULL,
	[Location] [varchar](500) NULL,
	[ActivityCode] [varchar](250) NULL,
	[ActivityDetails] [varchar](max) NULL,
 CONSTRAINT [PK_PackageActivity] PRIMARY KEY CLUSTERED 
(
	[ActivityID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[ActivityDetails] ADD  CONSTRAINT [DF_Wineshipping$ActivityDetails_TrackingNumber]  DEFAULT ('') FOR [TrackingNumber]
GO

ALTER TABLE [dbo].[ActivityDetails] ADD  CONSTRAINT [DF_Wineshipping$ActivityDetails_ShippingAgentCode]  DEFAULT ('') FOR [ShippingAgentCode]
GO

ALTER TABLE [dbo].[ActivityDetails] ADD  CONSTRAINT [DF_Wineshipping$ActivityDetails_ActivityDateTime]  DEFAULT ('1900-01-01 00:00:00.000') FOR [ActivityDateTime]
GO

ALTER TABLE [dbo].[ActivityDetails] ADD  CONSTRAINT [DF_Wineshipping$ActivityDetails_Location]  DEFAULT ('') FOR [Location]
GO

ALTER TABLE [dbo].[ActivityDetails] ADD  CONSTRAINT [DF_Wineshipping$ActivityDetails_ActivityCode]  DEFAULT ('') FOR [ActivityCode]
GO

ALTER TABLE [dbo].[ActivityDetails] ADD  CONSTRAINT [DF_Wineshipping$ActivityDetails_ActivityDetails]  DEFAULT ((0)) FOR [ActivityDetails]
GO


CREATE NONCLUSTERED INDEX [idxActivityDetailsrn] ON [dbo].[ActivityDetails]
(
	[rn] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF) ON [PRIMARY]
GO


ALTER procedure [dbo].[sp_UpdateOrInsert] 
@activityJson nvarchar(max),
@rn varchar(50),
@trackingNumber varchar(50),
@shippingAgentCode varchar(50)
as

begin tran
              update PackageHistory with (serializable) set ActivityJson =  @activityJson,[IsProcessed] =0
              where [rn] =@rn      
              if @@rowcount = 0
                     begin
                           insert into PackageHistory(rn, TrackingNumber, ShippingAgentCode, 
                                                ActivityJson, 
                                                IsProcessed)
                                         values (@rn, @trackingNumber, @shippingAgentCode
                                                ,@activityJson
                                                , 0);
                     end
commit tran