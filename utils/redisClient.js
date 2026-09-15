const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

/**
 * Redis is optional. The CRM must continue to work even when a Redis
 * notification service has not been configured (for example on a free
 * production deployment).
 */
function createRedis() {
    if (!REDIS_URL) {
        console.log("[redis] REDIS_URL not configured - notifications disabled");
        return null;
    }

    const client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        lazyConnect: true,
        retryStrategy(times) {
            if (times > 3) return null;
            return Math.min(times * 500, 2000);
        }
    });

    client.on("error", (err) => {
        console.error("[redis] error:", err.message);
    });

    client.on("connect", () => {
        console.log("[redis] connect");
    });

    client.on("ready", () => {
        console.log("[redis] ready");
    });

    return client;
}

module.exports = { createRedis };