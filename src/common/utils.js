const { RESULT_STATUS } = require("../shared/constants");


// Generate response object
const generateResponse = (isSuccess, message, data) => {
  return {
    status: isSuccess ? RESULT_STATUS.SUCCESS : RESULT_STATUS.ERROR,
    message,
    data,
  };
};

module.exports = { generateResponse };
