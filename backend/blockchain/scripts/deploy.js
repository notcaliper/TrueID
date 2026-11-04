/**
 * Forwarding script to deploy TrueID smart contract suite
 */
const { main } = require('./deploy_suite');

if (require.main === module) {
  require('./deploy_suite');
}
