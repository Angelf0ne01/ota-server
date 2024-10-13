// src/index.ts
import express from "express";
import path from "path";
import { initDB, getConnectedDevices } from "./db";
import "./mqttService"; // Importar el servicio MQTT
import { config } from "./config";
import mqtt from "mqtt";

const app = express();
const port = config.api.port;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar la base de datos
initDB();

const client = mqtt.connect(config.mqtt.broker_url);
client.on("connect", () => {
  console.log("Conectado al broker MQTT");
});

// Ruta para obtener los dispositivos conectados
app.get("/devices", async (req, res) => {
  try {
    const devices = await getConnectedDevices();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los dispositivos" });
  }
});

// Ruta para manejar actualizaciones de firmware
app.post("/devices/:deviceId/update-firmware", async (req, res) => {
  const { deviceId } = req.params;
  const { firmwareVersion } = req.body;

  try {
    const updateTopic = `devices/${deviceId}/firmware/update`;
    client.publish(updateTopic, firmwareVersion, { retain: false }, (err) => {
      if (err) {
        console.error("Error al publicar en MQTT", err);
        return res
          .status(500)
          .send("Error al enviar la actualización de firmware.");
      }
      res.send(`Actualización de firmware enviada al dispositivo ${deviceId}.`);
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los dispositivos" });
  }
});
//

app.get("/firmware", (req, res) => {
  const currentVersion = "1.0.1";
  const versionInfo = {
    version: currentVersion, // Cambia esto según la versión más reciente
    url: `http://${req.hostname}:${port}/firmware/${currentVersion}`, // URL del firmware
  };

  res.json(versionInfo); // Devolver la versión en formato JSON
});
// Ruta para servir el archivo binario del firmware
app.get("/firmware/:version", (req, res) => {
  const { version } = req.params;

  const filePath = path.join(
    `${__dirname}/versions/${version}`,
    "firmware.bin"
  ); // Asegúrate de que la ruta sea correcta
  res.download(filePath, "firmware.bin", (err) => {
    if (err) {
      console.error("Error al enviar el firmware:", err);
      res.status(500).send("Error al enviar el firmware");
    }
  });
});
// Iniciar el servidor Express
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
