import mongoose from 'mongoose'
import dns from 'dns'

// Force Google DNS for MongoDB Atlas resolution (bypasses ISP DNS issues)
dns.setServers(['8.8.8.8', '8.8.4.4'])

// MONGODB_URI is checked inside connectDB to avoid build-time errors when env vars are missing

interface Cached {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: Cached | undefined
}

let cached: Cached = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable')
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      family: 4, // Force IPv4 to avoid resolution issues
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('MongoDB connected successfully')
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB
