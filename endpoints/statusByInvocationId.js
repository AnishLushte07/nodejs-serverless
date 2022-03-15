const redisClient = require("../lib/redis");

module.exports.index = async (event) => {
    const { moduleName, jobName, invocationId } = event.pathParameters;
    const jobKey = `JOB_${invocationId}`;
    const data = JSON.parse(await redisClient.get(jobKey));

    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                moduleName,
                jobName,
                invocationId,
                data
            }
        ),
    };
};