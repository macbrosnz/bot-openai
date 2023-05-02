import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { Response } from "botbuilder";
import { OpenAiBot } from "../modules/Bot";
import { BotAdapterInstance } from "../modules/BotAdapter"; 

// Create bot instance
const bot = new OpenAiBot();

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    console.log('httpTriggered');

    // Process request
    const botAdapterInstance = BotAdapterInstance.getInstance();
    await botAdapterInstance.adapter.process(req, context.res as Response, (context) => bot.run(context));
};

export default httpTrigger;
