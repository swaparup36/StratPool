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

  async fetchStrategyById(strategyId: string): Promise<any> {
    try {
      const res = await client.query(
        `
        SELECT * FROM "Strategy" WHERE id = $1;`,
        [strategyId],
      );

      return res.rows[0];
    } catch (error) {
      console.error(error);
      return;
    }
  }

  async fetchStrategies(req: Requirement): Promise<Array<Strategy> | void> {
    const query = `
      SELECT
        id,
        name,
        description,
        chain,
        "tradingType",
        "tradingPair",
        protocol,
        "poolAddress",
        "acceptedAssets",
        "minInvestment",
        "maxInvestment",
        "riskLevel"
      FROM "Strategy"
      WHERE
        status = 'PUBLISHED'
        AND "isVerified" = TRUE

        AND chain = $1
        AND "tradingType" = $2
        AND "tradingPair" = ANY($3::text[])

        AND $4 = ANY("acceptedAssets")

        AND "minInvestment" <= $5::numeric
        AND "maxInvestment" >= $5::numeric

        AND CASE "riskLevel"
            WHEN 'LOW' THEN 1
            WHEN 'MEDIUM' THEN 2
            WHEN 'HIGH' THEN 3
        END <= $6;
      `;

    const riskMap = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
    };

    const risk = riskMap[req.preferences.riskLevel];

    try {
      const res = await client.query(query, [
        req.investment.chain,
        req.preferences.tradingType,
        req.preferences.tradingPairs,
        req.investment.asset,
        req.investment.amount,
        risk,
      ]);

      console.log(res.rowCount);
      return res.rows as Array<Strategy>;
    } catch (error) {
      console.error(error);
    }
  }

  async markStrategyVerified(strategyId: string) {
    try {
      const res = await client.query(`
        UPDATE "Strategy" SET "isVerified" = TRUE WHERE id = $1;`, [strategyId]);

      console.log(res.rowCount);
      return res.rowCount;
    } catch (error) {
      console.error(error);
      return;
    }
  }
}

export const db = new DB();
db.createIndex();
