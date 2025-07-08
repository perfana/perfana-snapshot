# Copyright 2025 Perfana Contributors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM zenika/alpine-chrome:with-node

USER root

# Install build dependencies
RUN apk add --no-cache make gcc g++ bash && \
    apk upgrade --no-cache

# Create chrome user (UID 1001) and app folder
RUN if ! getent group chrome > /dev/null; then addgroup -S chrome; fi &&     if ! getent passwd chrome > /dev/null; then adduser -S -u 1001 -G chrome chrome; fi &&     mkdir -p /usr/src/app &&     chown -R chrome:chrome /usr/src/app

USER chrome

WORKDIR /usr/src/app

# Optional: create subfolder like in original
RUN mkdir perfana-snapshot

WORKDIR /usr/src/app/perfana-snapshot

# Copy package files first
COPY --chown=chrome:chrome package.json package-lock.json ./

USER root
RUN npm install --loglevel=error && npm cache clean --force && npm uninstall -g npm
USER chrome

# Copy app code
COPY --chown=chrome:chrome . ./

# Make scripts executable
USER root
RUN chmod +x /usr/src/app/perfana-snapshot/entrypoint.sh && \
    chmod +x /usr/src/app/perfana-snapshot/startup.sh
USER chrome

# Playwright/Chromium paths
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

ENTRYPOINT ["/usr/src/app/perfana-snapshot/entrypoint.sh"]
CMD ["tini", "--", "node", "index.js"]
