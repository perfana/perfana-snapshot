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

const Random = require('meteor-random');

const mc = require('./mongoDb');

const path = require('path');
const fs = require('fs');

const dbPattern = new RegExp('\/([a-zA-Z0-9_]+)\\?');

if (!process.env.MONGO_URL) {
  console.error('MONGO_URL environment variable not set! Exiting application ...');
  process.exit(1);
}

const db = process.env.MONGO_URL.match(dbPattern)[1];

if (!db) {
  console.error('Database name could not be parsed from connection string! Exiting application ...');
  process.exit(1);
}


const getSnapshot = (id) => {

  return mc.get().db(db)
    .collection('snapshots')
    .findOne({ _id: id })
    .then(as => as)
    .catch(e => console.log(e));

};
module.exports.getSnapshot = getSnapshot;

module.exports.updateSnapshot = (id, modifier) => {

  return mc.get().db(db)
    .collection('snapshots')
    .findOneAndUpdate({
      _id: id
    }, {
      $set: modifier
    }, {
      returnOriginal: false
    })
    .then(as => as)
    .catch(e => console.log(e));
};

module.exports.getNewSnapshots = () => {

  return mc.get().db(db)
    .collection('snapshots')
    .find({
      $or: [
        { status: 'NEW' },
        { status: 'IN_PROGRESS' }
      ]
    })
    .toArray()
    .then(as => as)
    .catch(e => console.log(e));
};


