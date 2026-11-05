import "dotenv/config";
import { envConfigSchema } from "./schema.js";
import { Client } from "pg";

const configData = envConfigSchema.safeParse(process.env);

if (!configData.success) {
  console.error("Error parsing env file!");
  throw new Error(configData.error.message);
}

export const config = {
  db_uri: configData.data.DB_URI,
};

export const client = await new Client().connect();
