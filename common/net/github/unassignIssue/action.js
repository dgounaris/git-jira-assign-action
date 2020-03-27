const axios = require('axios');

class UnassignIssueAction {
    constructor (owner, repo, issue, assignees, token) {
      this.owner = owner;
      this.repo = repo;
      this.issue = issue;
      this.assignees = assignees;
      this.token = token;
    }
  
    async execute() {
        let config = {
            headers: {
                'Authorization': `token ${this.token}`,
            }
        }

        let data = {
            'assignees': this.assignees
        }

        const response = await axios.delete(`https://api.github.com/repos/${this.owner}/${this.repo}/issues/${this.issue}/assignees`, data, config);
        //console.log('Full response:\n');
        //console.log(response)
        //console.log('\n')
        return response;
    }
}

module.exports = UnassignIssueAction;