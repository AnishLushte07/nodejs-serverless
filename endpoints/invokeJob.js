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

  if (!lambdaFunctionName) {
    return {
      statusCode: 400,
      body: "Lambda fucntion for job does not exists",
    };
  }

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

  await redisClient.set(jobKey, value);

  await lambda
    .invoke({
      FunctionName: lambdaFunctionName,
      InvocationType: "Event",
      Payload: JSON.stringify(lambdaPayload),
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({
      invocationId,
      jobKey,
      attempt: 1,
    }),
  };
};
