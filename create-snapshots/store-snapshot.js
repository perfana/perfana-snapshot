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

// noinspection RegExpRedundantEscape

const { snapshotMaxRetries, snapshotTimeOutIncrease } = require('../config/default');

const {
  getGrafanaInstance,
  updateSnapshot
} = require('../helpers/perfana-mongo');
const {
  grafanaApiGet,
  grafanaApiPost
} = require('../helpers/grafana-api');


module.exports.storeSnapshot = (snapshot, created, error, incomplete) => {


  return new Promise((resolve, reject) => {

    try {
      if (created === true || incomplete === true) {


        let snapshotKey;

        snapshotKey = snapshot.url.split('/').reverse()[0];

        getGrafanaInstance({
          label: snapshot.grafana
        }).then((grafanaInstance) => {


          grafanaApiGet(grafanaInstance, '/api/snapshots/' + snapshotKey).then((storedSnapshot) => {


            /*  set expires from settings */

            const snapshotWithExpires = {
              name: storedSnapshot.dashboard.title,
              dashboard: storedSnapshot.dashboard,
              expires: snapshot.expires
            };

            // if grafana snapshot instance has been specified, use it
            getGrafanaInstance({
              snapshotInstance: true
            }).then((grafanaSnapshotInstance) => {

              let grafana = grafanaSnapshotInstance ? grafanaSnapshotInstance : grafanaInstance;

              grafanaApiPost(grafana, '/api/snapshots/', snapshotWithExpires).then((snaphotResponse) => {


                grafanaApiGet(grafana, '/api/snapshots/' + snaphotResponse.key).then((storedSnapshotResponse) => {


                  const modifier = {
                    application: snapshot.application,
                    testEnvironment: snapshot.testEnvironment,
                    testType: snapshot.testType,
                    testRunId: snapshot.testRunId,
                    url: snaphotResponse.url,
                    snapshotKey: snaphotResponse.key,
                    deleteUrl: snaphotResponse.deleteUrl,
                    grafana: grafana.label,
                    schemaVersion: storedSnapshotResponse.dashboard.schemaVersion,
                    dashboardUid: snapshot.dashboardUid,
                    dashboardLabel: snapshot.dashboardLabel,
                    status: incomplete ? 'ERROR' : 'COMPLETE',
                    error: incomplete ? error : undefined
                  };

                  updateSnapshot(snapshot._id, modifier).then(() => {

                    console.log(`Snapshot for dashboard ${modifier.dashboardLabel} is complete: ${modifier.url}, stored it!`);

                    // console.log('############ resolve pass: ', JSON.stringify(modifier))
                    resolve();
                  });

                }).catch((err) => {
                  reject(err);
                });
              }).catch((err) => {
                reject(err);
              });
            });
          }).catch((err) => {
            reject(err);
          });
        });
      } else { // something went wrong creating the snapshot


        if (snapshotMaxRetries > 0) {

          // increase retry number and retry

          let retryNumber = snapshot.status === 'IN_PROGRESS' ? 0 : parseInt(snapshot.status.replace('IN_PROGRESS_RETRY-', ''));

          if (snapshot.status !== 'IN_PROGRESS_RETRY-LAST' && parseInt(retryNumber + 1) <= parseInt(snapshotMaxRetries)) {

            let status = (parseInt(snapshotMaxRetries) === parseInt(retryNumber + 1)) ? 'RETRY-LAST' : 'RETRY-' + parseInt(retryNumber + 1);

            // increase time out
            let snapshotTimeout = snapshot.snapshotTimeout + snapshotTimeOutIncrease;

            const modifier = {
              application: snapshot.application,
              testEnvironment: snapshot.testEnvironment,
              testType: snapshot.testType,
              testRunId: snapshot.testRunId,
              status: status,
              snapshotTimeout: snapshotTimeout
            };

            updateSnapshot(snapshot._id, modifier).then((update) => {

              resolve(update.value);
            });

          } else {

            const modifier = {
              application: snapshot.application,
              testEnvironment: snapshot.testEnvironment,
              testType: snapshot.testType,
              testRunId: snapshot.testRunId,
              status: 'ERROR',
              error: error && typeof error === 'string' ? error.replace(/\"/g, '').split('============================================================')[0] : undefined
            };


            updateSnapshot(snapshot._id, modifier).then(() => {

              // console.log('############ resolve fail: ', JSON.stringify(modifier))

              resolve();
            });

          }

        } else {

          const modifier = {
            application: snapshot.application,
            testEnvironment: snapshot.testEnvironment,
            testType: snapshot.testType,
            testRunId: snapshot.testRunId,
            status: 'ERROR',
            error: error && typeof error === 'string' ? error.replace(/\"/g, '').split('============================================================')[0] : undefined
          };

          updateSnapshot(snapshot._id, modifier).then(() => {

            // console.log('############ resolve fail: ', JSON.stringify(modifier))

            resolve();
          });

        }

      }
    } catch (error) {

      reject(error);
    }
  });
};


