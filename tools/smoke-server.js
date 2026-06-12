const { spawn } = require('child_process');
const http = require('http');

const baseUrl = 'http://127.0.0.1:3000';

const checks = [
  {
    path: '/da/',
    status: 200,
  },
  {
    path: '/da/text/andersenandrea11',
    status: 200,
  },
  {
    path: '/favicon.ico',
    status: 200,
    contentType: 'image/x-icon',
  },
  {
    path: '/manifest.json',
    status: 200,
    contentType: 'application/json',
  },
  {
    path: '/digt.pl?longdid=andersenandrea11',
    status: 301,
    location: '/da/text/andersenandrea11',
  },
  {
    path: '/da/works/aagaard',
    status: 302,
    location: '/da/bio/aagaard',
  },
];

const request = path => {
  return new Promise((resolve, reject) => {
    const req = http.get(`${baseUrl}${path}`, res => {
      res.resume();
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error(`Timed out requesting ${path}`));
    });
  });
};

const waitForServer = async () => {
  const timeoutAt = Date.now() + 30000;

  while (Date.now() < timeoutAt) {
    try {
      await request('/da/');
      return;
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  throw new Error(`Timed out waiting for ${baseUrl}`);
};

const runCheck = async check => {
  const result = await request(check.path);
  const contentType = result.headers['content-type'] || '';
  const location = result.headers.location || '';

  if (result.status !== check.status) {
    throw new Error(
      `${check.path}: expected status ${check.status}, got ${result.status}`
    );
  }

  if (check.contentType != null && !contentType.startsWith(check.contentType)) {
    throw new Error(
      `${check.path}: expected content-type ${check.contentType}, got ${contentType}`
    );
  }

  if (check.location != null && location !== check.location) {
    throw new Error(
      `${check.path}: expected location ${check.location}, got ${location}`
    );
  }

  console.log(`ok ${check.path}`);
};

const stopServer = server => {
  return new Promise(resolve => {
    if (server.exitCode != null || server.signalCode != null) {
      resolve();
      return;
    }

    server.once('exit', resolve);
    server.kill('SIGTERM');

    setTimeout(() => {
      if (server.exitCode == null && server.signalCode == null) {
        server.kill('SIGKILL');
      }
    }, 5000);
  });
};

const main = async () => {
  const server = spawn('npm', ['start'], {
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', chunk => process.stdout.write(chunk));
  server.stderr.on('data', chunk => process.stderr.write(chunk));

  try {
    await waitForServer();

    for (const check of checks) {
      await runCheck(check);
    }
  } finally {
    await stopServer(server);
  }
};

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
