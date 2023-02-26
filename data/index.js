const playwright = require("playwright");
const fs = require("fs");
const download = require("image-downloader");

var allLinksJson = require("../links/data.json");
var configJson = require("../config.json");

// Function to write in a file
function writeInFile(key, content) {
  // Create the folder if it doesn't exist
  if (!fs.existsSync(key)) {
    fs.mkdirSync(key);
  }

  fs.appendFile(key + "/" + key + ".csv", content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

// Function to download a picture
function downloadPicture(key, ref, link) {
  // Create the folder if it doesn't exist
  if (!fs.existsSync(key)) {
    fs.mkdirSync(key);
  }

  download
    .image({
      url: link,
      dest: "../../data/" + key + "/" + ref + ".png",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    .then(({ filename }) => {
      console.log("Saved to", filename);
    })
    .catch((err) => console.error(err));
}

// Function to remove line breaks
function removeNewlines(str) {
  str = str.replace(/\s{2,}/g, " ");
  str = str.replace(/\t/g, " ");
  str = str
    .toString()
    .trim()
    .replace(/(\r\n|\n|\r)/g, " ");
  return str;
}

// Function to fetch data from one page
async function fetchOnePage(page, link, key) {
  let siteConfigObject = configJson.sites.find(
    (site) => site.link.name === key
  );

  // Go to the page
  await page.goto(link);

  // Get the data
  const id = await page
    .locator(siteConfigObject.data.id.selector)
    .first()
    .innerText();

  let finalInformationsString = id + "\t";
  for (const dataToFetch of siteConfigObject.data.informations) {
    const fetchedData = dataToFetch.multiple
      ? (await page.locator(dataToFetch.selector).allTextContents())
          .map((txt) => removeNewlines(txt))
          .join(" / ")
      : removeNewlines(
          await page.locator(dataToFetch.selector).first().innerText()
        );

    finalInformationsString +=
      fetchedData +
      (siteConfigObject.data.informations.indexOf(dataToFetch) ===
      siteConfigObject.data.informations.length - 1
        ? ""
        : "\t");
  }

  // Get the image link
  const imgLink =
    siteConfigObject.data.img.baseUrl +
    (await page
      .locator(siteConfigObject.data.img.selector)
      .first()
      .getAttribute("src"));

  // Write the data in a file
  writeInFile(key, finalInformationsString + "\r\n");

  // Download the image
  downloadPicture(key, id, imgLink);
}

async function main() {
  const browser = await playwright.chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();

  for (key in allLinksJson) {
    configKey = configJson.sites.find((site) => site.link.name === key);
    let categoryString =
      configKey.data.id.name +
      "\t" +
      configKey.data.informations.map((data) => data.name).join("\t");

    writeInFile(key, categoryString + "\r\n");
    for (link of allLinksJson[key]) {
      await fetchOnePage(page, link, key);
      await page.waitForTimeout(1000);
      console.log(
        key +
          " : " +
          (allLinksJson[key].indexOf(link) + 1) +
          "/" +
          allLinksJson[key].length
      );
    }
  }
  await browser.close();
}

main();
