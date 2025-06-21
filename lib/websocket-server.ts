// WebSocket server implementation for real-time updates
// In a production environment, this would be a separate server or use Next.js API routes with Socket.IO

import { Server as SocketIOServer } from "socket.io"

let io: SocketIOServer

export function initializeWebSocket(server: any) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    socket.on("join_disaster", (disasterId) => {
      socket.join(`disaster_${disasterId}`)
      console.log(`Client ${socket.id} joined disaster room: ${disasterId}`)
    })

    socket.on("leave_disaster", (disasterId) => {
      socket.leave(`disaster_${disasterId}`)
      console.log(`Client ${socket.id} left disaster room: ${disasterId}`)
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)
    })
  })

  return io
}

export function getSocketIO() {
  return io
}

// Utility functions to emit events
export function emitDisasterUpdate(disasterId: string, data: any) {
  if (io) {
    io.to(`disaster_${disasterId}`).emit("disaster_updated", data)
    console.log(`Emitted disaster_updated for disaster ${disasterId}`)
  }
}

export function emitSocialMediaUpdate(disasterId: string, data: any) {
  if (io) {
    io.to(`disaster_${disasterId}`).emit("social_media_updated", data)
    console.log(`Emitted social_media_updated for disaster ${disasterId}`)
  }
}

export function emitResourcesUpdate(disasterId: string, data: any) {
  if (io) {
    io.to(`disaster_${disasterId}`).emit("resources_updated", data)
    console.log(`Emitted resources_updated for disaster ${disasterId}`)
  }
}
