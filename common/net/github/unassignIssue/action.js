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
        const headers = {
                'Authorization': `token ${this.token}`
            }

        const data = {
            'assignees': ['dgounaris']
        }

        const response = await axios.delete(`https://api.github.com/repos/${this.owner}/${this.repo}/issues/${this.issue}/assignees`, {headers, data});
        //console.log('Full response:\n');
        //console.log(response)
        //console.log('\n')
        return response;
    }
}

module.exports = UnassignIssueAction;