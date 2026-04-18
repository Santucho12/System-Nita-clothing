# Guía de Instalación para Nita Clothing Stock System (Windows)

Esta guía está pensada para instalar el sistema en una computadora de un cliente sin conocimientos técnicos. Sigue cada paso con atención.

---

## 1. Requisitos previos

### a) Instalar Node.js
- Descarga el instalador desde: https://nodejs.org/
- Ejecuta el instalador y sigue los pasos (elige la opción recomendada).

### b) Instalar MySQL
- Descarga el instalador desde: https://dev.mysql.com/downloads/installer/
- Instala MySQL Server (elige contraseña fácil de recordar y anótala).
- Recuerda el usuario (por defecto: `root`) y la contraseña.

---

## 2. Preparar la base de datos

1. Abre MySQL Workbench o la consola de MySQL.
2. Crea una base de datos nueva, por ejemplo:
   ```sql
   CREATE DATABASE nita_stock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Importa el archivo de respaldo (`nita_stock.sql`) que te entregó el desarrollador:
   - En Workbench: Menú "Server" > "Data Import" > selecciona el archivo y la base de datos.
   - O por consola:
     ```sh
     mysql -u root -p nita_stock < nita_stock.sql
     ```

---

## 3. Configurar el backend

1. Abre la carpeta `backend`.
2. Copia el archivo `config/database.example.js` a `config/database.js`.
3. Edita `database.js` y coloca los datos de tu base de datos local:
   ```js
   module.exports = {
     host: 'localhost',
     user: 'root',
     password: 'TU_CONTRASEÑA',
     database: 'nita_stock',
   };
   ```
4. Instala las dependencias:
   - Abre una terminal en la carpeta `backend`.
   - Ejecuta:
     ```sh
     npm install
     ```
5. Inicia el backend:
   ```sh
   npm start
   ```
   El backend debe quedar corriendo en http://localhost:4000 (o el puerto configurado).

---

## 4. Configurar el frontend

1. Abre la carpeta `frontend`.
2. Instala las dependencias:
   ```sh
   npm install
   ```
3. Configura el archivo `.env` (si existe `.env.example`, cópialo a `.env`).
   - Asegúrate que la variable `REACT_APP_API_URL` apunte a tu backend, por ejemplo:
     ```env
     REACT_APP_API_URL=http://localhost:4000
     ```
4. Genera el build de producción:
   ```sh
   npm run build
   ```
5. (Opcional) Para desarrollo, puedes iniciar con:
   ```sh
   npm start
   ```

---

## 5. Servir el frontend (opción recomendada)

1. Instala el paquete `serve` globalmente:
   ```sh
   npm install -g serve
   ```
2. Sirve la carpeta `build`:
   ```sh
   serve -s build -l 3000
   ```
   El sistema estará disponible en http://localhost:3000

---

## 6. Acceso y uso

- Abre el navegador y entra a http://localhost:3000
- Ingresa con el usuario y contraseña proporcionados.

---

## 7. Notas finales

- Si tienes dudas, contacta al desarrollador.
- No cierres las terminales mientras uses el sistema.
- Para que el sistema funcione, tanto el backend como el frontend deben estar corriendo.

---

**¡Listo! El sistema debería estar funcionando en la PC del cliente.**
