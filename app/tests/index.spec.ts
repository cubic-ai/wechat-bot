import { expect } from "chai";
import * as request from "request";

import { DummyWechatService } from "./dummy-wechat.service";

const baseUrl: string = "http://localhost:4200/";
const service = new DummyWechatService();

describe("Dummy wechat server tests", () => {

    beforeEach(() => { service.start(); });

    it("Dummy wechat server can be started", () => {
        request({ url: baseUrl }, (error, response, body) => {
            expect(body).equal("Wechat server is working.");
            service.stop();
        });
    });
});

describe("The bot is able to login", () => {
    beforeEach(() => { service.start(); });

    it("The bot is able to fetch valid UUID", () => {
        // TODO:
        service.stop();
    });
});
