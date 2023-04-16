import { ActivityHandler, CardFactory, MessageFactory, TurnContext } from "botbuilder";
import * as ACData from "adaptivecards-templating";
import * as AnswerCard from "../cards/Answer.json";
import * as WelcomeCard from "../cards/WelcomeCard.json";
import { loadSummarizationChain } from "langchain/chains";
import { Configuration, OpenAIApi } from "openai";
import {AiHelper} from "./AiHelper";
import { PineconeClient, ScoredVector, Vector } from "@pinecone-database/pinecone";
import { ChatOpenAI } from 'langchain/chat_models/openai';
    import { OpenAI } from "langchain/llms/openai";
 import { OpenAIEmbeddings } from "langchain/embeddings/openai";
 import {VectorDBQAChain} from "langchain/chains";
import { PineconeStore } from "langchain/vectorstores/pinecone";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
    VectorStoreToolkit,
    createVectorStoreAgent,
    VectorStoreInfo,
  } from "langchain/agents";

export class OpenAiBot extends ActivityHandler {
    constructor() {
        super();    

        this.onMessage(async (context, next) => {
                console.log('OpenAiBot constructor res:' + context.activity.text);
                const msg = context.activity.text;
                let aiHelper = new AiHelper();

                const client = new PineconeClient();
              const model = new OpenAI();
              await client.init({
                apiKey: process.env.PINE_API_KEY,
                environment: process.env.PINE_AREA,
              });
              const pineconeIndex = client.Index(process.env.PINE_INDEX);
            
              const embeddings = new OpenAIEmbeddings()
              const res = await embeddings.embedQuery(msg);
              console.log('embedded query');
            
              const vectorStore = await PineconeStore.fromExistingIndex(
                new OpenAIEmbeddings(),
                { pineconeIndex }
              );
              console.log('vectorstore');
              const vectorStoreInfo: VectorStoreInfo = {
                name: "Maori Health",
                description: "All Maori Health standards",
                vectorStore,
              };
              const modela = new OpenAI({ temperature: 0 });
            const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
            const docs = await textSplitter.createDocuments([]);
              const results = await vectorStore.similaritySearchVectorWithScore(res, 4);
              const chaina = loadSummarizationChain(model);
              const resa = await chaina.call({
                input_documents: docs,
              });
              const toolkit = new VectorStoreToolkit(vectorStoreInfo, model);
              console.log(results);
              const agent = createVectorStoreAgent(model, toolkit);
            
              const input = msg;
              console.log(`Executing: ${input}`);
              const result = await agent.call({ input });
              console.log(`Got output ${result.output}`);
              console.log(
                `Got intermediate steps ${JSON.stringify(
                  result.intermediateSteps,
                  null,
                  2
                )}`
              );
          
              const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
                k: 1,
                returnSourceDocuments: true,
              });
              const response = await chain.call({ query: msg });
              console.log(response);
                const answer = result.output;

                //Create data for card
                const cardData = {
                    answer: answer}

            const template = new ACData.Template(AnswerCard);
            const cardPayload = template.expand({ $root: cardData });
            const card = CardFactory.adaptiveCard(cardPayload);

            await context.sendActivity(MessageFactory.attachment(card));
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