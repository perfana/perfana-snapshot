# perfana-snapshot

A service for creating and managing Grafana dashboard snapshots using Playwright automation.

## Overview

Perfana-snapshot is a Node.js application that automates the creation of Grafana dashboard snapshots. It uses a MongoDB queue system to manage snapshot requests and leverages Playwright for browser automation to create Grafana dashboard snapshots.

## Features

- **Queue-based Processing**: Uses MongoDB queues to manage snapshot creation requests
- **Playwright Integration**: Automated browser interactions for snapshot creation
- **Retry Logic**: Built-in retry mechanism for failed snapshots
- **Concurrent Processing**: Configurable worker pool for parallel snapshot creation
- **Health Monitoring**: Tracks snapshot completion and handles failures

## Architecture

The application consists of several key components:

- **Queue Polling**: Monitors MongoDB queues for new snapshot requests
- **Snapshot Creation**: Uses Playwright to automate Grafana dashboard interactions
- **Storage Management**: Handles snapshot storage and metadata updates
- **Worker Pool**: Manages concurrent snapshot processing with configurable limits

## Prerequisites

- Node.js
- MongoDB (with replica set configuration)
- Grafana instance(s) to snapshot
- Chrome/Chromium browser (for Playwright)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd perfana-snapshot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (see Configuration section)

## Configuration

### Environment Variables

- `MONGO_URL`: MongoDB connection string (required)
- `CONCURRENT_SNAPSHOTS`: Number of concurrent snapshot workers (default: 3)
- `MAX_QUEUE_SIZE`: Maximum queue size for worker pool
- `LOCAL_PLAYWRIGHT_PATH`: Local path to Playwright script (for development)
- `SNAPSHOT_MAX_RETRIES`: Maximum retry attempts for failed snapshots (default: 3)
- `SNAPSHOT_WAIT_BETWEEN_RETRIES`: Wait time between retries in milliseconds (default: 10000)
- `SNAPSHOT_TIMEOUT_INCREASE`: Timeout increase factor for retries (default: 5)
- `SNAPSHOT_QUEUE_DELAY`: Queue polling delay in milliseconds (default: 5000)
- `DEBUG_WORKER_POOL`: Enable worker pool debugging (default: false)

### MongoDB Configuration

The application requires a MongoDB replica set with the following collections:
- `snapshotQueue`: Main queue for snapshot requests
- `snapshotWithChecksQueue`: Queue for snapshots requiring validation

## Usage

### Running the Application

```bash
npm start
```

### Docker Deployment

Build and run using Docker:

```bash
docker build -t perfana-snapshot .
docker run -d \
  -e MONGO_URL=mongodb://mongo1:27011,mongo2:27012,mongo3:27013/perfana?replicaSet=rs0 \
  -e CONCURRENT_SNAPSHOTS=3 \
  perfana-snapshot
```

### Development Mode

For development with custom Playwright path:

```bash
LOCAL_PLAYWRIGHT_PATH=/path/to/local/playwright/script npm start
```

## Queue Message Format

Snapshot requests should be added to the MongoDB queue with the following structure:

```javascript
{
  _id: ObjectId,
  dashboardUrl: "https://grafana.example.com/d/dashboard-id",
  loginUrl: "https://grafana.example.com/login",
  grafana: "grafana-instance-label",
  snapshotTimeout: 30000,
  status: "NEW",
  dashboardLabel: "Dashboard Name"
}
```

## Process Flow

1. **Queue Monitoring**: Application polls MongoDB queues every 5 seconds
2. **Request Processing**: Available workers pick up snapshot requests
3. **Grafana Authentication**: Automated login to Grafana instance
4. **Snapshot Creation**: Navigate to dashboard and create snapshot
5. **Validation**: Check snapshot completeness and quality
6. **Storage**: Store successful snapshots or retry failed ones
7. **Cleanup**: Acknowledge processed messages and update status

## Error Handling

The application includes comprehensive error handling:
- Database connection failures result in process exit
- Failed snapshots are retried up to the configured maximum
- Worker pool termination on queue completion
- Comprehensive logging for debugging

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

## Contributing

Copyright 2025 Perfana Contributors. All contributions are welcome under the Apache 2.0 license.