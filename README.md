# investigator
Interactive & asynchronous logging tool for Node.js. An easier way to log & debug complex requests directly from the command line. Still experimental.

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
`investigator` provides an `inspector` module to allow deep object logging directly in the command line interface, like a browser devtools inspector.

![investigator-inspector](https://cloud.githubusercontent.com/assets/5665322/10861607/e00c7506-7f86-11e5-8bd8-d3ae7a072c9d.png)
