"use strict";
require("dotenv").config({ path: "config/.env" });
const { Configuration, OpenAIApi } = require("openai");
const { encode } = require("gpt-3-encoder");
const fs = require("fs");

// OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports.summarizer = async (text) => {
  // 1. Validation check

  // 2. Preprocessing (Cleaning)
  // 2.1 Remove all timestamps (e.g. 12:00)
  text = text.replace(/([0-9]{1,2}:[0-9]{2})/g, "");

  // 2.3 Remove all double spaces
  text = text.replace(/  +/g, " ");
  text = text.trim();

  // 3. Chunking
  const initialLength = encode(text); // If more than 2000, then we need to chunk.
  const arrOfChunks = [];

  // Chunk text into chunks of max. 1500 tokens
  const chunks = text.split(".");
  let chunk = "";
  for (let i = 0; i < chunks.length; i++) {
    const chunkLength = encode(chunk);
    if (chunkLength < 2000) {
      chunk += chunks[i];
    } else {
      arrOfChunks.push(chunk);
      chunk = "";
    }
  }

  console.log("✨", arrOfChunks.length);
  const TOTAL = arrOfChunks.length;

  // Add the commented items above to an array
  const name1 = "Tuf";
  const name2 = "Eve";

  const arrOfComponentsFull = [
    "Buyer's current solution",
    "Buyer's pain points with current solution",
    "Benefits of seller's solution",
    "Buyer's decision makers",
    "Buyer's reasons to not buy",
    "Buyer's decision making process",
    "Agreed next steps",
  ];

  const arrOfComponents = arrOfComponentsFull[0];

  const results = [];

  // For each chunk
  for (let i = 0; i < 1; i++) {
    const transcript = arrOfChunks[i];
    const n = i + 1;

    let template = fs.readFileSync("/checkPrompt.txt", "utf8");
    template = template.replace(/<<NAME1>>/g, name1);
    template = template.replace(/<<NAME2>>/g, name2);
    template = template.replace(/<<TRANSCRIPT>>/g, transcript);
    template = template.replace(/<<N>>/g, n);
    template = template.replace(/<<TOTAL>>/g, TOTAL);

    // For each component
    for (let j = 0; j < arrOfComponents.length; j++) {
      const component = arrOfComponents[j];
      let prompt = template.replace(/<<CRM_COMPONENT>>/g, component);

      // OpenAI API call
      const response = await openai.complete({
        model: "text-davinci-002",
        prompt,
        max_tokens: 16,
        temperature: 0.0,
        top_p: 1,
      });

      // Add to results
      const result = response.data.choices[0].text; // Yes or No
      results.push({ component: result });
    }

    console.log(results);
  }
};
