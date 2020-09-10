const puppeteer = require("puppeteer");
const baseUrl = "https://catalog.kooymanbv.com/cur/main/";
const axios = require("axios");

const request = async (c) => {
  return new Promise(async (resolve, reject) => {
    var data = JSON.stringify({ product_id: c });

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
    let resp = await axios(config);
    resp = JSON.parse(resp.data.d);
    let product_price = null;
    let product_desc = null;
    let product_features = [];
    if (resp.productinfo) {
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

function chunk(arr, chunkSize) {
  var R = [];
  for (var i = 0, len = arr.length; i < len; i += chunkSize)
    R.push(arr.slice(i, i + chunkSize));
  return R;
}

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

const browserlauncher2 = async () => {
  let browsers = [];
  for (a = 0; a < 1; a++) {
    browsers.push(
      puppeteer.launch({
        headless: false,
      })
    );
  }

  return Promise.all(browsers);
};

const exec_browser = async (browser, array_index) => {
  let pages = [];
  for (var p = 1; p < 10; p++) {
    pages.push(await browser.newPage());
  }
  //
  //  Exexute navigate function on each page, return a promise
  //
  let promises = pages.map(function (page, index) {
    /*await page.setCookie({
        name: "ASP.NET_SessionId",
        value: "t5232xauak2nhvag4yebtsyc",
      });*/
    let array = R[array_index];
    return navigate(page, index, array);
  });

  //
  //  Wait for all the promises to resolve
  //

  return await Promise.all(promises);
};

const navigate = (page, index, array) => {
  return new Promise(async (resolve, reject) => {
    return page
      .goto(
        `https://catalog.kooymanbv.com/cur/main/product_classes.aspx?dept=${array[index]}`,
        {
          waitUntil: "networkidle2",
          timeout: 0,
        }
      )
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
      .catch((err) => {
        console.log("hata geldi");
        return resolve(false);
      });
  });
};

const exec_browser2 = async (browser, array_index, x) => {
  let pages = [];
  for (var p = 0; p < 3; p++) {
    pages.push(await browser.newPage());
  }
  //
  //  Exexute navigate function on each page, return a promise
  let Z = x;
  let promises = pages.map(function (page, index) {
    return navigate2(page, index, array_index, Z);
  });

  //
  //  Wait for all the promises to resolve
  //

  return await Promise.all(promises);
};

const navigate2 = (page, index, array_index, Z) => {
  return new Promise(async (resolve, reject) => {
    let A = Z[array_index];
    return page
      .goto(`${baseUrl}${A[index]}`, {
        waitUntil: "networkidle2",
        timeout: 0,
      })
      .then(async (e) => {
        return page.evaluate(async () => {
          document.querySelector(
            "#ContentPlaceHolder1_ddItems"
          ).selectedIndex = 3;
          await setTimeout(
            "__doPostBack('ctl00$ContentPlaceHolder1$ddItems','')",
            0
          );
        });
      })
      .then(async (e) => {
        let products = await page.evaluate(() => {
          a = document.querySelectorAll("a.self-center");
          b = [];
          for (i = 0; i < a.length; i++) {
            b.push(a[i].getAttribute("href"));
          }
          return b;
        });
        return resolve(products);
      })
      .catch((err) => {
        console.log("hata geldi");
        return resolve(false);
      });
  });
};

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

const product_link_ext = async (class_link, browser) => {
  return new Promise(async (resolve, reject) => {
    let page = await browser.newPage();
    return page
      .goto(`${baseUrl}${class_link}`, {
        waitUntil: "networkidle2",
        timeout: 20000,
      })
      .then(async (e) => {
        await page.select("#ContentPlaceHolder1_ddItems", "60");
        await page.waitFor(2500);
      })
      .then(async (e) => {
        let page_length = await page.evaluate(() => {
          return document
            .querySelector("#ContentPlaceHolder1_labelpaging")
            .textContent.split("of")[1]
            .trim();
        });
        console.log(page_length);
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
      });
  });
};

const main2 = async (Z) => {
  let browsers = await browserlauncher2();

  let promises = browsers.map((browser, index) => {
    return exec_browser2(browser, index, Z);
  });
  let output = await Promise.all(promises);
  return output;
};

const main3 = async () => {
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

const deneme = async () => {
  let classes = await main();
  console.log(classes);
  let Z = chunk(classes, 10);
  let sonuc = await main2(Z);
  console.log(sonuc);
};

main3();
