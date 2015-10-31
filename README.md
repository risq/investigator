# investigator
An experimental command line logging & debugging tool, for Node.js.

![investigator](https://cloud.githubusercontent.com/assets/5665322/10861471/d38bedda-7f80-11e5-9bb7-19801c14c961.gif)

## Logging
#### Nodes
`investigator` uses a node based logging system. Log nodes can be nested to help organizing the different steps, synchronous or not, of the process.

![investigator-nodes](https://cloud.githubusercontent.com/assets/5665322/10861540/267ff6e6-7f84-11e5-847a-5b7d395dfb34.png)

#### Asynchronous logging
`async` nodes are particular log nodes which may be resolved or rejected to provide a feedback of their fulfillment.

![investigator-async](https://cloud.githubusercontent.com/assets/5665322/10861606/e00908b2-7f86-11e5-862a-ab56505d3ee3.png)

#### Inspector
`investigator` provides an `inspector` module to allow deep object logging directly in the command line interface, like a browser devtools inspector.

![investigator-inspector](https://cloud.githubusercontent.com/assets/5665322/10861607/e00c7506-7f86-11e5-8bd8-d3ae7a072c9d.png)
