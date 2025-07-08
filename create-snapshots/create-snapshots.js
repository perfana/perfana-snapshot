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

// noinspection UnnecessaryReturnStatementJS,JSUnresolvedReference

const { localPlaywrightPath, debugWorkerPool } = require('../config/default');

const mongoDbQueue = require('mongodb-queue');

const workerpool = require('workerpool');

const {
  getGrafanaInstance,
  updateSnapshot
} = require('../helpers/perfana-mongo');

const {
  checkSnapshot
} = require('./check-snapshot');

const {
  storeSnapshot
} = require('./store-snapshot');

const {
  grafanaApiGet
} = require('../helpers/grafana-api');

const dbPattern = new RegExp('mongodb:\/\/.*\/([^\?]+)\?.*');
const db = process.env.MONGO_URL.match(dbPattern)[1];

const playwrightPath = localPlaywrightPath !== undefined ? localPlaywrightPath : '/usr/src/app/perfana-snapshot/create-snapshots/playwright/grafana-snapshot-playwright.js';
const concurrentSnapshots = process.env.CONCURRENT_SNAPSHOTS ? parseInt(process.env.CONCURRENT_SNAPSHOTS) : 3;
let workerpoolOptions = {
  workerType: 'process',
  maxWorkers: concurrentSnapshots
};
if (process.env.MAX_QUEUE_SIZE) workerpoolOptions['maxQueueSize'] = process.env.MAX_QUEUE_SIZE;

const pool = workerpool.pool(playwrightPath, workerpoolOptions);

module.exports.pollSnapshotsQueues = (mc) => {

  const snapshotQueue = mongoDbQueue(mc.db(db), 'snapshotQueue', { visibility: 3600 });
  const snapshotWithChecksQueue = mongoDbQueue(mc.db(db), 'snapshotWithChecksQueue', { visibility: 3600 });

  setInterval(() => {

    if (pool.stats().activeTasks < concurrentSnapshots) {

      // console.log('Polling snapshot queues ...')

      snapshotWithChecksQueue.get((err, snapshotWithCheck) => {

        // IMPORTANT: The callback will not wait for a message if the queue is empty.  The message will be undefined if the queue is empty.
        if (snapshotWithCheck) {

          createSnapshot(snapshotWithCheck, snapshotWithChecksQueue, snapshotWithChecksQueue, snapshotQueue);

        } else {

          snapshotQueue.get((err, snapshot) => {

            if (snapshot) {

              createSnapshot(snapshot, snapshotQueue, snapshotWithChecksQueue, snapshotQueue);

            }

          });
        }
      });
    }
  }, 5000);
};

if (debugWorkerPool) {
  setInterval(() => {

    console.log(pool.stats());
  }, 2000);
}

