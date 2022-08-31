require("dotenv").config();

const discordWebhook = process.env.DISCORD_WEBHOOK;
const jiraWebhook = process.env.JIRA_WEBHOOK;
const jiraBaseUrl = process.env.JIRA_BASE_URL;

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios").default;

const app = express();

app.use(bodyParser.json());
app.post(jiraWebhook, async (req, res) => {
  const body = req.body;

  res.status(200).send();
  switch (body.issue_event_type_name) {
    case "issue_updated": {
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
              title: `${issue.summary} [Status updated]`,
              description: `${user.displayName} changed the status of [${issue.key}](${jiraBaseUrl}/browse/${issue.key}) from \`${fromString}\` to \`${toString}\``,
              color: 0x72fb5d,
              timestamp: new Date(issue.updated),
              url: `${jiraBaseUrl}/browse/${issue.key}`,
            },
          ],
        });
      }
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
