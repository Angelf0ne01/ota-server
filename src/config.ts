import dotenv from "dotenv";
dotenv.config();

export const config = {
  api: {
    port: process.env.PORT || 3000,
  },
  db: {
    db_format: process.env.DB_FILENAME || "",
  },
  mqtt: {
    broker_url: process.env.MQTT_BROKER_URL || "",
    topic_connect: process.env.MQTT_TOPIC_CONNECTED || "",
    topic_disconnect: process.env.MQTT_TOPIC_DISCONNECTED || "",
    topic_devices_connected: "#",
  },
};
