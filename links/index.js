const playwright = require("playwright");
const fs = require("fs");
var configJson = require("../config.json");

// Function to scroll to the bottom of the page
async function infiniteScroll(page) {
  console.log("Scrolling to the bottom of the page...");
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

async function main() {
  const browser = await playwright.chromium.launch({
    headless: false,
  });

  const scrappedLinksObject = configJson.sites.map((site) => site.link);
  const page = await browser.newPage();

  fs.appendFile("data.json", "{", (err) => {
    if (err) throw err;
  });

  for (const scrappedLink of scrappedLinksObject) {
    // If the number of pages is 0, it means that we have infinite scrolling
    if (scrappedLink.nbPage === 0) {
      // Go to the page
      await page.goto(scrappedLink.url);

      // Scroll to the bottom of the page
      await infiniteScroll(page);

      if (scrappedLink.loadMoreBtnSelector !== undefined || null) {
        while (
          await page.locator(scrappedLink.loadMoreBtnSelector).isVisible()
        ) {
          await page
            .locator(scrappedLink.loadMoreBtnSelector)
            .click({ force: true });
          await infiniteScroll(page);
        }
      }

      // Get all the links
      // Selector must be <a> tag
      const links = await page.$$eval(scrappedLink.itemsSelector, (el) => {
        return el.map((e) => e.href);
      });

      // Write the links in a file
      const finalObject = {
        [scrappedLink.name]: links,
      };

      let data = JSON.stringify(finalObject);
      fs.appendFile("data.json", data.slice(1, data.length - 1), (err) => {
        if (err) throw err;
      });
    } else {
      // If the number of pages is not 0, it means that we have to go to each page
      let allLinks = [];
      for (let i = 1; i <= scrappedLink.nbPage; i++) {
        // Go to the page
        await page.goto(scrappedLink.url + i);

        // Get all the links
        // Selector must be <a> tag
        const links = await page.$$eval(scrappedLink.itemsSelector, (el) => {
          return el.map((e) => e.href);
        });

        allLinks = allLinks.concat(links);

        console.log(scrappedLink.name + " : Page " + i + " done !");
      }

      // Write the links in a file
      const finalObject = {
        [scrappedLink.name]: allLinks,
      };

      let data = JSON.stringify(finalObject);
      fs.appendFile("data.json", data.slice(1, data.length - 1), (err) => {
        if (err) throw err;
      });
    }

    if (
      scrappedLinksObject.indexOf(scrappedLink) !==
      scrappedLinksObject.length - 1
    ) {
      console.log("append");
      fs.appendFile("data.json", ",", (err) => {
        if (err) throw err;
      });
    } else {
      fs.appendFile("data.json", "}", (err) => {
        if (err) throw err;
      });
    }
  }
  await browser.close();
}

main();
