import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import redis from "../lib/redis";
import logger from "../lib/logger";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const initEmailWorker = () => {
  const worker = new Worker(
    "email_queue",
    async (job) => {
      const { to, subject, body } = job.data;

      logger.info(`Sending email to ${to}: ${subject}`);

      try {
        await transporter.sendMail({
          from: '"ResidentIQ" <noreply@residentiq.com>',
          to,
          subject,
          text: body,
          html: `<p>${body}</p>`,
        });
      } catch (error) {
        logger.error(`Failed to send email: ${error}`);
        throw error;
      }
    },
    {
      connection: redis.duplicate(),
    },
  );

  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} failed with error ${err.message}`);
  });

  return worker;
};
