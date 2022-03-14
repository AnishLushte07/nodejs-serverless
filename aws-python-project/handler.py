import json
import redis
import json
import datetime


r = redis.Redis(
    host='127.0.0.1',
    port=6379, 
)

def hello(event, context):
    body = {
        "message": "Pyhton l=ambda",
        "input": event,
    }

    payload = event.get("payload")
    jobKey = event.get("jobKey")
    invocationId = event.get("invocationId")

    data = r.get(jobKey)

    parseData = json.loads(data)
    parseData["completedOn"] = datetime.datetime.now().isoformat()
    parseData["response"] = { "success": True }
    parseData["status"] = "COMPLETED"

    redisData = json.dumps(parseData)

    r.set(jobKey, redisData)

    return {"statusCode": 200 }
