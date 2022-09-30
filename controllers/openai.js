"use strict";
require("dotenv").config({ path: "config/.env" });
const { Configuration, OpenAIApi } = require("openai");
const { encode } = require("gpt-3-encoder");
const fs = require("fs");
const example = require("./example.json");

// OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
console.log(process.env.OPENAI_API_KEY);

const openai = new OpenAIApi(configuration);

module.exports.summarizer = async (text) => {
  const arrOfComponentsFull = [
    "Buyer's current solution",
    "Buyer's pain points with current solution",
    "Benefits of seller's solution",
    "Buyer's decision makers",
    "Buyer's reasons to not buy",
    "Buyer's decision making process",
    "Agreed next steps",
  ];

  const arrOfComponents = arrOfComponentsFull;
  console.log("☑️ Components", arrOfComponents);

  try {
    console.log("here");

    // Get from params or body.
    const buyer = "Tuf";
    const seller = "Eve";

    // 1. Validation check

    // 2. Preprocessing (Cleaning)
    text = text.replace(/([0-9]{1,2}:[0-9]{2})/g, "");
    text = text.replace(/  +/g, " ");
    text = text.trim();

    // 3. Chunk text into chunks of max. 1150 WORDS (not characters) [Replace with Ross' magical text splitter]
    const arrOfChunks = chunkText(text);
    const TOTAL = arrOfChunks.length;
    function chunkText() {
      const arr = [];
      const chunkSize = 1150;
      const words = text.split(" ");
      const numOfChunks = Math.ceil(words.length / chunkSize);

      for (let i = 0; i < numOfChunks; i++) {
        const start = i * chunkSize;
        const end = start + chunkSize;
        const chunk = words.slice(start, end).join(" ");
        arr.push(chunk);
      }
      console.log("☑️ Number of chunks", arr.length);
      return arr;
    }

    // const step1Results = await step1();
    // console.log(step1Results);

    async function step1() {
      const results = [];
      // STEP 1: Evaluate each chunk against the presence of a CRM component blah blha
      for (let i = 0; i < arrOfChunks.length; i++) {
        const transcript = arrOfChunks[i];
        const n = i + 1;

        console.log("STEP 1", "Now reviewing chunk no. ", n);

        let template = fs.readFileSync("./controllers/checkPrompt.txt", "utf8"); // controllers/checkPrompt.txt
        template = template.replace(/<<BUYER>>/g, buyer);
        template = template.replace(/<<SELLER>>/g, seller);
        template = template.replace(/<<TRANSCRIPT>>/g, transcript);
        template = template.replace(/<<N>>/g, n);
        template = template.replace(/<<TOTAL>>/g, TOTAL);

        const componentResults = [];

        // For each component
        for (let j = 0; j < arrOfComponentsFull.length; j++) {
          const component = arrOfComponentsFull[j];
          let prompt = template.replace(/<<CRM_COMPONENT>>/g, component);

          // OpenAI API call
          const response = await openai.createCompletion({
            model: "text-davinci-002",
            prompt,
            max_tokens: 16,
            temperature: 0.2,
            top_p: 1,
          });

          // Add to results
          const result = response.data.choices[0].text; // Yes or No

          const newObj = {};
          newObj[component] = result;
          componentResults.push(newObj);
        }

        const newEntry = {};
        newEntry[`Chunk ${n}`] = componentResults;
        results.push(newEntry);
      }
      console.log(JSON.stringify(results, null, 2));
      return results;
    }

    // STEP 2: For those that include YES, extract the relevant information
    const resultsExample = example;

    const summaryArray = [
      { component: "Buyer's current solution", arrStrings: [] },
      { component: "Buyer's pain points with current solution", arrStrings: [] },
      { component: "Benefits of seller's solution", arrStrings: [] },
      { component: "Buyer's decision makers", arrStrings: [] },
      { component: "Buyer's reasons to not buy", arrStrings: [] },
      { component: "Buyer's decision making process", arrStrings: [] },
      { component: "Agreed next steps", arrStrings: [] },
    ];

    // const finalObject = step2(step1Results);
    async function step2(results) {
      const final = [];

      for (let i = 0; i < results.length; i++) {
        // Reviewing chunk no. n
        const n = i + 1;

        const chunkMain = results[i];
        let chunk = chunkMain[`Chunk ${i + 1}`];
        console.log(chunkMain);
        console.log(chunk);

        // For each component
        for (let j = 0; j < arrOfComponentsFull.length; j++) {
          let chunkPart = chunk[j];
          if (typeof chunkPart === "undefined") {
            console.log(chunkMain, "Horrible error", j);
            console.log(chunkPart);
          }

          const component = arrOfComponentsFull[j];
          console.log(j, component);
          const result = chunkPart[component]; // Yes or No

          const transcript = arrOfChunks[i];

          if (typeof result === "undefined") {
            console.log("Error :(");
            console.log(chunkPart, component);
          }

          let template = fs.readFileSync("./controllers/evaluatePrompt.txt", "utf8");

          template = template.replace(/<<BUYER>>/g, buyer);
          template = template.replace(/<<SELLER>>/g, seller);
          template = template.replace(/<<TRANSCRIPT>>/g, transcript);
          template = template.replace(/<<N>>/g, n); // n
          template = template.replace(/<<TOTAL>>/g, TOTAL);

          if (typeof result !== "undefined") {
            if (result.toLowerCase().includes("yes")) {
              let prompt = template.replace(/<<CRM_COMPONENT>>/g, component);

              const response = await openai.createCompletion({
                model: "text-davinci-002",
                prompt,
                max_tokens: 1028,
                temperature: 0.7,
                top_p: 1,
              });

              // Add to results
              const result = response.data.choices[0].text.trim(); // Yes or No

              // Add to summary array
              const obj = summaryArray.find((o) => o.component === component);
              obj.arrStrings.push(result);
              console.log(obj);
            }
          }
        }
      }
      return final;
    }
    await step2(resultsExample);
    console.log("and now here", summaryArray);

    // // Step 3: Join all arrays in each arrString in summaryArray
    // summaryArray.forEach((obj, index) => {
    //   const arr = obj.arrStrings;
    //   const joined = arr.join(" ");
    //   summaryArray[index].arrStrings = joined;
    // });
    // console.log(summaryArray);

    return summaryArray;
  } catch (e) {
    console.log(e);
  }
};
