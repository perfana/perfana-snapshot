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

// noinspection JSUnresolvedReference

const {
  getGrafanaInstance
} = require('../helpers/perfana-mongo');
const {
  grafanaApiGet
} = require('../helpers/grafana-api');


module.exports.checkSnapshot = (snapshot) => {


  return new Promise((resolve, reject) => {

    try {

      /* get snapshot */

      let snapshotKey;

      snapshotKey = snapshot.url.split('/').reverse()[0];

      getGrafanaInstance({
        label: snapshot.grafana
      }).then((grafanaInstance) => {


        grafanaApiGet(grafanaInstance, '/api/snapshots/' + snapshotKey).then((storedSnapshot) => {

          /* check if all graphs have snapshot data, otherwise create new snapshot */

          resolve(checkIfSnapshotIsComplete(storedSnapshot));

        }).catch((err) => {
          reject(err);
        });
      }).catch((err) => {
        reject(err);
      });

    } catch (error) {

      reject(error);
    }
  });
};

const checkIfSnapshotIsComplete = (snapshot) => {

  const numberOfPanels = snapshot.dashboard.panels.filter((panel) => {
    return panel.type !== 'row' && panel.type !== 'text';
  }).length;

  const numberOfSnapshotDataItems = snapshot.dashboard.panels.filter((panel) => {
    return panel.type !== 'row' && panel.type !== 'text' && panel.targets !== undefined;
  }).length;

  return numberOfPanels === numberOfSnapshotDataItems;
};
