// src/server.js
import "dotenv/config";             // auto-loads .env
import connectDB from "./config/db.js";
import app from "./app.js";

// establish a connection to the database
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`🚀 Server running at port: ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    console.error("❌ Error connecting to database", error);
    process.exit(1);
  });
