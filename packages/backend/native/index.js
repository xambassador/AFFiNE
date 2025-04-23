/** @type {import('.')} */
let binding;
try {
  binding = require('./server-native.node');
} catch {
  binding =
    process.arch === 'arm64'
      ? require('./server-native.arm64.node')
      : process.arch === 'arm'
        ? require('./server-native.armv7.node')
        : require('./server-native.x64.node');
}

module.exports.mergeUpdatesInApplyWay = binding.mergeUpdatesInApplyWay;
module.exports.verifyChallengeResponse = binding.verifyChallengeResponse;
module.exports.mintChallengeResponse = binding.mintChallengeResponse;
module.exports.getMime = binding.getMime;
module.exports.Tokenizer = binding.Tokenizer;
module.exports.fromModelName = binding.fromModelName;
module.exports.htmlSanitize = binding.htmlSanitize;
module.exports.parseDoc = binding.parseDoc;
