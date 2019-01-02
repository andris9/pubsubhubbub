/* eslint no-unused-expressions: 0 */

'use strict';

const expect = require('chai').expect;
const request = require('request');
const crypto = require('crypto');
const pubSubHubbub = require('../src/pubsubhubbub');

let pubsub = pubSubHubbub.createServer({
    callbackUrl: 'http://localhost:8000/callback',
    secret: 'MyTopSecret',
    username: 'Test',
    password: 'P@ssw0rd',
    sendImmediately: true
});

let response_body = 'This is a response.';
let hub_encryption = crypto
    .createHmac('sha1', pubsub.secret)
    .update(response_body)
    .digest('hex');

describe('pubsubhubbub notification', () => {
    beforeEach(() => {
        pubsub.listen(8000);
    });

    afterEach(() => {
        pubsub.server.close();
    });

    it('should return 400 - no topic', done => {
        let options = {
            url: 'http://localhost:8000',
            headers: {
                link: '<http://pubsubhubbub.appspot.com/>; rel="hub"'
            }
        };
        request.post(options, (err, res) => {
            expect(err).to.not.exist;
            expect(res.statusCode).to.equal(400);
            done();
        });
    });

    it('should return 403 - no X-Hub-Signature', done => {
        let options = {
            url: 'http://localhost:8000',
            headers: {
                link: '<http://test.com>; rel="self", <http://pubsubhubbub.appspot.com/>; rel="hub"'
            }
        };
        request.post(options, (err, res) => {
            expect(err).to.not.exist;
            expect(res.statusCode).to.equal(403);
            done();
        });
    });

    it('should return 202 - signature does not match', done => {
        let options = {
            url: 'http://localhost:8000',
            headers: {
                'X-Hub-Signature': 'sha1=' + hub_encryption,
                link: '<http://test.com>; rel="self", <http://pubsubhubbub.appspot.com/>; rel="hub"'
            },
            body: response_body + 'potentially malicious content'
        };
        request.post(options, (err, res) => {
            expect(err).to.not.exist;
            expect(res.statusCode).to.equal(202);
            done();
        });
    });

    it('should return 204 - sucessful request', done => {
        let options = {
            url: 'http://localhost:8000',
            headers: {
                'X-Hub-Signature': 'sha1=' + hub_encryption,
                link: '<http://test.com>; rel="self", <http://pubsubhubbub.appspot.com/>; rel="hub"'
            },
            body: response_body
        };
        request.post(options, (err, res) => {
            expect(err).to.not.exist;
            expect(res.statusCode).to.equal(204);
            done();
        });
    });

    it('should return 204 (without quotations on the rel) - successful request', done => {
        let options = {
            url: 'http://localhost:8000',
            headers: {
                'X-Hub-Signature': 'sha1=' + hub_encryption,
                link: '<http://test.com>; rel=self, <http://pubsubhubbub.appspot.com/>; rel=hub'
            },
            body: response_body
        };

        request.post(options, (err, res) => {
            expect(err).to.not.exist;
            expect(res.statusCode).to.equal(204);
            done();
        });
    });

    it('should emit a feed event - successful request', done => {
        let eventFired = false;
        let options = {
            url: 'http://localhost:8000',
            headers: {
                'X-Hub-Signature': 'sha1=' + hub_encryption,
                link: '<http://test.com>; rel="self", <http://pubsubhubbub.appspot.com/>; rel="hub"'
            },
            body: response_body
        };
        request.post(options, () => {});

        pubsub.on('feed', () => {
            eventFired = true;
        });

        setTimeout(() => {
            expect(eventFired).to.equal(true);
            done();
        }, 10);
    });

    it('should not emit a feed event - signature does not match', done => {
        let eventFired = false;
        let options = {
            url: 'http://localhost:8000',
            headers: {
                'X-Hub-Signature': 'sha1=' + hub_encryption,
                link: '<http://test.com>; rel="self", <http://pubsubhubbub.appspot.com/>; rel="hub"'
            },
            body: response_body + 'potentially malicious content'
        };
        request.post(options, () => {});

        pubsub.on('feed', () => {
            eventFired = true;
        });

        setTimeout(() => {
            expect(eventFired).to.equal(false);
            done();
        }, 10);
    });
});

describe('pubsubhubbub creation', () => {
    it('pubsub should exist', () => {
        expect(pubsub).to.exist;
    });

    it('options passed correctly', () => {
        expect(pubsub.callbackUrl).to.equal('http://localhost:8000/callback');
        expect(pubsub.secret).to.equal('MyTopSecret');
    });

    it('create authentication object', () => {
        expect(pubsub.auth).to.exist;
        expect(pubsub.auth.user).to.equal('Test');
        expect(pubsub.auth.pass).to.equal('P@ssw0rd');

        expect(pubsub.auth).to.eql({
            user: 'Test',
            pass: 'P@ssw0rd',
            sendImmediately: false || true
        });
    });
});
