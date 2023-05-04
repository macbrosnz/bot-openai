
import { ChatPromptTemplate, HumanMessagePromptTemplate, PromptTemplate, SystemMessagePromptTemplate } from "langchain/prompts";
import { OpenAI, OpenAIChat } from "langchain/llms/openai";
import { LLMChain, loadSummarizationChain } from "langchain/chains";
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
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage } from "langchain/schema";


const str = templates.qaTemplate
console.log(templates.qaTemplate);


const getStringsFromDocs = async(docs: any) => {
  // Assuming results is an array of objects with a pageContent property
  
  const pageContents = [];
  for (let i = 0; i < docs.length; i++) {
    pageContents.push(docs[i].pageContent);
    console.log(docs[i]);
  }
  let
    uniqueArray = pageContents.
      filter
      (
        (item, index) => {
          return
          pageContents.indexOf(item) === index;
        });
  return pageContents;
// The pageContents array now contains all the pageContent values from the results array

}

const docstrings = async (docs: any) => {
  const pageContents: string[] = docs.map((Document) => Document.pageContent);
const concatenatedString: string = pageContents.join('');

console.log(concatenatedString);
  return concatenatedString;
  
}
const uniquedocstrings = async (docs: any) => {
  const pageContents: string[] = docs.map((doc: any) => doc.pageContent);

  // Use a Set to get unique pageContent strings
  const uniquePageContents = [...new Set(pageContents)];

  // Concatenate the unique pageContent strings
  const concatenatedString = uniquePageContents.join('');

  console.log(concatenatedString);
  return concatenatedString;
}


const basicLLMQuery = async (msg: string): Promise<string> => {
  try {
    const model = new ChatOpenAI({
      openAIApiKey: "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",
      temperature: 1,

    });

    const res = await model.call([new HumanChatMessage(msg)]);
    console.log(res);

    return res.text

  } catch (err) {
    console.log(err);
    return "failed"
  }
}
export { basicLLMQuery };



const queryVectorStoreAgent = async (msg: string, namespace: string,): Promise<string> => {

  // Create a prompt template use to generate prompts for the summarization chain
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(templates.inquiryTemplate),
    HumanMessagePromptTemplate.fromTemplate(`{msg} `)
  ])

  
  try {
    //embed query to vector         
    const client = new PineconeClient();
    await client.init({
      apiKey: process.env.PINE_KEY,
      environment: process.env.PINE_ENV,
    });

    const pineconeIndex = client.Index(process.env.PINE_INDEX);

    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings,
      { pineconeIndex, namespace: namespace },
    );
    const chatmodel = new OpenAIChat({
      modelName: process.env.OPENAI_CMODEL,
      openAIApiKey: "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",
      temperature: .3,
    })
    const results = await vectorStore.similaritySearch(msg, 5);
    const docstring = await docstrings(results);
    console.log('docs: ' + docstring);

    const chain = new LLMChain({
      llm:chatmodel, prompt: chatPrompt})

    const res = await chain.call({
      msg: msg,
      summaries: docstring
    }
      
    );

    console.log(res);
    return res.text;
  }

  catch (e) {
    console.log(e)
  }
}
export { queryVectorStoreAgent };


