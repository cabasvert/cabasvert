const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');
const octokit = require('@octokit/rest')();

const rootDir = path.join(__dirname, '../');

let readVersion = function () {
  const packagePath = path.join(rootDir, 'package.json');
  const { version } = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  return version;
};

async function main() {
  try {
    if (!process.env.GH_TOKEN) {
      throw new Error('env.GH_TOKEN is undefined');
    }

    await checkGit();

    const version = readVersion();
    const releaseArchiveFile = 'cabasvert-client-browser-' + version + '.tar.gz';

    await packBrowserRelease(releaseArchiveFile);

    await publishGithub(version, `v${version}`, releaseArchiveFile);

    await rmBrowserRelease(releaseArchiveFile);

  } catch (err) {
    console.error('\n', err, '\n');
    process.exit(1);
  }
}

async function checkGit() {
  if (await execa.stdout('git', ['status', '--porcelain']) !== '') {
    throw new Error(`Unclean working tree. Commit or stash changes first.`);
  }
  if (await execa.stdout('git', ['rev-list', '--count', '--left-only', '@{u}...HEAD']) !== '0') {
    throw new Error(`Remote history differs. Please pull changes.`);
  }
}

async function packBrowserRelease(releaseArchiveFile) {
  await execa.stdout('tar', ['cvzf', releaseArchiveFile, '--exclude=config.prod.json', 'www']);
}

async function rmBrowserRelease(releaseArchiveFile) {
  await execa.stdout('rm', [releaseArchiveFile]);
}

async function publishGithub(version, tag, releaseArchiveFile) {
  octokit.authenticate({
    type: 'oauth',
    token: process.env.GH_TOKEN
  });

  const result = await octokit.repos.createRelease({
    owner: 'cabasvert',
    repo: 'cabasvert-client',
    target_commitish: 'v0.3',
    tag_name: tag,
    name: version,
    prerelease: isPreRelease(version),
    body: lastChangelog(),
  });

  const file = await fs.readFile(releaseArchiveFile);

  await octokit.repos.uploadAsset({
    url: result.data.upload_url,
    file: file,
    contentType: 'application/tar+gzip',
    contentLength: file.byteLength,
    name: releaseArchiveFile,
  });
}

function isPreRelease(version) {
  return version.indexOf('alpha') !== -1
    || version.indexOf('beta') !== -1
    || version.indexOf('rc') !== -1;
}

function lastChangelog() {
  const lines = fs.readFileSync('CHANGELOG.md', 'utf-8').toString().split('\n');
  let start = -1;
  let end = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('# [')) {
      if (start === -1) {
        start = i + 1;
      } else {
        end = i - 1;
        break;
      }
    }
  }

  if (start === -1 || end === -1) {
    throw new Error('changelog diff was not found');
  }
  return lines.slice(start, end).join('\n').trim();
}

main();
