import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",
  API_PUBLIC_URL: process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? "uploads",
  DPO_COMPANY_TOKEN: process.env.DPO_COMPANY_TOKEN || "",
  DPO_SERVICE_TYPE: process.env.DPO_SERVICE_TYPE || "",
};
