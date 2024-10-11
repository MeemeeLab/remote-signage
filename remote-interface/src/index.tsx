import express from "express";
import { strict as assert } from "assert";
import { fetch, Agent } from "undici";
import ChildProcess from "child_process";

const nodeHost = process.env["HOST"];
const nodePort = process.env["PORT"] ? parseInt(process.env["PORT"]) : 80;

assert(nodeHost);
assert(nodePort);

const nodeHostString = nodeHost + ":" + nodePort.toString();

function response(html: () => Promise<string>) {
    return async (_req: express.Request, res: express.Response) => {
        res.status(200).end((await html()).toString());
    };
}

async function getCurrentText() {
    return fetch("http://0.0.0.0/text", {
        dispatcher: new Agent({
            connect: {
                socketPath: "/tmp/remote-signage.sock"
            }
        })
    }).then((resp) => resp.json() as Promise<string>);
}

async function updateCurrentText(text: string) {
    return fetch("http://0.0.0.0/text", {
        dispatcher: new Agent({
            connect: {
                socketPath: "/tmp/remote-signage.sock"
            }
        }),
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
    });
}

const app = express();
app.use((req, res, next) => {
    console.log(req.method, req.path, req.header("Host"));

    const host = req.header("Host");
    if (host !== nodeHost && host !== nodeHostString) {
        res.redirect("http://" + nodeHostString);
        return;
    }
    next();
});

app.use(express.static("./assets/static"));
app.use(express.urlencoded({ extended: true }));

function Body({ text }: { text?: string }) {
    return <>
        <div class="container">
            <div class="box">
                <h1 class="title has-text-centered">
                    {text}
                </h1>
            </div>
            <form>
                <div class="box">
                    <div class="field">
                        <label class="label">表示</label>
                        <div class="control">
                            <input
                                name="text"
                                class="input"
                                type="text"
                                placeholder="1234..."
                                {...(text ? { value: text } : {})}
                            />
                        </div>
                    </div>
                </div>
                <div class="box">
                    <div class="field is-grouped">
                        <div class="control">
                            <button
                                class="button is-link"
                                hx-post="/update"
                                hx-target="body"
                            >
                                更新
                            </button>
                        </div>
                        <div class="control">
                            <button
                                class="button is-link is-danger"
                                hx-post="/shutdown"
                                hx-confirm="シャットダウンしますか?"
                                hx-target="body"
                            >
                                シャットダウン
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </>;
}

app.get("/", response(async () => <>
    <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Remote Signage</title>
            <link rel="stylesheet" href="/bulma.min.css" />
            <script src="/htmx.min.js" />
        </head>
        <body class="m-3">
            <Body text={await getCurrentText()} />
        </body>
    </html>
</>));

app.post("/update", async (req, res) => {
    await updateCurrentText(req.body.text);
    res.status(200).end(
        (<Body text={req.body.text} />).toString()
    );
});

app.post("/shutdown", (_req, res) => {
    ChildProcess.spawnSync("shutdown", ["now"]);
    res.status(200).end();
});

app.listen(nodePort);
