import {
  QueueServiceClient,
  StorageSharedKeyCredential,
  DequeuedMessageItem,
  QueueClient
} from "@azure/storage-queue";
import Twit = require("twit");

const account = process.env.ACCOUNT_NAME || "";
const accountKey = process.env.ACCOUNT_KEY || "";
const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
const queueServiceClient = new QueueServiceClient(
  `https://${account}.queue.core.windows.net`,
  sharedKeyCredential
);

export default class TweetHelper {
  private _twitterAPI: Twit = new Twit({
    consumer_key: process.env.ACCOUNT_KEY || "",
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET || "",
    access_token: process.env.TWITTER_ACCESS_TOKEN || "",
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET || "",
    timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
    strictSSL: true // optional - requires SSL certificates to be valid.
  });

  private _queueName: string;
  private _queueClient: QueueClient;

  constructor(queueName: string) {
    this._queueName = queueName;
    this._queueClient = queueServiceClient.getQueueClient(this._queueName);
  }

  public async getTweet(): Promise<DequeuedMessageItem> {
    const messages = await this._queueClient.receiveMessages();
    return messages.receivedMessageItems.length == 1
      ? messages.receivedMessageItems[0]
      : null;
  }

  public async postTweet(tweet: DequeuedMessageItem): Promise<void> {
    if (!tweet) return;

    const status = new Buffer(tweet.messageText, "base64").toString("utf-8");
    console.log(`Trying to post tweet "${status}".`);

    await this._twitterAPI
      .post("statuses/update", { status })
      .then(async response => {
        console.log(
          `Post was successful! Removing tweet from queue. Data returned was:\n${response.data}`
        );
        await this._queueClient.deleteMessage(
          tweet.messageId,
          tweet.popReceipt
        );
      })
      .catch(error => console.error(error));
  }
}
