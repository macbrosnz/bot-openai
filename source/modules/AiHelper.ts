import { PineconeClient, ScoredVector, Vector } from "@pinecone-database/pinecone";
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { OpenAI } from "langchain/llms/openai";
import { Configuration, OpenAIApi } from "openai";
import { LLMChain } from "langchain";
import { templates } from './templates';
import { PromptTemplate } from "langchain/prompts";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { VectorDBQAChain } from "langchain/chains";
import { PineconeLibArgs, PineconeStore } from "langchain/vectorstores/pinecone";
import {
  VectorStoreToolkit,
  createVectorStoreAgent,
  VectorStoreInfo,
} from "langchain/agents";
import { VectorOperationsApi } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";

// //import * as dotenv from "dotenv";


export class AiHelper {
  llm: OpenAI
  messages: string[]
  pineIndex: VectorOperationsApi;
  pinecone: PineconeClient
  pineArea: string;
  pineapikey: string;
  openai: OpenAIApi;
  embedModel: string;
  chatModel: string;
  openaikey: string
  chat: ChatOpenAI;
  chain: LLMChain;
  embedding: any;
  //embedder: OpenAIEmbeddings;
  query: string

  constructor(
  ) {

    this.initOpenAI().then((openai) => {
      console.log('init openai');
      this.openai = openai;
    });

    this.initPine().then((pineIndex) => {
      console.log('init pinecone');
      this.pineIndex = pineIndex;
    });
    this.initllm().then((llm) => {
      console.log('init llm');
      this.llm = llm
    });
    this.initllmchat().then((chat) => {
      this.chat = chat;
    });

    //    this.initEmbedder().then((embedder) => {
    //     console.log('init embedder');
    //     this.embedder = embedder;
    // });

  }
  // Initialize OpenAI API
  async initOpenAI() {
    const apikey = "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"
    const configuration = new Configuration({
      apiKey: apikey,
    });
    const openai = new OpenAIApi(configuration);
    console.log('init openai');
    return openai;
  }

  async initllm() {

    const llm = new OpenAI();
    return llm;
    console.log('init llm');
  }

  addMessage(msg: string) {
    //this.messages.push(msg)
  }

  async initllmchat() {
    const openapikey = "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"
    const chat = new ChatOpenAI({ openAIApiKey: openapikey, temperature: 0.5, })
    return chat
    console.log('init chat');
  }
  async sliceIntoChunks(arr: Vector[], chunkSize: number) {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      res.push(chunk);
    }
    return res;
  }

  async initPine() {
    let pinecone = new PineconeClient()
    await pinecone.init({
      environment: process.env.PINE_AREA,
      apiKey: process.env.PINE_API_KEY,
    })

    this.pinecone = pinecone
    const pineIndex = pinecone.Index(process.env.PINE_INDEX_NAME)
    return pineIndex

  }

  async pineResults(query: string) {
    return "hi"
    return new Promise(async (resolve, reject) => {
      try {
        const client = new PineconeClient();
        const model = new OpenAI();
        await client.init({
          apiKey: process.env.PINE_API_KEY,
          environment: process.env.PINE_AREA,
        });
        const pineconeIndex = client.Index(process.env.PINE_INDEX);

        const embeddings = new OpenAIEmbeddings()
        const res = await embeddings.embedQuery(query);
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
        const results = await vectorStore.similaritySearchVectorWithScore(res, 4);
        const toolkit = new VectorStoreToolkit(vectorStoreInfo, model);
        console.log(results);
        const agent = createVectorStoreAgent(model, toolkit);

        const input = query;
        console.log(`Executing: ${input}`);
        //const result = await agent.call({ input });
        // console.log(`Got output ${result.output}`);
        // console.log(
        //   `Got intermediate steps ${JSON.stringify(
        //     result.intermediateSteps,
        //     null,
        //     2
        //   )}`
        // );

        const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
          k: 1,
          returnSourceDocuments: true,
        });
        const response = await chain.call({ query: query });
        console.log(response);

        resolve(response.output);

      } catch (e) {
        console.log('error');
        reject(e);
      }
    });
  }
  // async pineResults(query: string) {
  //     try {
  //       const client = new PineconeClient();
  //       const model = new OpenAI();
  //       await client.init({
  //         apiKey: process.env.PINE_API_KEY,
  //         environment: process.env.PINE_AREA,
  //       });
  //       const pineconeIndex = client.Index(process.env.PINE_INDEX);

  //       const embeddings = new OpenAIEmbeddings()
  //       const res = await embeddings.embedQuery(query);
  //       console.log('embedded query');

  //       const vectorStore = await PineconeStore.fromExistingIndex(
  //         new OpenAIEmbeddings(),
  //         { pineconeIndex }
  //       );
  //       console.log('vectorstore');
  //       const vectorStoreInfo: VectorStoreInfo = {
  //         name: "Maori Health",
  //         description: "All Maori Health standards",
  //         vectorStore,
  //       };
  //       const results = await vectorStore.similaritySearchVectorWithScore(res, 4);
  //       const toolkit = new VectorStoreToolkit(vectorStoreInfo, model);
  //       console.log(results);
  //       const agent = createVectorStoreAgent(model, toolkit);

  //       const input = query;
  //       console.log(`Executing: ${input}`);
  //       //const result = await agent.call({ input });
  //       // console.log(`Got output ${result.output}`);
  //       // console.log(
  //       //   `Got intermediate steps ${JSON.stringify(
  //       //     result.intermediateSteps,
  //       //     null,
  //       //     2
  //       //   )}`
  //       // );

  //       const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
  //         k: 1,
  //         returnSourceDocuments: true,
  //       });
  //       const response = await chain.call({ query: query });
  //       console.log(response);

  //       return response;
  //     } catch (error) {
  //       console.error(error);
  //       // Handle the error here.
  //       return error;
  //     }
  //   }
}

export default AiHelper;


