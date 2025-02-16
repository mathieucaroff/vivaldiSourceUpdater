# vivaldiSourceUpdater

This repository contains the scripts and automation configuration files to update the Vivaldi source code automatically in the https://github.com/ric2b/Vivaldi-browser repostory.

## How it works

### Daily source check

Every day, the script checks if there are any new source archives on the https://vivaldi.com/source/ page, compared to ric2b's repository.

If there are new source archives, the script allocates a high-performance cloud server.

On the sever, the archives will be downloaded and extracted. The last commit of the github repository will be shallow-cloned and each archive will be added as a commit, and a tag will be created. Finally the changes will be pushed to the GitHub repository and the server will requests its deletion through the GitHub API.

### Daily security instance deletion

Every day, one hour before the time of the daily source check, a script checks for any instance that are running and deletes them. This is a security measure to prevent any instance from running for too long and costing too much money. The schedule is chosen so that the instance still get a lot of time before being force-deleted.

## Emails

The following events are reported by email:

- The daily source check starts
- New source archive detected
- High-performane instance deleted
- Deletion of the high-performance instance by the daily security instance deletion script
