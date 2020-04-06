# git-jira-assign-action

This is a github action step implementation to synchronize assigners in jira and github, written in js.

## Requirements

This action step requires atlassian/gajira-login to be run before it.

This action step requires assigneeMapping to contain all the mappings between jira and github assignee accounts.

This action step requires the first issue comment to be a linking one between github and jira issues, 
in the format of "Automatically created Jira issue: XXX-YY"

## Input

The plugin takes 3 arguments as input:
- token (a github token with write access to the github repo of interest)
- owner (the owner of the repository)
- repository (the name of the repository)

## Usage

It is recommended to add this action step in an action workflow triggered by cron in periodic intervals.

The action, once triggered with the expected arguments, will lookup all github issues and will find the related
jira issues based on the expected first comment on them. 

Then, it will lookup jira for assignees, which it maps back to
github assignees via the assigneeMapping. 

Lastly, api calls to github are made to update the assignees in the issues.

This plugin handles both assignments and unassignments from the jira side, and only works one way (github assignments will not affect jira).
