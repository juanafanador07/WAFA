# WAFA - Whatsapp API for Apprise

WAFA is a lightweight REST API that lets you send WhatsApp notifications for free using a normal WhatsApp account. It integrates seamlessly with [Apprise](https://github.com/caronc/apprise), allowing you to use WhatsApp as a notification backend without relying on the official WhatsApp Business API.

Apprise’s built-in WhatsApp support requires Meta’s paid Business API. WAFA instead uses [Baileys](https://github.com/WhiskeySockets/Baileys), enabling fully free message sending with any personal WhatsApp account.

> [!WARNING]
> It's recommended to use a dedicated WhatsApp account for WAFA, which will send messages to your main account or to any group where your main account is present. WhatsApp only triggers notifications for received messages so a separate receiving account is necessary for WAFA to function as intended.

## Features

- Free WhatsApp messaging using a regular account.
- Fully compatible with Apprise.
- Simple and clean REST API
- Docker-ready
- Supports text and file attachments
- Lightweight

## Installation

> [!CAUTION]
> WAFA has no built-in authentication. You should avoid exposing it to the public internet.
>
> Recommended:
>
> - Run behind Docker without publishing ports
> - Bind to `127.0.0.1`
> - Place WAFA behind a reverse proxy with authentication

### Running with Docker

Example `compose.yaml` running both Apprise and WAFA inside the same Docker network:

```yaml
services:
  apprise:
    image: caronc/apprise:latest
    restart: unless-stopped
    environment:
      APPRISE_ATTACH_SIZE: 10
    volumes:
      - ./apprise/config:/config
      - ./apprise/attach:/attach
    ports:
      - 127.0.0.1:8000:8000

  wafa:
    image: ghcr.io/juanafanador07/wafa:latest
    restart: unless-stopped
    volumes:
      - ./wafa/data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    #ports:
    #  - 127.0.0.1:3000:3000
```

### Running from source

Clone the repository:

```bash
git clone https://github.com/juanafanador07/WAFA.git
cd WAFA
```

Install dependencies and build the project:

```bash
pnpm install
pnpm run build
```

(Optional) Create a `.env` file in the project root to override default settings:

```env
#PORT=3000
#LOG_LEVEL=info
#MAX_BODY_SIZE=10mb
#AUTH_DATA_DIR=data
#LISTEN_INTERFACE=127.0.0.1
```

Start WAFA:

```bash
pnpm start
```

## Environment Variables

**LOG_LEVEL**

Defines the logging verbosity. Accepted values are `trace`, `debug`, `info`, `warn`, `error` and `fatal`. Using more verbose levels like `trace` or `debug` will also show Baileys logs. **Default:** `info`

**PORT**

Specifies the port the server should listen on. Must be an integer between `0` and `65535`. **Default:** `3000`

**LISTEN_INTERFACE**

Determines the network interface the server binds to. Can be any valid IPv4 or IPv6 address. **Default:** `127.0.0.1` or `0.0.0.0` in Docker.

**MAX_BODY_SIZE**

Sets the maximum allowed request body size, including notification's text and attachments. Accepts any value supported by the [bytes](https://www.npmjs.com/package/bytes) library (e.g., `100kb`, `1mb`). **Default:** `10mb`

**AUTH_DATA_DIR**

Specifies the directory where authentication data is stored. **Default:** `./data` or `/data` in Docker.

## Quick Start

### Scan the QR

Start WAFA and check the application logs, a QR code will appear. Scan it just as you would when logging into WhatsApp Web.

If running with Docker:

```
docker compose logs wafa
```

### Get the Chat ID

In WhatsApp, send the message `/chat-id` to every chat or group where you want to receive notifications. WAFA replies with the corresponding chat ID.

> [!IMPORTANT]
> You must send this message from the same WhatsApp account that scanned the QR code in the previous step.

### Configure Apprise

Add WAFA as a notification service:

```
json://wafa:3000/?:chats=CHAT_ID_1,CHAT_ID_2,CHAT_ID_3
```

## API Usage

Although designed for Apprise, WAFA’s API can be used standalone.

**GET `/health`**

Checks the connection to WhatsApp.

- If the connection is successful, it returns HTTP 200 with:

```json
{
  "status": "UP"
}
```

- If the connection fails, it responds with an error formatted according to [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html). For example:

```json
{
  "status": 503,
  "type": "client-logged-out",
  "title": "WhatsApp client is logged out.",
  "detail": "Logged out of WhatsApp. Please login using the QR."
}
```

**POST /**

Send a notification.

Request body example:

```json
{
  "title": "This is a title",
  "message": "This is my notification's body",
  "attachments": [
    {
      "filename": "my-image.png",
      "base64": "data:image/png;base64,[...]=",
      "mimetype": "image/png"
    }
  ],
  "chats": "CHAT_ID_1,CHAT_ID_2"
}
```

**Parameters**

**title:** The notification title.

**message:** The body content of the notification.

**chats:** Comma-separated list of chat IDs to which the notification will be sent. Valid formats include:

- `[random-number]@lid`
- `[your-phone-number]@s.whatsapp.net`
- `[random-number]@g.us`

**attachments**: An array of attachment objects, each containing:

- **filename**: Name of the file.

- **base64**: Base64-encoded file content.

- **mimetype**: MIME type of the file.

## License

WAFA is open source software licensed under the [MIT License](https://github.com/juanafanador07/WAFA/blob/main/LICENSE).
