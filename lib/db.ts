import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { getDatabaseUrl } from "@/lib/env";

const client = postgres(getDatabaseUrl(), { prepare: false });

export const db = drizzle(client, { schema });
