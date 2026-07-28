import fs from "node:fs";
import nodemailer from "nodemailer";

const account = await nodemailer.createTestAccount();

const sender = {
  key: `sender-${Date.now()}`,
  name: "ReachInbox Sender",
  email: account.user,
  user: account.user,
  pass: account.pass,
  host: "smtp.ethereal.email",
  port: 587,
  secure: false
};

const envPath = ".env";
let envContent = fs.readFileSync(envPath, "utf8");

const etherealValue = JSON.stringify([sender]);

if (/^ETHEREAL_ACCOUNTS_JSON=.*$/m.test(envContent)) {
  envContent = envContent.replace(
    /^ETHEREAL_ACCOUNTS_JSON=.*$/m,
    `ETHEREAL_ACCOUNTS_JSON=${etherealValue}`
  );
} else {
  envContent += `\nETHEREAL_ACCOUNTS_JSON=${etherealValue}\n`;
}

fs.writeFileSync(envPath, envContent, "utf8");

console.log("Fresh Ethereal account created.");
console.log("The account was saved securely in backend/.env");
console.log(`Sender email: ${account.user}`);
console.log("The SMTP password was not printed.");
