# Publish NPM Package

This page describes our use of NPM packages for internal code sharing.

In this initial phase, we're using Github Packages solution for this project.

## Get a Personal Access Token

To get the access token you need to go to Github and generate one for your user.

> **For the permission**
Select `write packages` permission on the generator.

* https://github.com/settings/tokens


## Publishing Packages

To publish packages using GitHub you need to create under the root directory of the package a file `.npmrc` and setup as follow:

> Replace `GITHUB_TOKEN` in the code below.

```
@beginwallet:registry=https://npm.pkg.github.com/beginwallet
//npm.pkg.github.com/:_authToken=GITHUB_TOKEN
registry=https://registry.npmjs.org
```

### Log in to npm from the terminal

Run:
```
npm login --scope=@beginwallet --registry=https://npm.pkg.github.com
```

Your terminal will ask for those parameters
```
Username: YOUR_GITHUB_USERNAME
Password: GITHUB_TOKEN
Email (this IS public): <name>@begin.is
```

## Publish

For our exiting packages, just update the version at `package.json` then Run:

```
npm publish
```

Published packages can be found here:
* https://github.com/orgs/B58-Finance/packages

## Consuming Packages

To use the packages you have published you need to create in the root directory of the project a file `.npmrc` and setup as follow:

> Replace `GITHUB_TOKEN` in the code below.

```
//npm.pkg.github.com/:_authToken=GITHUB_TOKEN

@beginwallet:registry=https://npm.pkg.github.com
```

To add our packages for example you can use
```
npm install -save @beginwallet/core

OR

yarn add @beginwallet/core
```

### References
* [Private NPM Packages](https://levelup.gitconnected.com/private-npm-packages-in-github-package-registry-fbfda43acab3)
