"use strict";

const redisClient = require("../lib/redis");
const { getLambdaFunctionForJob } = require("../lib/jobs");
const lambda = require("../lib/awsLambda");

module.exports.index = async (event) => {
  const { moduleName, jobName, invocationId } = event.pathParameters;
  const { payload, timeout, forceRun = false } = JSON.parse(event.body);

  const lambdaFunctionName = getLambdaFunctionForJob(moduleName, jobName);

  if (!lambdaFunctionName) {
    return {
      statusCode: 400,
      body: "Lambda fucntion for job does not exists",
    };
  }

  const jobKey = `JOB_${invocationId}`;
  const data = JSON.parse(await redisClient.get(jobKey));
  let attempt = 1;

  if (data) {
    if (!forceRun) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          invocationId,
          attempt: 0,
          message:
            "Job already triggered. Pass forceRun true for re-running job",
        }),
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
      attempt,
      jobKey,
    }),
  };
};
