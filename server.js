const http = require("node:http");
const crypto = require("node:crypto");
const { WebSocketServer } = require("ws");

const port = Number(process.env.PORT || 3000);
const sessions = new Map();
const clientSessions = new Map();

function createId(bytes = 12) {
    return crypto.randomBytes(bytes).toString("hex");
}

function createJoinCode() {
    let code;

    do {
        code = crypto.randomBytes(3).toString("hex").toUpperCase();
    } while ([...sessions.values()].some(session => session.joinCode === code));

    return code;
}

function json(response, statusCode, body) {
    const content = JSON.stringify(body);

    response.writeHead(statusCode, {
        "content-type": "application/json; charset=utf-8",
        "content-length": Buffer.byteLength(content)
    });
    response.end(content);
}

function readJson(request) {
    return new Promise((resolve, reject) => {
        let body = "";

        request.on("data", chunk => {
            body += chunk;

            if (body.length > 1024 * 1024) {
                reject(new Error("Request body is too large."));
                request.destroy();
            }
        });

        request.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(new Error("Request body must be valid JSON."));
            }
        });

        request.on("error", reject);
    });
}

function validateManifest(manifest) {
    if (!manifest || typeof manifest !== "object") {
        throw new Error("manifest is required.");
    }

    if (!manifest.name || typeof manifest.name !== "string") {
        throw new Error("manifest.name must be a string.");
    }

    if (!Array.isArray(manifest.channels)) {
        throw new Error("manifest.channels must be an array.");
    }

    const channelNames = new Set();

    for (const channel of manifest.channels) {
        if (!channel || typeof channel.name !== "string" || !channel.name) {
            throw new Error("Every channel needs a name.");
        }

        if (channelNames.has(channel.name)) {
            throw new Error(`Channel already exists: ${channel.name}`);
        }

        if (!["public", "host", "role", "player"].includes(channel.audience)) {
            throw new Error(`Unsupported channel audience: ${channel.name}`);
        }

        if (channel.audience === "role" && (!channel.role || typeof channel.role !== "string")) {
            throw new Error(`Role channels need a role: ${channel.name}`);
        }

        channelNames.add(channel.name);
    }
}

function publicSession(session) {
    return {
        id: session.id,
        joinCode: session.joinCode,
        game: session.manifest,
        state: session.state,
        participants: [...session.participants.values()].map(participant => ({
            id: participant.id,
            name: participant.name,
            role: participant.role
        }))
    };
}

function getChannel(session, channelName) {
    return session.manifest.channels.find(channel => channel.name === channelName);
}

function canAccessChannel(channel, participant) {
    if (channel.audience === "public") {
        return true;
    }

    if (channel.audience === "host") {
        return participant.isHost;
    }

    if (channel.audience === "role") {
        return participant.role === channel.role;
    }

    return channel.audience === "player";
}

function send(socket, message) {
    if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(message));
    }
}

function broadcast(session, message, audience) {
    for (const participant of session.participants.values()) {
        if (!participant.socket || !canAccessChannel(audience, participant)) {
            continue;
        }

        send(participant.socket, message);
    }
}

function sendToParticipant(session, participantId, message) {
    const participant = session.participants.get(participantId);

    if (participant && participant.socket) {
        send(participant.socket, message);
    }
}

function broadcastSnapshot(session) {
    for (const participant of session.participants.values()) {
        if (participant.socket) {
            send(participant.socket, {
                type: "state",
                state: session.state,
                participants: publicSession(session).participants
            });
        }
    }
}

function createSession(payload) {
    validateManifest(payload.manifest);

    const session = {
        id: createId(),
        joinCode: createJoinCode(),
        manifest: payload.manifest,
        state: payload.state === undefined ? {} : payload.state,
        hostToken: createId(24),
        participants: new Map()
    };

    sessions.set(session.id, session);
    return session;
}

function findSession(identifier) {
    return [...sessions.values()].find(session => session.id === identifier || session.joinCode === identifier.toUpperCase());
}

function handleCreateSession(request, response) {
    readJson(request)
        .then(payload => {
            const session = createSession(payload);
            json(response, 201, {
                sessionId: session.id,
                joinCode: session.joinCode,
                hostToken: session.hostToken,
                wsUrl: `/ws/${session.id}`
            });
        })
        .catch(error => json(response, 400, { error: error.message }));
}

function handleGetSession(identifier, response) {
    const session = findSession(identifier);

    if (!session) {
        json(response, 404, { error: "Session not found." });
        return;
    }

    json(response, 200, publicSession(session));
}

