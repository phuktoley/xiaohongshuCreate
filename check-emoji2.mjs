import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute("SELECT id, name, emojiStyle FROM personas LIMIT 5");
console.log("Results:", rows);
for (const row of rows) {
  console.log(`ID: ${row.id}, Name: ${row.name}`);
  console.log(`EmojiStyle raw:`, row.emojiStyle);
  if (row.emojiStyle) {
    const parsed = JSON.parse(row.emojiStyle);
    console.log(`EmojiStyle parsed:`, parsed);
  }
}
await connection.end();
