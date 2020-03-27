const core = require("@actions/core");
const github = require("@actions/github");
const YAML = require('yaml');
const fs = require('fs');

const configPath = `${process.env.HOME}/jira/config.yml`;
const JiraGetIssueAction = require('./common/net/jira/getissue/action');
const AssignIssueAction = require('./common/net/github/assignIssue/action');
const GetAllIssuesAction = require('./common/net/github/getAllIssues/action');
const GetFirstIssueCommentAction = require('./common/net/github/getFirstIssueComment/action');
const assigneeMapping = require('./common/assigneeMapping');

const config = YAML.parse(fs.readFileSync(configPath, 'utf8'));

async function run() {
    try {
      const inputs = {
        token: core.getInput('token'),
        owner: core.getInput('owner'),
        repository: core.getInput('repository')
      };
      const repo = await getSanitizedRepo(inputs.repository)

      const issues = await new GetAllIssuesAction(inputs.owner, repo, inputs.token).execute();
      issues.data.forEach(async (issue) => {
          const issueNumber = issue.number;
          console.log(`Operating for issue: ${issueNumber}`);
          await operateForIssue(inputs.owner, repo, issueNumber, inputs.token);
      });
    } catch (error) {
        console.log(error);
    }
}

async function getSanitizedRepo(rawRepo) {
    const repository = rawRepo
      ? rawRepo
      : process.env.GITHUB_REPOSITORY;
    const repo = repository.split("/");
    console.log(`repository: ${repo}`);
    return repo;
}

async function operateForIssue(owner, repo, issue, token) {
    const issueFirstComment = await new GetFirstIssueCommentAction(owner, repo, issue, token).execute();
    console.log('First commit message: ' + issueFirstComment);

    if (!(/^Automatically created Jira issue: [A-Z]+-\d+/.test(issueFirstComment))) {
        return;
    }

    const jiraIssueKey = issueFirstComment.split(' ').pop();
    const jiraIssueAssignee = await getJiraIssueAssignee(jiraIssueKey);
    console.log(`Jira assignee: ${jiraIssueAssignee}`);

    if (jiraIssueAssignee != '' && assigneeMapping[jiraIssueAssignee] != null) {
        const githubAssignee = assigneeMapping[jiraIssueAssignee];
        console.log(githubAssignee);
        await new AssignIssueAction(owner, repo, issue, githubAssignee, token).execute();
    }
}

async function getJiraIssueAssignee(jiraIssue) {
    const issue = await new JiraGetIssueAction({
        config,
        jiraIssue
    }).execute()
    console.log(`Jira issue ${jiraIssue} retrieved:\n`);
    console.log(issue);
    console.log('\n');
    if (issue.fields.assignee == null || issue.fields.assignee.accountId == null) {
        return '';
    }
    const assigneeId = issue.fields.assignee.accountId;
    return assigneeId;
}

run();