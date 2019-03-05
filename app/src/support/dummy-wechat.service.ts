import * as express from "express";
import { Server } from "http";

export class DummyWechatService {

    private readonly app = express();
    private readonly port: number = 4200;
    private server: Server;

    constructor() {
        this.registerApiPoints();
    }

    public start() {
        this.server = this.app.listen(this.port);
    }

    public stop() {
        if (this.server) {
            this.server.close();
        }
    }

    public registerApiPoints() {
        this.app.get("/", (request, response) => {
            response.send("Wechat server is working.");
        });
    }
}
