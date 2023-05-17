import { ActivityHandler, CardFactory, MessageFactory, TurnContext } from "botbuilder";
import * as ACData from "adaptivecards-templating";
import * as AnswerCard from "../cards/Answer.json";
import * as WelcomeCard from "../cards/WelcomeCard.json";
import { queryStoreAgent } from "./techsummarizer";
import { queryVectorStore } from "./summarizer";

export class OpenAiBot extends ActivityHandler {
  constructor() {
    super();
    
    this.onMessage(async (context, next) => {
      console.log('OpenAiBot constructor res:' + context.activity.text);
      const msg = context.activity.text

      const answer = await queryVectorStore(msg, 'racism');
      //Create data for card
      const cardData = {
        answer: answer
      }
      //Create card
      const template = new ACData.Template(AnswerCard);
      const cardPayload = template.expand({ $root: cardData });
      const card = CardFactory.adaptiveCard(cardPayload);

      await context.sendActivity(MessageFactory.attachment(card));
      // await context.sendActivity(`You said '${context.activity.text}'`);
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      const card = CardFactory.adaptiveCard(WelcomeCard);
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(MessageFactory.attachment(card));
        }
      }
      await next();
    });
  }
}