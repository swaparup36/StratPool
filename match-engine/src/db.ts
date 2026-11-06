import { client } from "./config.js";
import type { Requirement, Strategy } from "./types.js";

class DB {
  async createIndex() {
    const query = `
      CREATE INDEX IF NOT EXISTS idx_strategy_matching
        ON "Strategy" (
            chain,
            "tradingType",
            "tradingPair"
        )
      WHERE status = 'PUBLISHED'
      AND "isVerified" = TRUE;`;

    try {
      const res = await client.query(query);
      console.log(res.command);
    } catch (error) {
      console.error(error);
    }
  }

  async fetchStrategies(req: Requirement): Promise<Strategy[]> {
    const query = `
SELECT DISTINCT
  s.id,
  s.name,
  s.description,
  s.chain,
  s."tradingType",
  s."tradingPair",
  s.protocol,
  s."poolAddress",
  s."riskLevel"
FROM "Strategy" s
JOIN "StrategyAcceptedAsset" a
  ON a."strategyId" = s.id
WHERE
  s.status = 'PUBLISHED'
  AND s."isVerified" = TRUE
  AND s.chain = $1
  AND s."tradingType" = $2
  AND s."tradingPair" = ANY($3::text[])
  AND UPPER(a.symbol) = UPPER($4)
  AND a."minInvestment" <= $5::numeric
  AND (
    a."maxInvestment" IS NULL
    OR a."maxInvestment" >= $5::numeric
  )
  AND CASE s."riskLevel"
    WHEN 'LOW' THEN 1
    WHEN 'MEDIUM' THEN 2
    WHEN 'HIGH' THEN 3
    ELSE 999
  END <= $6;
  `;

    const riskMap = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
    };

    const risk = riskMap[req.riskLevel];

    const { rows } = await client.query(query, [
      req.chain,
      req.tradingType,
      req.tradingPairs,
      req.asset,
      req.amount,
      risk,
    ]);

    console.log(rows.length);

    return rows as Strategy[];
  }

  async fetchReqById(reqId: string): Promise<Requirement | void> {
    const query = `
    SELECT * FROM "InvestorRequirement" WHERE id = $1;`;

    try {
      const res = client.query(query, [reqId]);
      return (await res).rows[0];
    } catch (error) {
      console.error(error);
      return;
    }
  }
}

export const db = new DB();
db.createIndex();
