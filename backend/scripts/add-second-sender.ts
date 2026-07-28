import fs from "node:fs";
import nodemailer from "nodemailer";

const envPath = ".env";
let envContent = fs.readFileSync(envPath, "utf8");

const match = envContent.match(/^ETHEREAL_ACCOUNTS_JSON=(.*)$/m);

if (!match) {
  throw new Error("ETHEREAL_ACCOUNTS_JSON was not found in .env");
}

const existingAccounts = JSON.parse(match[1]) as Array<Record<string, unknown>>;
const account = await nodemailer.createTestAccount();

const newSender = {
  key: `sender-${Date.now()}`,
  name: "ReachInbox Sender B",
  email: account.user,
  user: account.user,
  pass: account.pass,
  host: "smtp.ethereal.email",
  port: 587,
  secure: false
};

const updatedAccounts = [...existingAccounts, newSender];

envContent = envContent.replace(
  /^ETHEREAL_ACCOUNTS_JSON=.*$/m,
  `ETHEREAL_ACCOUNTS_JSON=${JSON.stringify(updatedAccounts)}`
);

fs.writeFileSync(envPath, envContent, "utf8");

console.log("Second Ethereal sender created.");
console.log(`Sender email: ${account.user}`);
console.log("The SMTP password was saved securely and was not displayed.");