const createSnapshot = (snapshotMessage, selectedQueue, snapshotWithChecksQueue, snapshotQueue) => {

  let snapshotRequest = snapshotMessage.payload;

  let status = snapshotRequest.status === 'NEW' ? 'IN_PROGRESS' : `IN_PROGRESS_${snapshotRequest.status}`;

  updateSnapshot(snapshotRequest._id, { status: status }).then((update) => {

    if (update.value) {

      getGrafanaInstance({
        label: snapshotRequest.grafana
      }).then((grafanaInstance) => {


        // get grafana version
        grafanaApiGet(grafanaInstance, '/api/health').then((healthResponse) => {

          let updatedSnapshotRequest = update.value;

          if (updatedSnapshotRequest.status.includes('RETRY')) {

            console.log(`${updatedSnapshotRequest.status} for ${updatedSnapshotRequest.dashboardUrl}`);
          }

          pool.exec('createSnapshot', [updatedSnapshotRequest.loginUrl, updatedSnapshotRequest.dashboardUrl, grafanaInstance.username, grafanaInstance.password, updatedSnapshotRequest.snapshotTimeout, healthResponse.version]).timeout(300000).then(function(snapshotUrl) {
            if (snapshotUrl.substring(0, 4) === 'http') {
              updatedSnapshotRequest.url = snapshotUrl;

              checkSnapshot(updatedSnapshotRequest).then((snapshotComplete) => {

                if (snapshotComplete) {
                  storeSnapshot(updatedSnapshotRequest, true).then(() => {
                    // ack message
                    selectedQueue.ack(snapshotMessage.ack, (err) => {
                      if (err) console.log(err);
                      return;
                    });


                  }).catch(function(err) {
                    console.log(err);
                  });
                } else {
                  console.log(`Snapshot for dashboard ${updatedSnapshotRequest.dashboardLabel} is incomplete: ${snapshotUrl}`);
                  if (updatedSnapshotRequest.status === 'IN_PROGRESS_RETRY-LAST') {
                    storeSnapshot(updatedSnapshotRequest, true, 'Incomplete snapshot', true).then(() => {
                      // ack message
                      selectedQueue.ack(snapshotMessage.ack, (err) => {
                        if (err) console.log(err);
                        return;

                      });
                    }).catch(function(err) {
                      console.log(err);
                    });
                  } else {
                    storeSnapshot(updatedSnapshotRequest, false, 'Incomplete snapshot').then((failedSnapshotRequest) => {

                      // ack message
                      selectedQueue.ack(snapshotMessage.ack, (err) => {
                        if (err) console.log(err);

                        if (failedSnapshotRequest) {
                          selectedQueue.add(failedSnapshotRequest, () => {
                            return;

                          });
                        } else {
                          return;
                        }

                      });


                    }).catch(function(err) {
                      console.log(err);
                    });
                  }
                }
              }).catch(function(err) {
                console.log(err);
              });

            } else {
              console.log(`Something is wrong with the snapshot url: ${snapshotUrl}`);
              storeSnapshot(updatedSnapshotRequest, false, snapshotUrl).then((failedSnapshotRequest) => {
                // ack message
                selectedQueue.ack(snapshotMessage.ack, (err) => {
                  if (err) console.log(err);
                  if (failedSnapshotRequest) {
                    selectedQueue.add(failedSnapshotRequest, () => {
                      return;

                    });
                  } else {
                    return;
                  }
                });
              }).catch(function(err) {
                console.log(err);
              });
            }
          })
            .catch(function(err) {
              console.log('######## something went wrong: ' + err);

              storeSnapshot(updatedSnapshotRequest, false, err.message).then((failedSnapshotRequest) => {
                // ack message
                selectedQueue.ack(snapshotMessage.ack, (err) => {
                  if (err) console.log(err);
                  if (failedSnapshotRequest) {
                    selectedQueue.add(failedSnapshotRequest, () => {
                      return;

                    });
                  } else {
                    return;
                  }
                });

              }).catch(function(err) {
                console.log(err);
              });

            })
            .then(function() {

              snapshotWithChecksQueue.inFlight((err, snapshotWithChecksQueueCount) => {

                snapshotQueue.inFlight((err, snapshotQueueCount) => {

                  if (snapshotWithChecksQueueCount + snapshotQueueCount <= 1 && pool.stats().pendingTasks === 0 && pool.stats().activeTasks === 0) {
                    try {
                      // noinspection JSIgnoredPromiseFromCall
                      pool.terminate();
                      console.log('######## terminated pool');
                    } catch (error) {
                      console.log('failed to terminate pool, err: ' + error);
                    }
                  }

                });

              });


            });

        }).catch(function(err) {
          console.log(err);
          storeSnapshot(snapshotRequest, false, err.message).then((failedSnapshotRequest) => {
            // ack message
            selectedQueue.ack(snapshotMessage.ack, (err) => {
              if (err) console.log(err);
              if (failedSnapshotRequest) {
                selectedQueue.add(failedSnapshotRequest, () => {
                  return;
                });
              } else {
                return;
              }
            });

          }).catch(function(err) {
            console.log(err);
          });

        });


      }).catch(function(err) {
        console.log(err);
        storeSnapshot(snapshotRequest, false, err.message).then((failedSnapshotRequest) => {
          // ack message
          selectedQueue.ack(snapshotMessage.ack, (err) => {
            if (err) console.log(err);
            if (failedSnapshotRequest) {
              selectedQueue.add(failedSnapshotRequest, () => {
                return;
              });
            } else {
              return;
            }
          });

          return;
        }).catch(function(err) {
          console.log(err);
        });

      });

    } else {

      selectedQueue.ack(snapshotMessage.ack, (err) => {
        if (err) console.log(err);
        return;
      });
    }

  });
};