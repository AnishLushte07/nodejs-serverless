"use strict";
const aws = require("aws-sdk");

// const redisClient = require("./lib/redis");
const { generateUuid } = require("./lib/utils");
const { getLambdaFunctionForJob } = require("./lib/jobs")

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const lambda = new aws.Lambda({
  // region: "us-east-1",
  apiVersion: '2015-03-31',
  endpoint: process.env.AWS_LAMBDA_ENDPOINT //`lambda.${process.env.REGION}.amazonaws.com`
});

module.exports.health = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Healthy",
        input: event,
      },
      null,
      2
    ),
  };
};

module.exports.invokeJob = async (event) => {
  const { moduleName, jobName } = event.pathParameters;
  const body = JSON.parse(event.body);
  const { payload, timeout } = body;

  const lambdaFunctionName = getLambdaFunctionForJob(moduleName, jobName);
  const invocationId = generateUuid();

  const jobKey = `JOB_${invocationId}`;
  const value = JSON.stringify({
    status: "PENDING",
    createdOn: new Date(),
    attempt: 1,
    invocationId,
    payload,
  });

  // invoke job with payload and job key
  const lambdaPayload = {
    payload,
    jobKey,
    invocationId,
  };

  const result = await lambda
    .invoke({
      FunctionName: lambdaFunctionName,
      InvocationType: "Event",
      Payload: JSON.stringify(lambdaPayload)
    })
    .promise();

  // set invocation id in redis
  // await redisClient.set(jobKey, value);

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        invocationId: invocationId,
        lambdaPayload,
        attempt: 1,
      }
    ),
  };
}

module.exports.invokeJobWithId = async (event) => {
  const { moduleName, jobName, invocationId } = event.pathParameters;
  const { payload, timeout, forceRun = false } = JSON.parse(event.body);

  // check invocation id exists
  const jobKey = `JOB_${invocationId}`;
  const data = undefined; //JSON.parse(await redisClient.get(jobKey));
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
      attempt = data.attempt + 1;
    }
  }

  const value = JSON.stringify({
    status: "PENDING",
    createdOn: new Date(),
    attempt,
    invocationId,
    payload,
  });
  
  const lambdaPayload = {
    payload,
    jobKey,
    invocationId,
  };

  const lambdaFunctionName = getLambdaFunctionForJob(moduleName, jobName);

  const result = await lambda
    .invoke({
      FunctionName: lambdaFunctionName,
      InvocationType: "Event",
      Payload: JSON.stringify(lambdaPayload)
    })
    .promise();

  // set invocation id in redis
  // await redisClient.set(jobKey, value);


  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        invocationId,
        attempt,
        jobKey,
      }
    ),
  };
} 
