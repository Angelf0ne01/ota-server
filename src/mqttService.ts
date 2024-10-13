// src/mqttService.ts
import mqtt from "mqtt";
import {
  upsertDeviceStatus,
  upsertDeviceVersion,
  upsertDeviceEnvironment,
} from "./db";
import { config } from "./config";

// Conectar al broker MQTT
const client = mqtt.connect(config.mqtt.broker_url);

// Al conectarse al broker
client.on("connect", () => {
  console.log("Conectado al broker MQTT");
  // Suscribirse a los topics de estado de los dispositivos
  client.subscribe("devices/+/status");
  client.subscribe("devices/+/version");
  client.subscribe("devices/+/environment");
});

// Al recibir un mensaje en un topic
client.on("message", async (topic, message) => {
  const payload = message.toString();
  console.log({ topic, payload });

  // Extraer clientId del topic
  const topicParts = topic.split("/");
  const clientId = topicParts[1];
  const topicName = topicParts[2];

  if (topicName === "status") {
    const status = payload; // El payload es "online" o "offline"

    // Actualizar el estado del dispositivo en la base de datos
    await upsertDeviceStatus(clientId, status);
  }

  if (topicName === "version") {
    const version = payload; // El payload es la versión del firmware

    // Actualizar la versión del dispositivo en la base de datos
    await upsertDeviceVersion(clientId, version);
  }

  if (topicName === "environment") {
    const environment = payload; // El payload es la versión del firmware

    // Actualizar la versión del dispositivo en la base de datos
    await upsertDeviceEnvironment(clientId, environment);
  }
});
