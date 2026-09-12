import "dotenv/config";

export default {
  earlyAccess: true,
  schema: {
    kind: "single",
    filePath: "prisma/schema.prisma",
  },
  datasource: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
};
