"use strict";

const redisClient = require("../lib/redis");
const { generateUuid } = require("../lib/utils");
const { getLambdaFunctionForJob } = require("../lib/jobs");
const lambda = require("../lib/awsLambda");

module.exports.index = async (event) => {
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
      Payload: JSON.stringify(lambdaPayload),
    })
    .promise();

  // set invocation id in redis
  await redisClient.set(jobKey, value);

  return {
    statusCode: 200,
    body: JSON.stringify({
      invocationId: invocationId,
      lambdaPayload,
      attempt: 1,
      result,
    }),
  };
};
