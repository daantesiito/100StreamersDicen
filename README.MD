# 100 Streamers Said - Twitch Edition

Un juego de preguntas interactivo que se conecta con Twitch para obtener respuestas de los espectadores en tiempo real.

## Requisitos

- Node.js
- npm (Node Package Manager)
- Una cuenta de Twitch

## Instalación

1. Clona este repositorio:
    ```sh
    git clone https://github.com/daantesiito/100StreamersSaid.git
    cd 100StreamersSaid
    ```

2. Instala las dependencias:
    ```sh
    npm install
    ```

## Configuración

### Obtener el OAuth Token de Twitch

Para conectar el bot de Twitch a tu juego, necesitas obtener un OAuth token. Sigue estos pasos para generarlo:

1. **Registrar tu aplicación en Twitch:**
   - Ve a [Twitch Developer Applications](https://dev.twitch.tv/console/apps) e inicia sesión.
   - Crea una nueva aplicación y anota tu Client ID y Client Secret.
   - En la parte de OAUTH Redirects URLs pon:
     ```
     http://localhost:3000
     ```

2. **Construir la URL de autorización:**
   - Usa el siguiente formato para crear la URL de autorización:
     ```
     https://id.twitch.tv/oauth2/authorize?client_id=TU_CLIENT_ID&redirect_uri=http://localhost:3000&response_type=token&scope=chat:read+chat:edit
     ```
   - Reemplaza `TU_CLIENT_ID` con tu Client ID obtenido en el paso anterior.

3. **Obtener el token de acceso:**
   - Abre la URL de autorización en tu navegador.
   - Inicia sesión con tu cuenta de Twitch o si tienes una cuenta BOT, inicia sesion con esta y autoriza la aplicación.
   - Serás redirigido a `http://localhost:3000` con el token de acceso en la URL.
   - La URL será similar a:
     ```
     http://localhost:3000/#access_token=TU_ACCESS_TOKEN&scope=chat:read+chat:edit&token_type=bearer
     ```
   - Copia el `access_token` de la URL.

### Configurar el Token en el Código

1. Abre el archivo de configuración del bot de Twitch en tu proyecto (`app.js`).

2. Reemplaza "bot-twitch-name" con el nombre de usuario de cuenta.

3. Reemplaza `'oauth:TU_ACCESS_TOKEN'` con el token que obtuviste en el paso anterior.

    ```javascript
    const twitchUserName = "bot-twitch-name"; // Nombre de usuario de Twitch
    const twitchClient = new tmi.Client({
      options: { debug: true },
      connection: {
        reconnect: true,
        secure: true
      },
      identity: {
        username: twitchUserName,
        password: 'oauth:TU_ACCESS_TOKEN' // Reemplaza con tu token de acceso
      },
      channels: ['twitch-channel-to-connect'] // Canal al que se conectará el bot
    });

    twitchClient.connect();
    ```

## Ejecución

Para iniciar el juego, ejecuta:

```sh
npm start
