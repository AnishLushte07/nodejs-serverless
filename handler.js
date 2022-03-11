"use strict";
const { v4: uuidv4 } = require("uuid");

const redisClient = require("./lib/redis");

function generateUuid() {
  return uuidv4();
}

module.exports.test = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Working fine...",
        input: event,
      },
      null,
      2
    ),
  };
};

module.exports.invokeJob = async (event) => {
  const { moduleName, jobName } = event.pathParameters;
  const { payload, timeout } = JSON.parse(event.body);
  const invocationId = generateUuid();

  // set invocation id in redis
  await redisClient.set(`JOB_${invocationId}`, 1);

  // invoke job

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        invocationId: invocationId,
        attempt: 1,
      }
    ),
  };
}

module.exports.invokeJobWithId = async (event) => {
  const { moduleName, jobName, invocationId } = event.pathParameters;
  const { payload, timeout, forceRun = false } = JSON.parse(event.body);

  // check invocation id exists
  const data = await redisClient.get(`JOB_${invocationId}`);
  let attempt = 1;

  if (data) {
    if (!forceRun) {
      return {
        statusCode: 400,
        body: JSON.stringify(
          {
            invocationId,
            attempt: 0,
            message: "Job already triggered. Pass forceRun true for re-running job"
          }
        ),
      };
    } else {
      attempt = await redisClient.incr(`JOB_${invocationId}`);
    }
  }

  // invoke job

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        invocationId,
        attempt,
      }
    ),
  };
} 
