import blessed from 'blessed';
import transceiver from 'transceiver';
import prune from 'json-prune';
import path from 'path';
import appRoot from 'app-root-path';

import tree from './tree';

export default class Inspector {
  constructor() {
    this.channel = transceiver.channel('log');

    this.element = tree({
      top: 'center',
      left: 'center',
      width: '90%',
      height: '75%',
      hidden: true,
      label: 'Inspector',
      tags: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: '#f0f0f0'
        },
      },
      template: {
        extend: '{bold}{green-fg} [+]{/}',
        retract: '{bold}{yellow-fg} [-]{/}',
        lines: true,
      }
    });
  }

  open(selectedLog) {
    if (!selectedLog || !selectedLog.data && !selectedLog.stackTrace) {
      return;
    }
    this.opened = true;
    this.element.show();
    this.element.focus();
    this.element.setData(this.prepareData(selectedLog));
  }

  close() {
    this.opened = false;
    this.element.hide();
  }

  prepareData(log) {
    const content = {};
    if (log.data) {
      content.data = JSON.parse(prune(log.data, {
        depthDecr: 7,
        replacer: (value, defaultValue, circular) => {
          if (typeof value === 'function') {
            return '"Function [pruned]"';
          }
          if (Array.isArray(value)) {
            return `"Array (${value.length}) [pruned]"`;
          }
          if (typeof value === 'object') {
            return '"Object [pruned]"';
          }
          return defaultValue;
        }
      }));
    }

    if (log.stackTrace) {
      content['stack trace'] = log.stackTrace.map((callsite) => {
        const relativePath = path.relative(appRoot.toString(), callsite.file);
        return {
          type: callsite.type,
          function: callsite.function,
          method: callsite.method,
          file: `${relativePath}:{yellow-fg}${callsite.line}{/yellow-fg}:{yellow-fg}${callsite.column}{/yellow-fg}`,
        };
      });
    }
    return this.formatData(content);
  }

  formatData(data, key, depth = 0) {
    depth++;
    if (typeof data === 'object') {
      if (data !== null) {
        let name;
        let extended;

        if (depth === 2) {
          name = `{yellow-fg}{bold}${key.toUpperCase()}{/bold}{/yellow-fg} {magenta-fg}(${data.length}){/magenta-fg}`;
          extended = key === 'data';
        } else {
          const type = (Array.isArray(data) ? `[Array] {magenta-fg}(${data.length}){/magenta-fg}` : '[Object]');
          name = `{blue-fg}{bold}${key ? key + ' ' : ''}{/bold}${type}{/blue-fg}`;
          extended = depth < 4;
        }
        const newObj = {
          children: {},
          name,
          extended
        };
        Object.keys(data).forEach((key) => {
          const child = this.formatData(data[key], key, depth);
          if (child) {
            newObj.children[key] = child;
          }
        });
        return newObj;
      }
    }
    if (typeof data === 'function') {
      return {
        name: `{blue-fg}${key}{/blue-fg}: {red-fg}{bold}[Function]{/}`,
      };
    }
    if (typeof data === 'number') {
      return {
        name: `{blue-fg}${key}{/blue-fg}: {yellow-fg}${data}{/}`,
      };
    }
    if (data === null) {
      return {
        name: `{blue-fg}${key}{/blue-fg}: {cyan-fg}{bold}null{/}`,
      };
    }
    return {
      name: `{blue-fg}${key}{/blue-fg}: ${data}`,
    };
  }
}
