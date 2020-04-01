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
  private _queueName: string;
  private _queueClient: QueueClient;
  _config: { twitter: Twit.Options; queueName: string };

  constructor(
    queueName: string,
    twitConfig: Twit.Options = {
      consumer_key: "",
      consumer_secret: "",
      access_token: "",
      access_token_secret: "",
      strictSSL: true
    }
  ) {
    this._config = { twitter: twitConfig, queueName };
    this._queueClient = queueServiceClient.getQueueClient(
      this._config.queueName
    );
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

    await new Twit(this._config.twitter)
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

  public async deleteMessage(tweet: DequeuedMessageItem): Promise<void> {
    await this._queueClient.deleteMessage(tweet.messageId, tweet.popReceipt);
  }
}
