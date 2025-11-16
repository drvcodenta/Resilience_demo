const { createHandler } = require('@app-core/server');
const parseInstruction = require('@app/services/payment-processor/parse-instruction');

module.exports = createHandler({
  path: '/payment-instructions',
  method: 'post',
  middlewares: [],
  async handler(rc, helpers) {
    const payload = rc.body;

    const result = await parseInstruction(payload);

    // Return HTTP 200 for success and pending
    // Return HTTP 400 for failed transactions
    const statusCode =
      result.status === 'failed'
        ? helpers.http_statuses.HTTP_400_BAD_REQUEST
        : helpers.http_statuses.HTTP_200_OK;

    return {
      status: statusCode,
      data: result,
    };
  },
});
