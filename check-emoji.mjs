import { drizzle } from "drizzle-orm/mysql2";
import * as dotenv from "dotenv";
dotenv.config();

const db = drizzle(process.env.DATABASE_URL);
const result = await db.execute("SELECT id, name, emojiStyle FROM personas LIMIT 5");
console.log(JSON.stringify(result, null, 2));
process.exit(0);
