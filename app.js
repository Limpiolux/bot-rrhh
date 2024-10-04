import { join } from "path";
import {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  utils,
} from "@builderbot/bot";
import { JsonFileDB as Database } from "@builderbot/database-json";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import nodemailer from "nodemailer";
import axios from "axios";
import mysql from "mysql2/promise"; // o 'pg' si usas PostgreSQL
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import https from "https";
const privateKey = fs.readFileSync("private2024.pem", "utf8");
const certificate = fs.readFileSync("certificate2024.pem", "utf8");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const credentials = { key: privateKey, cert: certificate };
const server = https.createServer(credentials, app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use __dirname to construct your path
const qrImagePath = path.join(__dirname, "bot.qr.png");

let loginStatus = false; // Estado inicial
let registeredNumber = ""; // Número registrado

app.use(
  cors({
    origin: "*", // Permitir todos los orígenes
    methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
    allowedHeaders: ["Content-Type", "Authorization"], // Encabezados permitidos
  })
);

const transporter = nodemailer.createTransport({
  service: "Office365",
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: "pautomate@limpiolux.com.ar",
    pass: "Sard1na.3400",
  },
});

async function sendPostRequest(number, message, urlMedia) {
  const url = "http://localhost:7137/v1/messages";

  try {
    const response = await axios.post(url, {
      number: number,
      message: message,
      urlMedia: urlMedia,
    });

    console.log("Respuesta del servidor:", response.data);
  } catch (error) {
    console.error("Error al enviar la solicitud POST:", error);
  }
}

const phoneNumber = "5491166393255";

let mailOptions = {
  from: "pautomate@limpiolux.com.ar",
  to: "amejias@limpiolux.com.ar, ptripodi@limpiolux.com.ar",
  subject: "Nueva consulta Chatbot RRHH",
  text: "Hola! Hay una nueva consulta en el Chabot de RRHH",
  html: "<b>Hola! Hay una nueva consulta en el Chabot de RRHH</b>",
};

const PORT = process.env.PORT ?? 7137;
const PORT2 = process.env.PORT ?? 7138;

// Conectar a la base de datos
const dbConfig = {
  host: "192.168.1.28", // Cambia esto a tu IP de base de datos
  port: 7134, // Asegúrate de incluir el puerto
  user: "root", // Cambia esto a tu usuario de base de datos
  password: "root", // Cambia esto a tu contraseña de base de datos
  database: "flujos", // Cambia esto a tu base de datos
};

// Función para crear flujos dinámicamente
async function getFlowsFromDatabase() {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute("SELECT * FROM Flujos");
  await connection.end();
  return rows;
}

async function updateFlowInDatabase(id, updatedFlow) {
  const connection = await mysql.createConnection(dbConfig);
  const query = `UPDATE Flujos SET 
    FlowName = ?, 
    Keywords = ?, 
    Answer = ?, 
    PosibleRespuesta = ?, 
    GoToFlow = ?, 
    FlowDynamic = ?, 
    notify = ? 
    WHERE id = ?`;

  const values = [
    updatedFlow.FlowName,
    updatedFlow.Keywords,
    updatedFlow.Answer,
    updatedFlow.PosibleRespuesta,
    updatedFlow.GoToFlow,
    updatedFlow.FlowDynamic,
    updatedFlow.notify,
    id,
  ];

  await connection.execute(query, values);
  await connection.end();
}

async function deleteFlowFromDatabase(id) {
  const connection = await mysql.createConnection(dbConfig);
  const query = `DELETE FROM Flujos WHERE id = ?`;

  await connection.execute(query, [id]);
  await connection.end();
}

