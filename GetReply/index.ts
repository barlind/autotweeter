import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import TweetHelper from "../TweetHelper";

const httpTrigger: AzureFunction = async function(
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");
  const q = req.query.q || (req.body && req.body.q) || "drsebleningrad";
  const r = req.query.r || (req.body && req.body.r) || "";

  const th = new TweetHelper(q + (r ? "-replies" : ""));
  const tweet = await th.getTweet();
  await th.deleteMessage(tweet);

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: new Buffer(tweet.messageText, "base64").toString("utf-8")
  };
};

export default httpTrigger;
