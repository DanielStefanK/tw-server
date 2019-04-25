import { GraphQLServer } from 'graphql-yoga'
import { importSchema } from 'graphql-import'
import { createTypeormConn } from "./utils/createTypeormConn";
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { mergeSchemas, makeExecutableSchema } from "graphql-tools"
import { GraphQLSchema } from 'graphql';
import * as Redis from 'ioredis'
import { User } from './entity/User';

dotenv.config()
const port = process.env.NODE_ENV === "development" ? process.env.SERVER_PORT : process.env.TEST_SERVER_PORT

export const startServer = async () => {
  const schemas: GraphQLSchema[] = []
  const folders = fs.readdirSync(path.join(__dirname, "./modules"))
  folders.forEach((folder) => {
    const { resolvers } = require(`./modules/${folder}/resolvers`)
    const typeDefs = importSchema(path.join(__dirname, `./modules/${folder}/schema.graphql`))
    schemas.push(makeExecutableSchema({ resolvers, typeDefs }))
  })

  const redis = new Redis();

  const server = new GraphQLServer({
    schema: mergeSchemas({ schemas }),
    context: ({ request }) => ({ redis, url: request.protocol + "://" + request.get("host") })
  })

  // TODO: use a graphql endpoint to confirm
  server.express.get('/confirm/:id', async (req, res) => {
    const { id } = req.params
    const userId = await redis.get(id)

    if (userId) {
      User.update({ id: userId }, { confirmed: true })
      res.send('ok')
      return
    }

    res.status(404).send('Not found')
  })

  await createTypeormConn()
  const app = await server.start({ port, debug: true })
  console.log('Server is running on localhost:' + port)
  return app
}