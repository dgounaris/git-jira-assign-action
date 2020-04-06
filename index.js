const core = require("@actions/core");

const JiraGetIssueAction = require('./common/net/jira/getissue/action');
const AssignIssueAction = require('./common/net/github/assignIssue/action');
const UnassignIssueAction = require('./common/net/github/unassignIssue/action');
const GetAllIssuesAction = require('./common/net/github/getAllIssues/action');
const GetFirstIssueCommentAction = require('./common/net/github/getFirstIssueComment/action');
const assigneeMapping = require('./common/assigneeMapping');

async function run() {
    try {
      const inputs = {
        jiraBaseUrl: core.getInput('jiraBaseUrl'),
        jiraEmail: core.getInput('jiraEmail'),
        jiraToken: core.getInput('jiraToken'),
        token: core.getInput('token'),
        owner: core.getInput('owner'),
        repository: core.getInput('repository')
      };
      const base64token = Buffer.from(`${inputs.jiraEmail}:${inputs.jiraToken}`).toString('base64');
      const repo = await getSanitizedRepo(inputs.repository)

      const issues = await new GetAllIssuesAction(inputs.owner, repo, inputs.token).execute();
      issues.data.forEach(async (issue) => {
          const issueNumber = issue.number;
          const assignees = issue.assignees.length != 0 ? issue.assignees.map(assignee => assignee.login) : [];
          console.log(`Operating for issue: ${issueNumber} with ${assignees}`);
          await operateForIssue(inputs.owner, repo, issueNumber, assignees, inputs.token, inputs.jiraBaseUrl, base64token);
      });
    } catch (error) {
        console.log(error);
        process.exit(1);
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

async function operateForIssue(owner, repo, issue, existingAssignees, token, jiraBaseUrl, jiraToken) {
    const issueFirstComment = await new GetFirstIssueCommentAction(owner, repo, issue, token).execute();
    console.log('First commit message: ' + issueFirstComment);

    if (!(/^Automatically created Jira issue: [A-Z]+-\d+/.test(issueFirstComment))) {
        return;
    }

    const jiraIssueKey = issueFirstComment.split(' ').pop();
    const jiraIssueAssignee = await getJiraIssueAssignee(jiraBaseUrl, jiraIssueKey, jiraToken);
    console.log(`Jira assignee: ${jiraIssueAssignee}`);

    if (jiraIssueAssignee !== '' && assigneeMapping[jiraIssueAssignee] != null) {
        const githubAssignee = assigneeMapping[jiraIssueAssignee];
        console.log(`Assignee for issue ${issue} is ${githubAssignee}`);
        await new UnassignIssueAction(
            owner, 
            repo, 
            issue, 
            existingAssignees.filter(assignee => assignee != githubAssignee), 
            token
        ).execute();
        await new AssignIssueAction(owner, repo, issue, githubAssignee, token).execute();
    } else {
        console.log(`${existingAssignees}, ${existingAssignees.length} on issue ${issue}`);
        await new UnassignIssueAction(owner, repo, issue, existingAssignees, token).execute();
    }
}

async function getJiraIssueAssignee(jiraBaseUrl, jiraIssueKey, jiraToken) {
    const issue = await new JiraGetIssueAction(
        jiraBaseUrl,
        jiraIssueKey,
        jiraToken
    ).execute()
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