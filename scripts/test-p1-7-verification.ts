/**
 * @file test-p1-7-verification.ts
 * @description CLI Runner for P1.7 Integration, Regression & Concurrency Verification.
 */

import { runP17FullIntegrationAndRegressionSuite } from '../src/tests/p1_7_full_integration_regression_concurrency.test.js';

async function main() {
  try {
    const results = await runP17FullIntegrationAndRegressionSuite();
    if (results.failedScenarios > 0) {
      console.error(`❌ Verification failed with ${results.failedScenarios} failed scenario(s).`);
      process.exit(1);
    } else {
      console.log(`✅ All ${results.passedScenarios} P1.7 integration & concurrency scenarios passed perfectly!`);
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Fatal error running P1.7 test suite:', err);
    process.exit(1);
  }
}

main();
