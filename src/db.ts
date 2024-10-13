// src/db.ts
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { config } from "./config";

// Definir el tipo correcto para la base de datos
let db: Database<sqlite3.Database, sqlite3.Statement>;

export const initDB = async () => {
  db = await open({
    filename: config.db.db_format,
    driver: sqlite3.Database,
  });

  // Crear tabla de dispositivos conectados
  await db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId TEXT NOT NULL UNIQUE,
      firmwareVersion TEXT NULL,
      environment TEXT NULL,
      status TEXT NOT NULL,  -- Estado online/offline
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP  -- Última actualización
    )
  `);

  console.log("Base de datos en memoria inicializada");
};

// Agregar dispositivo conectado
export const upsertDeviceStatus = async (clientId: string, status: string) => {
  try {
    // Verificar si el dispositivo ya existe
    const existingDevice = await db.get(
      "SELECT * FROM devices WHERE clientId = ?",
      clientId
    );

    if (existingDevice) {
      // Si existe, actualizar el estado y la fecha de actualización
      await db.run(
        `
        UPDATE devices 
        SET status = ?, updatedAt = CURRENT_TIMESTAMP 
        WHERE clientId = ?
      `,
        [status, clientId]
      );

      console.log(`Dispositivo ${clientId} actualizado a ${status}`);
    } else {
      // Si no existe, insertar un nuevo dispositivo
      await db.run(
        `
        INSERT INTO devices (clientId, status, updatedAt) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `,
        [clientId, status]
      );

      console.log(`Dispositivo ${clientId} agregado con estado ${status}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error al hacer upsert del dispositivo:", error.message);
    }
    console.error(error);
  }
};

export async function upsertDeviceVersion(clientId: string, version: string) {
  try {
    // Verificar si el dispositivo ya existe
    const existingDevice = await db.get(
      "SELECT * FROM devices WHERE clientId = ?",
      clientId
    );

    if (existingDevice) {
      // Si existe, actualizar la versión
      await db.run(
        `
        UPDATE devices 
        SET firmwareVersion = ?, updatedAt = CURRENT_TIMESTAMP 
        WHERE clientId = ?
      `,
        [version, clientId]
      );

      console.log(
        `Dispositivo ${clientId} actualizado a la versión ${version}`
      );
    } else {
      // Si no existe, insertar un nuevo dispositivo
      await db.run(
        `
        INSERT INTO devices (clientId, firmwareVersion, status, updatedAt) 
        VALUES (?, ?, 'offline', CURRENT_TIMESTAMP)
      `,
        [clientId, version]
      );

      console.log(`Dispositivo ${clientId} agregado con versión ${version}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error al hacer setear la versión:", error.message);
    }
    console.error(error);
  }
}

export async function upsertDeviceEnvironment(
  clientId: string,
  environment: string
) {
  try {
    await db.run(
      `
        UPDATE devices 
        SET environment = ?, updatedAt = CURRENT_TIMESTAMP 
        WHERE clientId = ?
      `,
      [environment, clientId]
    );

    console.log(`Dispositivo ${clientId} actualizado la env ${environment}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error al hacer setear la env:", error.message);
    }
    console.error(error);
  }
}

// Eliminar dispositivo desconectado

// Obtener lista de dispositivos conectados
export const getConnectedDevices = async () => {
  const devices = await db.all("SELECT * FROM devices");
  return devices;
};
