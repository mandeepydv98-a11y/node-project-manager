import "dotenv/config";
import dns from "node:dns";
import app from "./app.js";
import connectDB from "./db/index.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const port = Number(process.env.PORT || 3000);

connectDB()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Project Camp API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error", error);
    process.exit(1);
  });
