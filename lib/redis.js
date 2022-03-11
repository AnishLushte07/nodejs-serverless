const redis = require('redis');

const redisUrl = process.env.REDIS_URL;

let client;

(async () => {
    if (!client) {
        client = redis.createClient({
            url: redisUrl
        });
    
        client.on('error', (err) => console.log('Redis Client Error', err));
    
        await client.connect();

        console.log("connection...")
    }
})();

module.exports = client;