function handleJoinSession(identifier, request, response) {
    const session = findSession(identifier);

    if (!session) {
        json(response, 404, { error: "Session not found." });
        return;
    }

    readJson(request)
        .then(payload => {
            const token = createId(24);
            const participant = {
                id: createId(),
                token,
                name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim().slice(0, 80) : "Player",
                role: typeof payload.role === "string" && payload.role.trim() ? payload.role.trim().slice(0, 80) : "player",
                isHost: false,
                socket: null
            };

            session.participants.set(participant.id, participant);
            json(response, 201, {
                participantId: participant.id,
                token,
                wsUrl: `/ws/${session.id}`
            });
        })
        .catch(error => json(response, 400, { error: error.message }));
}

const httpServer = http.createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);

    if (request.method === "GET" && url.pathname === "/health") {
        json(response, 200, { status: "ok", sessions: sessions.size });
        return;
    }

    if (request.method === "POST" && url.pathname === "/api/sessions") {
        handleCreateSession(request, response);
        return;
    }

    if (request.method === "GET" && sessionMatch) {
        handleGetSession(decodeURIComponent(sessionMatch[1]), response);
        return;
    }

    const joinMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/participants$/);

    if (request.method === "POST" && joinMatch) {
        handleJoinSession(decodeURIComponent(joinMatch[1]), request, response);
        return;
    }

    json(response, 404, { error: "Route not found." });
});

const webSocketServer = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const match = url.pathname.match(/^\/ws\/([^/]+)$/);
    const session = match && findSession(decodeURIComponent(match[1]));
    const token = url.searchParams.get("token");

    if (!session || !token) {
        socket.destroy();
        return;
    }

    webSocketServer.handleUpgrade(request, socket, head, webSocket => {
        webSocket.session = session;
        webSocket.token = token;
        webSocketServer.emit("connection", webSocket);
    });
});

webSocketServer.on("connection", socket => {
    const session = socket.session;
    const isHost = socket.token === session.hostToken;
    const existingParticipant = [...session.participants.values()].find(participant => participant.token === socket.token);

    if (!isHost && !existingParticipant) {
        send(socket, { type: "error", error: "Invalid session token." });
        socket.close();
        return;
    }

    const participant = existingParticipant || {
        id: createId(),
        token: socket.token,
        name: isHost ? "Host" : "Player",
        role: isHost ? "host" : "player",
        isHost,
        socket: null
    };

    participant.socket = socket;
    session.participants.set(participant.id, participant);
    clientSessions.set(socket, session);

    send(socket, {
        type: "connected",
        participant: {
            id: participant.id,
            name: participant.name,
            role: participant.role,
            isHost: participant.isHost
        },
        game: session.manifest,
        state: session.state,
        participants: publicSession(session).participants
    });

    socket.on("message", rawMessage => {
        let message;

        try {
            message = JSON.parse(rawMessage.toString());
        } catch {
            send(socket, { type: "error", error: "Messages must be valid JSON." });
            return;
        }

        if (message.type === "identify") {
            if (typeof message.name === "string" && message.name.trim()) {
                participant.name = message.name.trim().slice(0, 80);
            }

            if (typeof message.role === "string" && message.role.trim()) {
                participant.role = message.role.trim().slice(0, 80);
            }

            broadcastSnapshot(session);
            return;
        }

        if (message.type === "state.replace") {
            if (!participant.isHost) {
                send(socket, { type: "error", error: "Only the host may replace session state." });
                return;
            }

            session.state = message.state === undefined ? {} : message.state;
            broadcastSnapshot(session);
            return;
        }

        if (message.type === "event") {
            const channel = getChannel(session, message.channel);

            if (!channel) {
                send(socket, { type: "error", error: "Unknown channel." });
                return;
            }

            if (!canAccessChannel(channel, participant)) {
                send(socket, { type: "error", error: "You cannot publish to this channel." });
                return;
            }

            const event = {
                type: "event",
                channel: channel.name,
                from: participant.id,
                payload: message.payload
            };

            if (channel.audience === "player") {
                if (typeof message.to !== "string" || !session.participants.has(message.to)) {
                    send(socket, { type: "error", error: "Player channels require a valid recipient." });
                    return;
                }

                sendToParticipant(session, message.to, event);
                send(socket, event);
                return;
            }

            broadcast(session, event, channel);
            return;
        }

        send(socket, { type: "error", error: "Unknown message type." });
    });

    socket.on("close", () => {
        if (participant.socket === socket) {
            participant.socket = null;
        }

        clientSessions.delete(socket);
        broadcastSnapshot(session);
    });
});

httpServer.listen(port, () => {
    console.log(`Session host listening on http://localhost:${port}`);
});
