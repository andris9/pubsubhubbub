var express = require("express"),
    app = express(),

    pubSubHubbub = require("../index"),
    crypto = require("crypto"),
    
    PORT = 1337,
    HOST = "kreata.ee",
    PATH = "/pubSubHubbub",

    pubsub = pubSubHubbub.createServer({
        callbackUrl: "http://" + HOST + (PORT && PORT != 80 ? ":" + PORT : "") + PATH,
        secret: "MyTopSecret"
    }),
    
    topic = "http://testetstetss.blogspot.com/feeds/posts/default",
    hub = "http://pubsubhubbub.appspot.com/";

app.use(PATH, pubsub.listener());

// default response
app.use(function(req, res, next){
    res.send("Hello World");
});

app.listen(PORT);

pubsub.on("denied", function(data){
    console.log("Denied");
    console.log(data);
});

pubsub.on("subscribe", function(data){
    console.log("Subscribe");
    console.log(data);

    console.log("Subscribed "+topic+" to "+hub);
});

pubsub.on("unsubscribe", function(data){
    console.log("Unsubscribe");
    console.log(data);

    console.log("Unsubscribed "+topic+" from "+hub);
});

pubsub.on("error", function(error){
    console.log("Error");
    console.log(error);
});

pubsub.on("feed", function(data){
    console.log(data)
    console.log(data.feed.toString());

    pubsub.unsubscribe(topic, hub);
});

pubsub.on("listen", function(){
    console.log("Server listening on port %s", pubsub.port);
    pubsub.subscribe(topic, hub);
});