

CREATE VIEW `AgentBalance` AS
SELECT 
    A.id AS id,
    A.headAgentId AS headAgentId,
    IFNULL(SUM(M.cash) , 0) + A.cash + A.credit AS totalAvail,
    IFNULL(SUM(M.cash), 0)  + A.cash AS totalCash,
    IFNULL(SUM(M.frozenBalance), 0) AS totalFrozen
FROM  AgentInfo AS A
LEFT JOIN MemberInfo AS M
	ON M.agentId=A.id
GROUP BY A.id


CREATE VIEW `HeadAgentBalance` AS
SELECT 
    H.id AS id,
    H.adminId AS adminId,
	IFNULL(SUM(A.totalCash), 0) + H.cash + H.credit AS totalAvail,
    IFNULL(SUM(A.totalCash), 0) + H.cash AS totalCash,
    IFNULL(SUM(A.totalFrozen), 0) AS totalFrozen
FROM HeadAgentInfo AS H
LEFT JOIN AgentBalance AS A
	ON A.headAgentId=H.id
GROUP BY H.id


CREATE VIEW `AdminBalance` AS
SELECT 
    Adm.id AS id,
    IFNULL(SUM(H.totalCash), 0) + Adm.cash + Adm.credit AS totalAvail,
	IFNULL(SUM(H.totalCash), 0) + Adm.cash AS totalCash,
    IFNULL(SUM(H.totalFrozen), 0) AS totalFrozen
FROM AdminInfo AS Adm
LEFT JOIN HeadAgentBalance AS H 
	ON H.adminId=Adm.id
GROUP BY Adm.id

