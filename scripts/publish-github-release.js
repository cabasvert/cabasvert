/*
 * This file is part of CabasVert.
 *
 * Copyright 2017, 2018 Didier Villevalois
 *
 * CabasVert is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CabasVert is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CabasVert.  If not, see <http://www.gnu.org/licenses/>.
 */

const path = require('path');
const fs = require('fs-extra');
const Octokit = require('@octokit/rest');
const utils = require('./utils');

const owner = 'cabasvert';
const repository = 'cabasvert';

let packageDir = process.cwd();

async function main() {
  try {
    if (!process.env.GH_TOKEN) {
      throw new Error('env.GH_TOKEN is undefined');
    }

    // await utils.checkGit();

    let { name, version } = utils.readPackageJson(packageDir);
    let tag = `${name}@${version}`;
    let artifactsDir = path.join(packageDir, 'artifacts');

    await publishGithub(name, version, tag, artifactsDir);

  } catch (err) {
    console.error('\n', err, '\n');
    process.exit(1);
  }
}

async function publishGithub(pkg, version, tag, artifactsDir) {
  let octokit = new Octokit({
    auth: process.env.GH_TOKEN,
  });

  let release = null;
  try {
    release = await octokit.repos.getReleaseByTag({
      owner: owner,
      repo: repository,
      tag: tag,
    });
  } catch (err) {
    // Release does not yet exist
  }

  if (release) {
    console.log(`GitHub release for ${tag} already exists – Skipping!`);
    return;
  }

  if (!release) {
    console.log(`Creating GitHub release for ${tag}`);

    // Create the GitHub release
    release = await octokit.repos.createRelease({
      owner: owner,
      repo: repository,
      target_commitish: 'master',
      tag_name: tag,
      name: `${pkg} ${version}`,
      prerelease: isPreRelease(version),
      body: lastChangelog(),
    });
  }

  let uploadUrl = release.data.upload_url;

  // Check if there are any artifacts to publish
  if (fs.existsSync(artifactsDir)) {
    try {
      let files = fs.readdirSync(artifactsDir);
      for (let file of files) {

        let contentType = null;
        if (file.endsWith('.tar.gz') || file.endsWith('.tgz')) {
          contentType = 'application/tar+gzip';
        } else if (file.endsWith('.apk')) {
          contentType = 'application/vnd.android.package-archive';
        } else {
          console.warn(`Unknown content type for '${file}' – Skipping`);
          return;
        }

        console.log(`Uploading GitHub release asset ${file}`);

        const content = await fs.readFile(path.join(artifactsDir, file));

        await octokit.repos.uploadReleaseAsset({
          url: uploadUrl,
          file: content,
          headers: {
            'content-length': content.byteLength,
            'content-type': contentType,
          },
          name: file,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
}

function isPreRelease(version) {
  return version.indexOf('alpha') !== -1
      || version.indexOf('beta') !== -1
      || version.indexOf('rc') !== -1;
}

function lastChangelog() {
  const lines = fs.readFileSync('CHANGELOG.md', 'utf-8').toString().split('\n');
  let start = -1;
  let end = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
        !line.startsWith('# Change Log') &&
        (line.startsWith('# ') || line.startsWith('## '))
    ) {
      if (start === -1) {
        start = i + 1;
      } else {
        end = i - 1;
        break;
      }
    }
  }

  if (start === -1) {
    throw new Error('changelog diff was not found');
  }
  return lines.slice(start, end).join('\n').trim();
}

main();
