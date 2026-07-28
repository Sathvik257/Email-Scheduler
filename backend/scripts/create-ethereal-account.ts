import nodemailer from "nodemailer";

const account = await nodemailer.createTestAccount();

console.log("\nAdd this object to ETHEREAL_ACCOUNTS_JSON:\n");
console.log(
  JSON.stringify(
    {
      key: `sender-${Date.now()}`,
      name: "ReachInbox Sender",
      email: account.user,
      user: account.user,
      pass: account.pass,
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
    },
    null,
    2,
  ),
);