async function createFlowInDatabase(newFlow) {
  const connection = await mysql.createConnection(dbConfig);
  const query = `INSERT INTO Flujos (FlowName, Keywords, Answer, PosibleRespuesta, GoToFlow, FlowDynamic, notify) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const values = [
    newFlow.FlowName, // Puede ser null
    newFlow.Keywords,
    newFlow.Answer,
    newFlow.PosibleRespuesta || null, // Puede ser null
    newFlow.GoToFlow || null, // Puede ser null
    newFlow.FlowDynamic || null, // Puede ser null
    newFlow.notify, // 0 o 1
  ];

  await connection.execute(query, values);
  await connection.end();
}

async function createDynamicFlows() {
  const flowsData = await getFlowsFromDatabase();
  const flowsMap = {};

  flowsData.forEach((row) => {
    const {
      FlowName,
      Keywords,
      Answer,
      PosibleRespuesta,
      GoToFlow,
      FlowDynamic,
      notify, // Agregamos notify aquí
    } = row;

    if (!flowsMap[FlowName]) {
      const keywordsArray = Keywords
        ? Keywords.split(",").map((kw) => kw.trim())
        : [];
      const possibleResponses = PosibleRespuesta
        ? PosibleRespuesta.split(",").map((res) => res.trim())
        : [];
      const goToFlows = GoToFlow
        ? GoToFlow.split(",").map((flow) => flow.trim())
        : [];

      // Solo crear el flujo si hay palabras clave y respuesta
      if (keywordsArray.length > 0 && Answer) {
        flowsMap[FlowName] = addKeyword(keywordsArray).addAnswer(
          Answer,
          { capture: true },
          async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
            const response = ctx.body.trim().toLowerCase();

            // Verificar si la respuesta es válida
            if (possibleResponses.includes(response)) {
              const index = possibleResponses.indexOf(response);
              const nextFlowName = goToFlows[index];
              const nextFlow = flowsMap[nextFlowName];
              if (nextFlow) {
                return gotoFlow(nextFlow);
              }
            }

            // Si no coincide la respuesta, usa el FlowDynamic
            if (FlowDynamic) {
              await flowDynamic(FlowDynamic);
            } else {
              await fallBack("Por favor selecciona una opción válida.");
            }

            // Verificamos si notify es true
            if (notify === 1) {
              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  return console.log("Error al enviar el correo:", error);
                }
                console.log("Correo enviado:", info.response);
              });

              sendPostRequest(
                phoneNumber,
                `Hola! Hay una nueva Consulta del Chatbot RRHH sobre ${FlowName}`,
                ""
              );
            }
          }
        );
      }
    }
  });

  return Object.values(flowsMap);
}

const consoleLog = console.log;
console.log = function (message) {
  if (message.includes("Connected Provider")) {
    loginStatus = true;
  } else if (message.includes("ACTION REQUIRED")) {
    loginStatus = false;
  }
  consoleLog.apply(console, arguments);
};

app.get("/api/flows", async (req, res) => {
  try {
    const flowsData = await getFlowsFromDatabase();
    res.json(flowsData); // Devuelve los flujos como JSON
  } catch (error) {
    console.error("Error al obtener flujos:", error);
    res.status(500).json({ message: "Error al obtener flujos" });
  }
});

app.put("/api/flows/:id", async (req, res) => {
  const flowId = req.params.id;
  const updatedFlow = req.body;

  if (!updatedFlow) {
    return res
      .status(400)
      .json({ error: "El flujo actualizado es indefinido." });
  }

  try {
    await updateFlowInDatabase(flowId, updatedFlow);
    res.status(200).json({ message: "Flujo actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar el flujo:", error);
    res.status(500).json({ error: "Error al actualizar el flujo" });
  }
});

app.delete("/api/flows/:id", async (req, res) => {
  const flowId = req.params.id;

  try {
    await deleteFlowFromDatabase(flowId);
    res.status(200).json({ message: "Flujo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el flujo:", error);
    res.status(500).json({ error: "Error al eliminar el flujo" });
  }
});

app.get("/qr", (req, res) => {
  try {
    // Verificar si el archivo existe
    if (fs.existsSync(qrImagePath)) {
      // Leer el archivo y enviarlo como respuesta
      const image = fs.readFileSync(qrImagePath);
      res.contentType("image/png");
      res.send(image);
    } else {
      // Si el archivo no existe, enviar una respuesta de error 404
      res.status(404).send({ error: "File not found" });
    }
  } catch (error) {
    // En caso de cualquier error, enviar una respuesta de error 500
    res.status(500).send({ error: "Internal server error" + error });
  }
});

app.get("/login", (req, res) => {
  res.send({ status: loginStatus, registeredNumber: registeredNumber });
});

app.post("/api/flows", async (req, res) => {
  const {
    FlowName,
    Keywords,
    Answer,
    PosibleRespuesta,
    GoToFlow,
    FlowDynamic,
    notify,
  } = req.body;

  // Validar campos obligatorios
  if (!Keywords || !Answer || !FlowName || (notify !== 0 && notify !== 1)) {
    return res.status(400).json({
      message: "Los campos Keywords, Answer, y notify (0 o 1) son obligatorios",
    });
  }

  const newFlow = {
    FlowName: FlowName || null, // Campo opcional
    Keywords,
    Answer,
    PosibleRespuesta: PosibleRespuesta || null, // Campo opcional
    GoToFlow: GoToFlow || null, // Campo opcional
    FlowDynamic: FlowDynamic || null, // Campo opcional
    notify, // Debe ser 0 o 1
  };

  try {
    await createFlowInDatabase(newFlow); // Llama a la función que crea el flujo
    res.status(201).json({ message: "Flujo creado con éxito" });
  } catch (error) {
    console.error("Error al crear el flujo:", error);
    res.status(500).json({ message: "Error al crear el flujo" });
  }
});

async function main() {
  // Cargar los flujos desde la base de datos
  const dynamicFlows = await createDynamicFlows();

  // Crear el flujo a partir de los flujos dinámicos
  const adapterFlow = createFlow(dynamicFlows);

  const adapterProvider = createProvider(Provider);
  const adapterDB = new Database({ filename: "db.json" });

  const { handleCtx, httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  adapterProvider.server.post(
    "/v1/messages",
    handleCtx(async (bot, req, res) => {
      const { number, message, urlMedia } = req.body;
      await bot.sendMessage(number, message, { media: urlMedia ?? null });
      return res.end("sended");
    })
  );

  adapterProvider.server.post(
    "/v1/register",
    handleCtx(async (bot, req, res) => {
      const { number, name } = req.body;
      await bot.dispatch("REGISTER_FLOW", { from: number, name });
      return res.end("trigger");
    })
  );

  adapterProvider.server.post(
    "/v1/samples",
    handleCtx(async (bot, req, res) => {
      const { number, name } = req.body;
      await bot.dispatch("SAMPLES", { from: number, name });
      return res.end("trigger");
    })
  );

  adapterProvider.server.post(
    "/v1/blacklist",
    handleCtx(async (bot, req, res) => {
      const { number, intent } = req.body;
      if (intent === "remove") bot.blacklist.remove(number);
      if (intent === "add") bot.blacklist.add(number);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", number, intent }));
    })
  );

  httpServer(+PORT);
}

main();

server.listen(PORT2, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
