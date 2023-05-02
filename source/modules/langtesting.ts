
import { BasePromptTemplate, ChatPromptTemplate, HumanMessagePromptTemplate, PromptTemplate, SystemMessagePromptTemplate } from "langchain/prompts";
import { OpenAI, OpenAIChat } from "langchain/llms/openai";
import { LLMChain, VectorDBQAChain, loadSummarizationChain } from "langchain/chains";
import { templates } from './templates';
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
  VectorStoreToolkit,
  createVectorStoreAgent,
  VectorStoreInfo,
} from "langchain/agents";

import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PineconeClient } from "@pinecone-database/pinecone";
import { ChainTool } from "langchain/tools";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage } from "langchain/schema";
import { VectorOperationsApi } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { VectorStore } from "langchain/dist/vectorstores/base";

//openai
const openaikey = "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";
const openaicmodel = process.env.OPENAI_CMODEL;
//initialize openai
const cmodel = new OpenAIChat({
    openAIApiKey: openaikey,
    modelName: openaicmodel,
    temperature: 0.9,
});


//pinecone
const pineKey = process.env.PINE_KEY;
const pineEnv = process.env.PINE_ENV ;
const pineName = process.env.PINE_INDEX;
//pineconeIndex
const pineIndex = async (pineKey:string, pinEnv:string, pineName:string) => {
const pineCone = new PineconeClient();
await pineCone.init({apiKey:pineKey, environment:pineEnv});
const index = pineCone.Index(pineName);
return index
}
//initialize vectorstore
const pineStore = async (pineIndex: VectorOperationsApi, namespace:string) => {

    const pineStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings, {pineconeIndex: pineIndex, namespace: namespace})

    return pineStore
}

const ngaPaerewaAgent = async () => {
    const index = await pineIndex(pineKey, pineEnv, pineName)
    const vStore = await pineStore(index, pineName)
    const vectorstoreinfo: VectorStoreInfo = {
        name: "Nga-Paerewa",
        description: "Nga Paerewa is a new Standard for Health in NZ.",
        vectorStore: vStore,
    }

    const toolkit = new VectorStoreToolkit(vectorstoreinfo, cmodel);
    const agent = createVectorStoreAgent(cmodel, toolkit, {
        // The agent will use the following templates to generate prompts


    })

    return agent
    
}

// class="theme-doc-markdown markdown"