
import { expect } from "chai";
import * as request from "request";

import { DummyWechatService } from "../src/support/dummy-wechat.service";

const baseUrl: string = "http://localhost:4200/";
const service = new DummyWechatService();

describe("Dummy wechat server tests", () => {

    beforeEach(() => { service.start(); });

    context("with no requests header", () => {
        it("Dummy wechat server can be started", async () => {
            request({ url: baseUrl }, (error, response, body) => {
                expect(body).equal("Wechat server is working.");
                service.stop();
            });
        });
    });

});
