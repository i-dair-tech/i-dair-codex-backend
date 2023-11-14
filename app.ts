import { sequelize } from "./src/config/sequelize";
import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import riCodexRoutes from "./src/routes/riCodexRoutes";
import { createSuperAdmin } from "./src/common/functions";

dotenv.config();

sequelize.sync();

const app: Application = express();

// Application's port
const port = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());

createSuperAdmin();

//routes imports
app.use(riCodexRoutes);
app.listen(port, () => console.log("Server started at port: ", port));

export { app };
