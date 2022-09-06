require("dotenv").config();

const discordWebhook = process.env.DISCORD_WEBHOOK;
const jiraWebhook = process.env.JIRA_WEBHOOK;
const jiraBaseUrl = process.env.JIRA_BASE_URL;
const filterWords = process.env.FILTER_WORDS?.split("##") || [];

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios").default;

const app = express();

app.use(bodyParser.json());
app.post(jiraWebhook, async (req, res) => {
  const body = req.body;

  res.status(200).send();
  switch (body.webhookEvent) {
    case "jira:issue_updated": {
      const statusUpdated = body.changelog.items.find(
        (x) => x.field === "status"
      );

      const { issue, user } = body;
      if (statusUpdated) {
        const { fromString, toString } = statusUpdated;
        await axios.post(discordWebhook, {
          embeds: [
            {
              type: "rich",
              title: `${issue.fields.summary} [Status updated]`,
              description: `${user.displayName} changed the status of [${issue.key}](${jiraBaseUrl}/browse/${issue.key}) from \`${fromString}\` to \`${toString}\``,
              color: 0x72fb5d,
              timestamp: new Date(issue.fields.updated),
              url: `${jiraBaseUrl}/browse/${issue.key}`,
            },
          ],
        });
      }
      break;
    }
    case "jira:issue_created": {
      const createdUser = body.user.displayName;
      const issueKey = body.issue.key;
      const title = body.issue.fields.summary;

      const issueType = body.issue.fields.issueType.name;
      const assigneeUser = body.issue.fields.assignee.name;
      await axios.post(discordWebhook, {
        embeds: [
          {
            type: "rich",
            title: `[${issueKey}] ${title}  [${issueType} Created]`,
            description: `${createdUser} created [${issue.key}](${jiraBaseUrl}/browse/${issueKey}) and assigned it to ${assigneeUser}`,
            color: 0xfffb5d,
            timestamp: new Date(issue.fields.created),
            url: `${jiraBaseUrl}/browse/${issueKey}`,
          },
        ],
      });

      break;
    }
    case "comment_created": {
      const comment = body.comment.body;
      const author = body.comment.author.displayName;
      const issueKey = body.issue.key;
      const issueSummary = body.issue.fields.summary;
      const created = new Date(body.comment.created);
      if (filterWords.some((x) => comment.includes(filterWords))) {
        return;
      }

      await axios.post(discordWebhook, {
        embeds: [
          {
            type: "rich",
            title: `${author} commented on [${issueKey}]${issueSummary}`,
            description: comment,
            color: 0x10fbfd,
            timestamp: created,
            url: `${jiraBaseUrl}/browse/${issueKey}`,
          },
        ],
      });
      break;
    }

    default: {
      console.log(JSON.stringify(body, null, 2));
    }
  }
});

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
