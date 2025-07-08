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

'use strict';

const workerpool = require('workerpool');
const playwright = require('playwright');

const createSnapshot = async (loginUrl, dashboardUrl, username, password, snapshotTimeout, grafanaVersion) => {

  const playwrightBrowser = process.env.hasOwnProperty('PW_BROWSER') ? process.env.PW_BROWSER : 'chromium';
  const checkForSpinners = process.env.hasOwnProperty('PW_CHECK_SPINNERS') ? process.env.PW_CHECK_SPINNERS : false;
  const wait = process.env.hasOwnProperty('PW_WAIT') ? process.env.PW_WAIT : undefined;

  const browser = await playwright[playwrightBrowser].launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    headless: true,
    args: [
      '--window-size=3840,2160',
      '--disable-dev-shm-usage'
    ]
  });

  console.log(`Creating snapshot from ${dashboardUrl}, Grafana version: ${grafanaVersion}, snapshotTimeout: ${snapshotTimeout}`);

  const context = await browser.newContext({ viewport: null });

  // Open new page
  const page = await context.newPage();

  const timeout = snapshotTimeout ? (snapshotTimeout * 1000) + 5000 : 60000;

  await page.setDefaultTimeout(timeout);


  // Go to http://localhost:3000/login
  // await page.goto(loginUrl, {waitUntil: 'networkidle'});


  // Set basic auth headers
  const auth_header = 'Basic ' + new Buffer.from(`${username}:${password}`).toString('base64');
  await page.setExtraHTTPHeaders({ 'Authorization': auth_header });


  try {

    let lastPanel;

    // Go to dashboard url
    await page.goto(dashboardUrl, { waitUntil: 'networkidle' });

    // console.log(`Zoom to 10%`)

    await page.evaluate(() => {
      document.body.style.zoom = 0.1;
    });

    await page.waitForLoadState('load');

    if (checkForSpinners) await page.waitForSelector('.panel-loading__spinner', { state: 'detached' });


    await page.waitForSelector('[class*=panel-header]');


    lastPanel = await page.$$('[class*=panel-header]');

    console.log(`Found ${lastPanel.length} panels in ${dashboardUrl}`);

    // console.log(`Zoom back to 100%`)

    await page.evaluate(() => {
      document.body.style.zoom = 1.0;
    });


    if (checkForSpinners) await page.waitForSelector('.panel-loading__spinner', { state: 'detached' });

    // wait for 1 second
    if (wait) await page.waitForTimeout(parseInt(wait));

    // Click react-container div div div >> :nth-match(button, 4)
    await page.click('[data-testid="data-testid Share dashboard"]');

    // Click [aria-label="Tab Snapshot"]
    await page.click('[data-testid="data-testid Tab Snapshot"]');

    // Click 1 Hour
    await page.click('#option-3600-expire-select-input');

    // Click publish snapshot
    await page.click('[data-testid="data-testid publish snapshot button"]');

    // Click button:has-text("Local Snapshot")

    let snapshotUrl;

    snapshotUrl = await page.getAttribute('input#snapshot-url-input', 'value');
    console.log(snapshotUrl);
    return snapshotUrl;


  } catch (e) {

    console.log(e);
    throw e;


  } finally {

    console.log('close browser');
    await context.close();
    await browser.close();

  }


};

workerpool.worker({
  createSnapshot: createSnapshot
});


