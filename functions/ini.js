const os = require('os');
const process = require('process');

exports.handler = async (event, context) => {
  const phpInfo = {
    platform: process.platform,
    architecture: process.arch,
    node_version: process.version,
    os: {
      type: os.type(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    },
    environment: process.env,
  };

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Node.js Environment Info',
      phpInfo: phpInfo,
    }),
  };
};
