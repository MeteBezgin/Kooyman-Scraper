const puppeteer = require("puppeteer");
const baseUrl = "https://catalog.kooymanbv.com/cur/main/";
const axios = require("axios");

/**
 *
 * @param {Object} c - product_id
 * @returns {Object} - product_data
 */
//Function to send a POST request to the site to get a JS object of product data.
const request = async (c) => {
  return new Promise(async (resolve, reject) => {
    var data = JSON.stringify({ product_id: c });

    //Setting the header of the request
    var config = {
      method: "post",
      url:
        "https://catalog.kooymanbv.com/cur/main/Product_information.aspx/getProductInfo",
      headers: {
        "Content-Type": "application/json",
        Cookie: "ASP.NET_SessionId=t5232xauak2nhvag4yebtsyc",
      },
      data: data,
    };
    //The response of the request
    let resp = await axios(config);
    resp = JSON.parse(resp.data.d);
    //The selected variables are not always existing in the product so we dont declare the type of them.
    let product_price = null;
    let product_desc = null;
    let product_features = [];
    if (resp.productinfo) {
      //Getting the data we want from the response of the request.
      product_price = resp.productinfo.table[0].price;
      product_desc = resp.productinfo.table[0].Description;
    }
    if (resp.features) {
      for (i = 0; i < resp.features.table.length; i++) {
        product_features.push(resp.features.table[i].feature_name);
      }
      product_features = product_features.join("\n");
    }

    return resolve({
      product_price,
      product_desc,
      product_features,
    });
  });
};

//A chunking function to chunk arrays to desired size.
function chunk(arr, chunkSize) {
  var R = [];
  for (var i = 0, len = arr.length; i < len; i += chunkSize)
    R.push(arr.slice(i, i + chunkSize));
  return R;
}

//Department numbers of the site to use in url.
dept_numbers = [
  "16",
  "13",
  "20",
  "12",
  "10",
  "14",
  "11",
  "41",
  "42",
  "43",
  "51",
  "45",
  "46",
  "47",
  "18",
  "44",
  "19",
  "40",
  "50",
  "48",
  "21",
  "15",
];

//Function to launch browsers and pushing them into a browsers array.
const browserlauncher = async () => {
  let browsers = [];
  for (a = 1; a < 4; a++) {
    browsers.push(
      puppeteer.launch({
        headless: false,
      })
    );
  }

  return Promise.all(browsers);
};

//A function to open pages on a browser and push them into a pages array, then execute "navigate" function to all of the pages.
const exec_browser = async (browser, array_index) => {
  let pages = [];
  for (var p = 1; p < 10; p++) {
    pages.push(await browser.newPage());
  }
  //  Execute "navigate" function on each page, return a promise
  let promises = pages.map(function (page, index) {
    let array = R[array_index];
    return navigate(page, index, array);
  });
  //  Wait for all the promises to resolve
  return await Promise.all(promises);
};

//Function to navigate to site and get the product classes for each department.
const navigate = (page, index, array) => {
  return new Promise(async (resolve, reject) => {
    //Navigation.
    return (
      page
        .goto(
          `https://catalog.kooymanbv.com/cur/main/product_classes.aspx?dept=${array[index]}`,
          {
            waitUntil: "networkidle2",
            timeout: 0,
          }
        )
        //Getting the data off the specified selector and pushing it to an array after the promise is resolved.
        .then(async (e) => {
          let link = await page.evaluate(() => {
            let a = document.querySelector("div.mt-10").querySelectorAll("a");
            console.log(a.length);
            let b = [];
            for (i = 0; i < a.length; i++) {
              b.push(a[i].getAttribute("href"));
            }
            return b;
          });
          return resolve(link);
        })
        //A catch function to catch any errors if any of them occurs.
        .catch((err) => {
          console.log("hata geldi");
          return resolve(false);
        })
    );
  });
};

//The main function that calls the other functions to return the "Product Classes" as "output".
const main = async () => {
  R = await chunk(dept_numbers, 9);
  browsers = await browserlauncher();
  let promises = browsers.map((browser, index) => {
    return exec_browser(browser, index);
  });
  let output1 = await Promise.all(promises);
  output = output1.flat(Infinity);
  browsers.map((browser) => {
    browser.close();
  });
  browsers.length = 0;
  return output;
};

//Function to get all product urls for each Product Class.
const product_link_ext = async (class_link, browser) => {
  return new Promise(async (resolve, reject) => {
    let page = await browser.newPage();
    //Navigation.
    return (
      page
        .goto(`${baseUrl}${class_link}`, {
          waitUntil: "networkidle2",
          timeout: 20000,
        })
        //Selecting the button to show 60 items per page and waiting 2.5 secs for it to refresh.
        .then(async (e) => {
          await page.select("#ContentPlaceHolder1_ddItems", "60");
          await page.waitFor(2500);
        })
        //Getting the page count.
        .then(async (e) => {
          let page_length = await page.evaluate(() => {
            return document
              .querySelector("#ContentPlaceHolder1_labelpaging")
              .textContent.split("of")[1]
              .trim();
          });
          //If the page count is greater than 1, after getting all the product links on page 1, navigate to the other pages and get all the data there as well.
          let all_products = [];
          for (i = 1; i <= parseInt(page_length); i++) {
            let products = await page.evaluate(async () => {
              a = document.querySelectorAll("a.self-center");
              b = [];
              for (i = 0; i < a.length; i++) {
                b.push(a[i].getAttribute("href"));
              }
              return b;
            });
            all_products.push(...products);
            await page.click("i.rounded-r-sm");
            await page.waitFor(2500);
          }
          await page.close();
          return resolve(all_products);
        })
        .catch(async (err) => {
          console.log(err);
          await page.close();
          return resolve(false);
        })
    );
  });
};

//The second main function to call the first one and get classes, then get product links and then send a POST request for each "product_id"
//and return a JS object containing the product data.
const main2 = async () => {
  let classes = await main();
  let Y = chunk(classes, 10);
  let browser = await puppeteer.launch({ headless: false });
  let Result = [];
  for (i = 0; i < Y.length; i++) {
    let promises = Y[i].map((val, idx) => {
      return product_link_ext(val, browser);
    });
    let cıktı = await Promise.all(promises);
    Result.push(cıktı);
  }

  let Q = Result.flat(Infinity);
  console.log(Q);
  let T = Q.map((value, index) => {
    if (value) {
      product_id = parseInt(value.split("product=").pop().split("&dept")[0]);
      return request(product_id);
    }
  });
  T = await Promise.all(T);
  console.log(T);
};
main2();
