import app from "./app";
import { assertAuthConfiguration } from "./config/auth";
import { connectDatabase } from "./config/database";

const port = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
    assertAuthConfiguration();
    await connectDatabase();

    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
  }
};

void startServer();
