# investigator
Interactive and asynchronous logging tool for Node.js. An easier way to log & debug complex requests directly from the command line. Still experimental !

![investigator](https://cloud.githubusercontent.com/assets/5665322/10861471/d38bedda-7f80-11e5-9bb7-19801c14c961.gif)

## Usage
#### Nodes
`investigator` uses a node based logging system. Log nodes (*agents*) can be nested to help organizing the different steps, synchronous or not, of the process. An `agent` is defined by its name and can be retrieved at any time in the scope of its parent agent.

![investigator-nodes](https://cloud.githubusercontent.com/assets/5665322/10861540/267ff6e6-7f84-11e5-847a-5b7d395dfb34.png)

```js
import {agent} from 'investigator';

const requestAgent = agent('request');
const getUserAgent = requestAgent.child('getUser')
  .log('Retrieving user from db...');

// ...

getUserAgent.success('Done !');
// Or: requestAgent.child('getUser').success('Done !');
```

#### Asynchronous logging
`async` agents are particular nodes which may be resolved or rejected to provide a feedback of their fulfillment.

![investigator-async](https://cloud.githubusercontent.com/assets/5665322/10861606/e00908b2-7f86-11e5-862a-ab56505d3ee3.png)

```js
import {agent} from 'investigator';

const requestAgent = agent('request');

// Creates an async child agent
const getUserAgent = requestAgent.async('getUser')
  .log('Retrieving user from db...');

myAsynchronousFunction().then(() => {
  getUserAgent.resolve('Done !');
}).catch((err) => {
  getUserAgent.reject(err);
});
```

#### Inspector
`investigator` provides an `inspector` module to allow deep object logging directly in the command line interface, like a browser devtools inspector. It also displays the current stack trace of each log.

![investigator-inspector](https://cloud.githubusercontent.com/assets/5665322/10861607/e00c7506-7f86-11e5-8bd8-d3ae7a072c9d.png)

## Installing
Use `npm install investigator` to install locally. See [Usage](#usage) and [API Reference](#api-reference) for more information.

## Shortcuts
In the command line interface, the following shortcuts are available:
- Scroll up and down with `up arrow`, `down arrow`, or mouse wheel. You may also click on a row to select it.
- Open **Inspector** with `i` (inspect the currently selected row).
- Scroll to bottom with `b`
- Enable auto-scroll with `s`. Disable by pressing an arrow key.

## Testing & developing
Clone the project with `git clone git@github.com:risq/investigator.git`.

Install dependencies with `npm install`.

Launch the example with `node examples/index.js`.

You can build the project (transpiling to ES5) with `npm run build`.

## TODO (non-exhaustive list)
- [ ] Log as traditional `console.log` (or use a multi-transport logging lib like [winston](https://github.com/winstonjs/winston)), then parse output stream in real time (or from a log file) with `investigator`.
- [ ] Improve UI, navigation & controls in the CLI.
- [ ] Add some performance monitoring.
- [ ] Improve CLI performance for long time logging (avoid memory leaks).
- [ ] Allow client-side logging via WebSockets.

## API Reference
### Investigator
##### `investigator.agent(String name [, data])` -> `Agent`
Creates a new *root* agent, with a given `name`. Data parameters of any type can also be passed to be logged into the command line interface.

```js
import {agent} from 'investigator';

onRequest(req, res) {
  const requestAgent = agent('request', req.id, req.url);
}
```

### Agent
##### `agent.log(data [, data])` -> `Agent`
Log passed data parameters under the given agent node. Returns the same agent (so it can be chained).

```js
import {agent} from 'investigator';

onRequest(req, res) {
  const requestAgent = agent('request', req.id, req.url);
  requestAgent.log('Hello')
    .log('World');
}
```

##### `agent.success(data [, data])` -> `Agent`
Log passed data parameters under the given agent node, as a success (displayed in green). Returns the same agent (so it can be chained).

##### `agent.warn(data [, data])` -> `Agent`
Log passed data parameters under the given agent node, as a warning (displayed in yellow). Returns the same agent (so it can be chained).

##### `agent.error(data [, data])` -> `Agent`
Log passed data parameters under the given agent node, as an error (displayed in red). Returns the same agent (so it can be chained).

##### `agent.child(name [, data])` -> `Agent`
Returns a child of the current agent, defined by its name. If a child with the given name already exists on the agent, it will be returned. If not, it will be created.

Data objects can be passed as parameters and will be logged on the child's context.

```js
import {agent} from 'investigator';

onRequest(req, res) {
  const requestAgent = agent('request', req.id, req.url);

  if (req.url === '/user/login') {
    requestAgent.child('login', 'Logging in...');

    if (validate(req.user, req.password)) {
      requestAgent.child('login')
        .success('Login data validated !');
    } else {
      requestAgent.child('login')
        .error('Error validating user data.')
    }
  }
}
```

##### `agent.async(name [, data])` -> `Agent`
Returns a **asynchronous** child of the current agent, defined by its name. If a child with the given name already exists on the agent, it will be returned. If not, it will be created.

Data objects can be passed as parameters and will be logged on the child's context.

An async agent has `.resolve()` and `.reject()` methods, to keep track of its fulfillment.

```js
import {agent} from 'investigator';

onRequest(req, res) {
  const requestAgent = agent('request', req.id, req.url);

  if (req.url === '/user/login') {
    requestAgent.child('login', 'Logging in...');

    authUser(req.user, req.password).then(() => {
      requestAgent.child('login')
        .success('Authentication succeeded !');
    }).catch((err) => {
      requestAgent.child('login')
        .error('Error validating user data.')
    });
  }
}
```

##### `agent.resolve(data [, data])` -> `Agent`
Resolves an **async** agent. Log data parameters under the given agent node, as a success. Returns the same agent (so it can be chained).

An async agent can only be resolved or rejected once.

##### `agent.reject(data [, data])` -> `Agent`
Resolves an **async** agent. Log data parameters under the given agent node, as an error. Returns the same agent (so it can be chained).

An async agent can only be resolved or rejected once.

## Contributing
Feel free to contribute ! Issues and pull requests are highly welcomed and appreciated.

## License
The MIT License (MIT)

Copyright (c) 2015 Valentin Ledrapier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
