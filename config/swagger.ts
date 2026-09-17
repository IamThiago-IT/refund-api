import path from "node:path"
import url from "node:url"

export default {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + "/../",
  info: {
    title: "Refund API",
    version: "1.0.0",
    description: "API REST para gerenciamento de solicitações de reembolso com comprovantes",
  },
  snakeCase: true,
  debug: false,
  ignore: ["/swagger", "/docs"],
  tagIndex: 2,
  common: {
    parameters: {},
    headers: {},
  },
}
