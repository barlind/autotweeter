import { AzureFunction, Context } from "@azure/functions";
import TweetHelper from "./TweetHelper";

const timerTrigger: AzureFunction = async function(
  context: Context,
  myTimer: any
): Promise<void> {
  if (new Date().getHours() > 6) {
    const th = new TweetHelper("drsebleningrad");
    await th.postTweet(await th.getTweet());
  }
};

export default timerTrigger;