module.exports.getGrafanaInstances = () => {

  return mc.get().db(db)
    .collection('grafanas')
    .find({})
    .toArray()
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.upsertGrafanaInstance = (grafana) => {

  return mc.get().db(db)
    .collection('grafanas')
    .findOneAndUpdate({
      _id: grafana._id
    }, {
      $set: grafana
    }, {
      upsert: true,
      returnOriginal: false
    })
    .then(as => as)
    .catch(e => console.log(e));
};

module.exports.getGrafanaInstance = (query) => {

  return mc.get().db(db)
    .collection('grafanas')
    .findOne(query)
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.getGrafanaDashboardsForGrafanaInstance = (grafanaInstanceLabel) => {

  return mc.get().db(db)
    .collection('grafanaDashboards')
    .find({
      grafana: grafanaInstanceLabel
    })
    .toArray()
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.getApplicationDashboardsByUid = (uid) => {

  return mc.get().db(db)
    .collection('applicationDashboards')
    .find({
      dashboardUid: uid
    })
    .toArray()
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.getApplicationDashboardsByTemplateDashboardUid = (templateDashboardUid) => {

  return mc.get().db(db)
    .collection('applicationDashboards')
    .find({
      templateDashboardUid: templateDashboardUid
    })
    .toArray()
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.getApplicationDashboardsForSystemUnderTest = (testRun, grafanaDashboard) => {

  // const dashboardUidRegex = new RegExp(grafanaDashboard.uid.replace('template', testRun.application.toLowerCase().replace(/ /g, '-')), 'i');
  const dashboardUidRegex = new RegExp((testRun.application.toLowerCase().replace(/ /g, '-') + '-' + grafanaDashboard.name.toLowerCase().replace(/ /g, '-')).substring(0, 39), 'i');

  return mc.get().db(db)
    .collection('applicationDashboards')
    .find({
      $and: [{
        grafana: grafanaDashboard.grafana
      },
        {
          dashboardUid: {
            $regex: dashboardUidRegex
          }
        },
        {
          application: testRun.application
        },
        {
          testEnvironment: testRun.testEnvironment
        }
      ]
    })
    .toArray()
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.getBenchmarkForApplicationDashboard = (applicationDashboard, genericCheckId) => {
  return mc.get().db(db)
    .collection('benchmarks')
    .findOne({
      $and: [
        {
          genericCheckId: genericCheckId
        },
        {
          application: applicationDashboard.application
        },
        {
          testEnvironment: applicationDashboard.testEnvironment
        }
      ]
    })
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.getReportPanelForApplicationDashboard = (applicationDashboard, genericReportPanelId) => {
  return mc.get().db(db)
    .collection('reportPanels')
    .findOne({
      $and: [
        {
          genericReportPanelId: genericReportPanelId
        },
        {
          application: applicationDashboard.application
        },
        {
          testEnvironment: applicationDashboard.testEnvironment
        }
      ]
    })
    .then(as => as)
    .catch(e => console.log(e));

};


module.exports.getGrafanaDashboardByUid = (grafanaLabel, uid) => {

  return mc.get().db(db)
    .collection('grafanaDashboards')
    .findOne({
      $and: [{
        grafana: grafanaLabel
      },
        {
          uid: uid
        }
      ]
    })
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.insertBenchmarkBasedOnGenericCheck = (genericCheck, testRun, applicationDashboardFromTemplate) => {

  return mc.get().db(db)
    .collection('benchmarks')
    .insertOne({
      _id: Random.secret(),
      application: testRun.application,
      testEnvironment: testRun.testEnvironment,
      testType: testRun.testType,
      grafana: applicationDashboardFromTemplate.grafana,
      dashboardLabel: applicationDashboardFromTemplate.dashboardLabel,
      dashboardId: applicationDashboardFromTemplate.dashboardId,
      dashboardUid: applicationDashboardFromTemplate.dashboardUid,
      panel: genericCheck.panel,
      genericCheckId: genericCheck.checkId
    })
    .then(as => as)
    .catch(e => console.log(e));
};

module.exports.insertReportPanelBasedOnGenericReportPanel = (genericReportPanel, testRun, applicationDashboardFromTemplate) => {

  return mc.get().db(db)
    .collection('reportPanels')
    .insertOne({
      _id: Random.secret(),
      application: testRun.application,
      testEnvironment: testRun.testEnvironment,
      testType: testRun.testType,
      grafana: applicationDashboardFromTemplate.grafana,
      dashboardLabel: applicationDashboardFromTemplate.dashboardLabel,
      dashboardId: applicationDashboardFromTemplate.dashboardId,
      dashboardUid: applicationDashboardFromTemplate.dashboardUid,
      panel: genericReportPanel.panel,
      index: genericReportPanel.index,
      genericReportPanelId: genericReportPanel.reportPanelId
    })
    .then(as => as)
    .catch(e => console.log(e));
};

module.exports.getBenchmarksByUid = (uid) => {

  return mc.get().db(db)
    .collection('benchmarks')
    .find({
      dashboardUid: uid
    })
    .toArray()
    .then(as => as)
    .catch(e => console.log(e));

};


module.exports.updateBenchmark = (benchmark) => {

  return mc.get().db(db)
    .collection('benchmarks')
    .updateOne({
      _id: benchmark._id
    }, {
      $set: benchmark
    })
    .then(as => as)
    .catch(e => console.log(e));
};

module.exports.upsertGrafanaDashboard = (grafanaDashboard) => {

  return mc.get().db(db)
    .collection('grafanaDashboards')
    .findOneAndUpdate({
      $and: [
        {
          grafana: grafanaDashboard.grafana
        },
        {
          uid: grafanaDashboard.uid
        }
      ]
    }, {
      $set: grafanaDashboard
    }, {
      upsert: true,
      returnOriginal: false
    })
    .then(as => as)
    .catch(e => console.log(e));
};

module.exports.updateApplicationDashboard = (applicationDashboard, grafanaDashboard) => {

  return mc.get().db(db)
    .collection('applicationDashboards')
    .updateOne({
      _id: applicationDashboard._id
    }, {
      $set: {
        dashboardName: grafanaDashboard.name
      }
    })
    .then(as => as)
    .catch(e => console.log(e));
};

module.exports.insertApplicationDashboard = (applicationDashboard) => {

  return mc.get().db(db)
    .collection('applicationDashboards')
    .insertOne(
      applicationDashboard
    )
    .then(as => as)
    .catch(e => console.log(e));
};

module.exports.updateApplicationDashboardVariables = (applicationDashboard) => {

  return mc.get().db(db)
    .collection('applicationDashboards')
    .findOneAndUpdate({
      $and: [
        {
          grafana: applicationDashboard.grafana
        },
        {
          dashboardUid: applicationDashboard.dashboardUid
        },
        {
          dashboardLabel: applicationDashboard.dashboardlabel
        }
      ]
    }, {
      $set: {
        variables: applicationDashboard.variables
      }
    })
    .then(as => as)
    .catch(e => console.log(e));
};

module.exports.insertGrafanaPerfanaSyncEvent = (grafanaInstance, grafanaDashboard, event, description, stackTrace) => {

  let eventObject = {
    timestamp: new Date(),
    event: event,
    grafana: grafanaInstance.label,
    name: grafanaDashboard.name,
    uid: grafanaDashboard.uid,
    message: description,
    stackTrace: stackTrace ? stackTrace : undefined
  };

  return mc.get().db(db)
    .collection('grafanaPerfanaSyncEvents')
    .insertOne(
      eventObject
    )
    .then(as => as)
    .catch(e => console.log(e));
};

module.exports.insertAutoConfigGrafanaDashboard = (autoConfigGrafanaDashboard) => {

  return mc.get().db(db)
    .collection('autoConfigGrafanaDashboards')
    .insertOne(
      autoConfigGrafanaDashboard
    )
    .then(as => as)
    .catch(e => console.log(e));
};

module.exports.storeTemplatingValue = (grafana, dashboardUid, variableName, variableValue) => {

  return mc.get().db(db)
    .collection('grafanaDashboardsTemplatingValues')
    .updateOne({
      $and: [{
        grafana: grafana
      },
        {
          dashboardUid: dashboardUid
        },
        {
          variableName: variableName
        },
        {
          variableValue: variableValue
        }
      ]
    }, {
      $set: {
        updated: new Date()
      }
    }, {
      upsert: true
    })
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.updateVersion = () => {

  const version = fs.readFileSync(path.resolve(__dirname, '../version.txt'), 'utf8');

  return mc.get().db(db)
    .collection('versions')
    .findOneAndUpdate({
        component: 'perfana-snapshot'
      },
      {
        $set: {
          version: version
        }
      }, {
        upsert: true,
        returnOriginal: false
      }
    )
    .then(as => as)
    .catch(e => console.log(e));
};

module.exports.getRecentTestRuns = (lastSyncTimestamp) => {

  return mc.get().db(db)
    .collection('testRuns')
    .find({
      $and: [
        {
          end: {
            $gte: new Date(lastSyncTimestamp)
          }
        }, {
          tags: {
            $exists: true
          }
        }
      ]
    })
    .toArray()
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.getAutoconfigDashboards = () => {

  return mc.get().db(db)
    .collection('autoConfigGrafanaDashboards')
    .find({})
    .toArray()
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.getGenericChecks = () => {

  return mc.get().db(db)
    .collection('genericChecks')
    .find({})
    .toArray()
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.getProfiles = () => {

  return mc.get().db(db)
    .collection('profiles')
    .find({})
    .toArray()
    .then(as => as)
    .catch(e => console.log(e));

};

module.exports.getGenericReportPanels = () => {

  return mc.get().db(db)
    .collection('genericReportPanels')
    .find({})
    .toArray()
    .then(as => as)
    .catch(e => console.log(e));

};