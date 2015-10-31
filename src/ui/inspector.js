import blessed from 'blessed';
import transceiver from 'transceiver';
import prune from 'json-prune';

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
    if (!selectedLog || !selectedLog.data) {
      return;
    }
    this.opened = true;
    this.element.show();
    this.element.focus();
    this.element.setData(this.formatData(JSON.parse(prune(selectedLog.data, {
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
    }))));
  }

  close() {
    this.opened = false;
    this.element.hide();
  }

  formatData(data, key, depth = 0) {
    depth++;
    if (typeof data === 'object') {
      if (data !== null) {
        const type = (Array.isArray(data) ? `[Array] {magenta-fg}(${data.length}){/magenta-fg}` : '[Object]');
        const keyName = key ? key + ' ' : '';
        const newObj = {
          children: {},
          name: `{blue-fg}{bold}${keyName}{/bold}${type}{/blue-fg}`,
          extended: depth < 3
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
