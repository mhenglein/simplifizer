"use strict";
require("dotenv").config({ path: "config/.env" });
const { Configuration, OpenAIApi } = require("openai");
const { encode } = require("gpt-3-encoder");

// OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports.summarizer = async (text) => {
  // Get length of text: Regular summary or recursive required?
  // Use encode from gpt3
  // Break text into chunks of X characters
  // Step 1 Initial summary (Prompt 1)
  // Step 2 Recursive summary (Prompt 2)
  // Sanity checks
};
