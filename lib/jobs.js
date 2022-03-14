const lambdaFunctions = {
    testModule: {
      testJob: `aws-python-project-${process.env.stage}-testJobLambda`
    }
}

module.exports.getLambdaFunctionForJob = (moduleName, jobName) => {
    return lambdaFunctions[moduleName][jobName];
}
