const playwright = require("playwright");
const fs = require("fs");
const download = require("image-downloader");

var allLinksJson = require("../links/data.json");
var configJson = require("../config.json");

// Function to write in a file
function writeInFile(key, content) {
  fs.appendFile(key + "/" + key + ".csv", content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Successfully written data to file");
  });
}

// Function to download a picture
function downloadPicture(key, ref, link) {
  download
    .image({
      url: link,
      dest: "../../data/" + key + "/" + ref + ".png",
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
    .replace(/(\r\n|\n|\r)/g, "");
  return str;
}

// Function to fetch data from one page
async function fetchOnePage(page, link, key) {
  // Create the folder if it doesn't exist
  if (!fs.existsSync(key)) {
    fs.mkdirSync(key);
  }

  let siteConfigObject = configJson.sites.find(
    (site) => site.link.name === key
  );

  // Go to the page
  await page.goto(link);

  // Get the data
  const id = await page.locator(siteConfigObject.data.id.selector).innerText();

  let finalInformationsString = id + "\t";
  for (const dataToFetch of siteConfigObject.data.informations) {
    const fetchedData = (
      await page.locator(dataToFetch.selector).allTextContents()
    )
      .map((txt) => removeNewlines(txt))
      .join(" / ");
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
