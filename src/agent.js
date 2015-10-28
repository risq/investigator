import shortid from 'shortid';
import transceiver from 'transceiver';

import LogItem from './ui/logItem';

class Agent {
  constructor(name, options = {}) {
    this.name = name;
    this.children = {};
    this.isAsync = options.isAsync ? true : false;
    this.asyncState = this.isAsync ? 'pending' : null;
    this.type = options.type;
    this.status = options.status;
    if (!options.ancestors) {
      this.ancestors = [];
      this.isRoot = true;
    } else {
      this.ancestors = options.ancestors;
      this.parent = this.ancestors[this.ancestors.length - 1];
    }

    this.logItem = new LogItem({
      name: this.name,
      data: options.data,
      message: options.message,
      status: this.status,
      parent: this.parent ? this.parent.logItem : null,
      type: this.type,
    });

    return this;
  }

  log(...args) {
    new Agent(null, {
      data: args,
      type: 'info',
      ancestors: this.ancestors.concat(this)
    })
    return this;
  }

  warn(...args) {
    new Agent(null, {
      data: args,
      type: 'warn',
      ancestors: this.ancestors.concat(this)
    })
    return this;
  }

  success(...args) {
    new Agent(null, {
      data: args,
      type: 'success',
      ancestors: this.ancestors.concat(this)
    })
    return this;
  }

  error(...args) {
    new Agent(null, {
      data: args,
      type: 'error',
      ancestors: this.ancestors.concat(this)
    })
    return this;
  }

  child(name, ...args) {
    // console.log(this.ancestors, this)
    if (!this.children[name]) {
      this.children[name] = new Agent(name, {
        ancestors: this.ancestors.concat(this),
        type: 'child'
      });
    }
    if (args.length) {
      this.children[name].log(...args);
    }
    return this.children[name];
  }

  async(name, ...args) {
    if (!this.children[name]) {
      this.children[name] = new Agent(name, {
        isAsync: true,
        type: 'async',
        status: 'pending',
        ancestors: this.ancestors.concat(this)
      });
      if (args.length) {
        this.children[name].log(...args);
      }
      return this.children[name];
    }
    this.internalWarn(`async(${name}): child agent has already been defined`)
    return this;
  }

  resolve(...args) {
    if (this.isAsync) {
      if (this.logItem.status === 'pending') {
        this.logItem.setStatus('resolved');
        const resolveLog = new Agent(this.name, {
          ancestors: this.ancestors.concat(this),
          type: 'success',
          message: 'resolved',
        });
        if (args.length) {
          resolveLog.success(...args);
        }
      } else {
        this.internalWarn(`Trying to resolve an already ${this.logItem.status} async agent`);
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
        const rejectLog = new Agent(this.name, {
          ancestors: this.ancestors.concat(this),
          type: 'error',
          message: 'rejected',
        });
        if (args.length) {
          rejectLog.error(...args);
        }
      } else {
        this.internalWarn(`Trying to reject an already ${this.logItem.status} async agent`);
      }
    } else {
      this.internalWarn('Trying to reject a non async agent');
    }
    return this;
  }

  internalWarn(message) {
    new Agent(this.name, {
      ancestors: this.ancestors.concat(this),
      type: 'warn',
      message,
    });
  }

  getAncestorsNames() {
    return this.ancestors.map(ancestor => ancestor.name);
  }
}

export default function(name, ...args) {
  return new Agent(name, {
    data: args.length ? args : undefined,
    type: 'root',
  });
};
