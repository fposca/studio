import { defineConfig } from "vite";

export default defineConfig({
  plugins: [{
    name: "interbanking-trailing-slash",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url === "/interbanking" || request.url?.startsWith("/interbanking?")) {
          response.statusCode = 308;
          response.setHeader("Location", `/interbanking/${request.url.slice("/interbanking".length)}`);
          response.end();
          return;
        }
        next();
      });
    }
  }],
  server: {
    watch: {
      ignored: ["**/server/work/**"]
    }
  }
});
