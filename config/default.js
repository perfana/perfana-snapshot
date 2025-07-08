/**
 * Copyright 2025 Perfana Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = {
  localPlaywrightPath: process.env.hasOwnProperty('LOCAL_PLAYWRIGHT_PATH') ? process.env.LOCAL_PLAYWRIGHT_PATH : undefined,
  snapshotMaxRetries: process.env.hasOwnProperty('SNAPSHOT_MAX_RETRIES') ? process.env.SNAPSHOT_MAX_RETRIES : 3,
  snapshotWaitBetweenRetries: process.env.hasOwnProperty('SNAPSHOT_WAIT_BETWEEN_RETRIES') ? process.env.SNAPSHOT_WAIT_BETWEEN_RETRIES : 10000,
  snapshotTimeOutIncrease: process.env.hasOwnProperty('SNAPSHOT_TIMEOUT_INCREASE') ? process.env.SNAPSHOT_TIMEOUT_INCREASE : 5,
  snapshotQueueDelay: process.env.hasOwnProperty('SNAPSHOT_QUEUE_DELAY') ? process.env.SNAPSHOT_QUEUE_DELAY : 5000,
  debugWorkerPool: process.env.hasOwnProperty('DEBUG_WORKER_POOL') ? process.env.DEBUG_WORKER_POOL : false
};
