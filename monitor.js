import express from "express";
import { spawn } from "child_process";

const app = express();
const port = 3000;

// Variable para almacenar el estado
let status = {
  connected: false,
};

// Buffer para almacenar la salida del comando
let outputBuffer = "";

// Función para ejecutar el comando una vez
const runCommandOnce = () => {
  const cmd = spawn("node", ["src/app.js"]); // Ejecuta node con el archivo como argumento

  cmd.stdout.on("data", (data) => {
    // Almacena la salida en el buffer
    outputBuffer += data.toString();
  });

  cmd.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
  });

  cmd.on("close", (code) => {
    console.log(`Comando terminado con código ${code}`);
    // Después de que el comando termine, comienza a verificar la salida
    startCheckingOutput();
  });
};

// Función para verificar la salida cada 3 segundos
const startCheckingOutput = () => {
  setInterval(() => {
    // Verifica el contenido del buffer
    if (outputBuffer.includes("Connected Provider")) {
      status.connected = true;
    } else if (outputBuffer.includes("⚡⚡ ACTION REQUIRED ⚡⚡")) {
      status.connected = false;
    }

    // Opcionalmente, puedes limpiar el buffer si solo quieres verificar la última salida
    // outputBuffer = ''; // Descomenta si deseas reiniciar el buffer después de verificar
  }, 3000);
};

// Llamar a la función para ejecutar el comando
runCommandOnce();

// Endpoint para obtener el estado
app.get("/status", (req, res) => {
  res.json({ connected: status.connected });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
