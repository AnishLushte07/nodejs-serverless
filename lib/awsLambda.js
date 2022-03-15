"use strict";

const Lambda = require("aws-sdk/clients/lambda");

const lambda = new Lambda({
  apiVersion: "2015-03-31",
  endpoint: process.env.AWS_LAMBDA_ENDPOINT, //`lambda.${process.env.REGION}.amazonaws.com`
});

module.exports = lambda;
