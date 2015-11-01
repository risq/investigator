import shortid from 'shortid';
import transceiver from 'transceiver';

import LogItem from './ui/logItem';

class Agent {
  constructor({name, type, status, data, message, isAsync = false, ancestors}) {
    this.name = name;
    this.children = {};
    this.isAsync = isAsync;
    this.asyncState = this.isAsync ? 'pending' : null;
    this.type = type;
    this.status = status;

    if (!ancestors) {
      this.ancestors = [];
      this.isRoot = true;
    } else {
      this.ancestors = ancestors;
      this.parent = this.ancestors[this.ancestors.length - 1];
    }

    this.logItem = new LogItem({
      name: this.name,
      type: this.type,
      status: this.status,
      parent: this.parent ? this.parent.logItem : null,
      data: data,
      message: message,
    });

    return this;
  }

  log(...args) {
    new Agent({
      type: 'info',
      data: args,
      ancestors: this.ancestors.concat(this)
    });
    return this;
  }

  warn(...args) {
    new Agent({
      type: 'warn',
      data: args,
      ancestors: this.ancestors.concat(this)
    });
    return this;
  }

  success(...args) {
    new Agent({
      type: 'success',
      data: args,
      ancestors: this.ancestors.concat(this),
    });
    return this;
  }

  error(...args) {
    new Agent({
      type: 'error',
      data: args,
      ancestors: this.ancestors.concat(this),
    });
    return this;
  }

  child(name, ...args) {
    if (!this.children[name]) {
      this.children[name] = new Agent({
        name,
        type: 'node',
        ancestors: this.ancestors.concat(this),
      });
    }
    if (args.length) {
      this.children[name].log(...args);
    }
    return this.children[name];
  }

  async(name, ...args) {
    if (!this.children[name]) {
      this.children[name] = new Agent({
        name,
        type: 'async',
        status: 'pending',
        isAsync: true,
        ancestors: this.ancestors.concat(this),
      });
    }
    if (!this.children[name].isAsync) {
      this.internalWarn(`Child agent {bold}${name}{/bold} is defined as a non async agent`);
    }
    if (args.length) {
      this.children[name].log(...args);
    }
    return this.children[name];
  }

  resolve(...args) {
    if (this.isAsync) {
      if (this.logItem.status === 'pending') {
        this.logItem.setStatus('resolved');
        const resolveLog = new Agent({
          name: this.name,
          type: 'success',
          message: 'resolved',
          ancestors: this.ancestors.concat(this),
        });
        if (args.length) {
          resolveLog.success(...args);
        }
      } else {
        this.internalWarn(`Trying to resolve an already {bold}${this.logItem.status}{/bold} async agent`);
      }
    } else {
      this.internalWarn('Trying to resolve a non async agent');
    }
    return this;
  }

  reject(...args) {
    if (this.isAsync) {
      if (this.logItem.status === 'pending') {
        this.logItem.setStatus('rejected');
        const rejectLog = new Agent({
          name: this.name,
          type: 'error',
          message: 'rejected',
          ancestors: this.ancestors.concat(this),
        });
        if (args.length) {
          rejectLog.error(...args);
        }
      } else {
        this.internalWarn(`Trying to reject an already {bold}${this.logItem.status}{/bold} async agent`);
      }
    } else {
      this.internalWarn('Trying to reject a non async agent');
    }
    return this;
  }

  internalWarn(message) {
    new Agent({
      name: this.name,
      type: 'warn',
      message,
      ancestors: this.ancestors.concat(this),
    });
  }

  getAncestorsNames() {
    return this.ancestors.map(ancestor => ancestor.name);
  }
}

export default function(name, ...args) {
  return new Agent({
    name,
    type: 'root',
    data: args.length ? args : undefined,
  });
};
