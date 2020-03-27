const axios = require('axios');

class AssignIssueAction {
    constructor (owner, repo, issue, assignee, token) {
      this.owner = owner;
      this.repo = repo;
      this.issue = issue;
      this.assignee = assignee;
      this.token = token;
    }
  
    async execute() {
        let config = {
            headers: {
                'Authorization': `token ${this.token}`,
            }
        }

        let data = {
            'assignees': [this.assignee]
        }

        const response = await axios.post(`https://api.github.com/repos/${this.owner}/${this.repo}/issues/${this.issue}/assignees`, data, config);
        //console.log('Full response:\n');
        //console.log(response)
        //console.log('\n')
        return response;
    }
}

module.exports = AssignIssueAction;