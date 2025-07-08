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

const MongoClient = require('mongodb').MongoClient;

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
  // reconnectInterval: 10000, // wait for 10 seconds before retry
  // reconnectTries: Number.MAX_VALUE, // retry forever
};

const url = process.env.MONGO_URL;

let connection = null;

module.exports.connect = () => new Promise((resolve, reject) => {
  // noinspection JSIgnoredPromiseFromCall
  MongoClient.connect(url, options, function(err, mc) {
    if (err) {
      reject(err);
      return;
    }

    resolve(mc);
    connection = mc;
  });
});

module.exports.get = () => {
  if (!connection) {
    throw new Error('Call connect first!');
  }

  return connection;
};