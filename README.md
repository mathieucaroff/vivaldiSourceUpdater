# vivaldiSourceUpdater

This repository contains scripts and automation configuration to automatically update the Vivaldi browser source code in the [Vivaldi-browser repository](https://github.com/ric2b/Vivaldi-browser).

## How it works

### Daily source check

Every day, GitHub runs a script which checks for new source archives on [vivaldi.com/source](https://vivaldi.com/source/) that aren't yet in ric2b's repository.

If new archives are found, the script:

1. Allocates a high-performance cloud server at Digital Ocean
2. Downloads and extracts the archives
3. Shallow-clones the latest commit from the GitHub repository
4. Adds each archive as a commit and creates tags
5. Pushes changes to GitHub
6. Requests its own deletion through the Digital Ocean API

### Daily security instance deletion

A security script runs daily, one hour before the source check, to delete any running instances. This prevents instances from running too long and accumulating costs while still allowing enough time for normal operations.

## Email Notifications

The system sends email notifications for:

- Daily source check initiation
- New source archive detection and high-performance instance creation
- Instance activation
- Instance deletion (both normal and security-triggered)

## Environment variables

The scripts use the following environment variables:

```
# Digital Ocean API token
DO_API_TOKEN
# Digital Ocean SSH public key ID
DO_SSH_KEY_ID
# SSH private key corresponding to the Digital Ocean SSH public key
SSH_PRIVATE_KEY

# Email notification configuration
# SMTP server
SMTP_SERVER
# SMTP port
SMTP_PORT
# SMTP username
SMTP_USERNAME
# SMTP password
SMTP_PASSWORD

# Github Token to get higher rate limits for checking the
# last vivaldi source code uploaded version from github
GH_TOKEN

# Email of git commits' author and committer
GIT_USER_EMAIL
```

## License

JAM License
