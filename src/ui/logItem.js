import blessed from 'blessed';
import shortid from 'shortid';
import transceiver from 'transceiver';
import prune from 'json-prune';
import dateFormat from 'dateformat';

export default class LogItem {
  constructor(options) {
    this.id = shortid.generate();
    this.data = options.data;
    this.type = options.type;
    this.status = options.status;
    this.message = options.message;
    this.name = options.name;
    this.date = options.date || Date.now();
    this.channel = transceiver.channel('log');
    this.children = [];

    if (options.parent) {
      this.depth = options.parent.depth + 1;
      this.parent = options.parent;
      this.previousLog = options.parent.getLastChild() || options.parent;
      this.relativeDuration = this.getRelativeDuration();
      this.parent.addChild(this);
    } else {
      this.depth = 0;
    }
    this.element = this.channel.request('addLog', this);
    this.update();
  }

  update() {
    if (this.element) {
      this.element.content = this.render();
      transceiver.request('ui', 'render');
    }
  }

  render() {
    let message = `${this.renderState()}${this.renderName()}${this.renderMessage()}${this.renderData()}${this.renderDate()}${this.renderDuration()}`;
    for (let i = 0; i < this.depth; i++) {
      message = '    ' + message;
    }
    return message;
  }

  renderState() {
    if (this.type === 'async' && this.status === 'pending') {
      return `{cyan-fg}[⌛]{/cyan-fg} `;
    }
    if (this.type === 'async' && this.status === 'resolved') {
      return `{green-fg}[✔]{/green-fg} `;
    }
    if (this.type === 'async' && this.status === 'rejected') {
      return `{red-fg}[✘]{/red-fg} `;
    }
    if (this.type === 'success') {
      return `{green-fg}✔{/green-fg} `;
    }
    if (this.type === 'error') {
      return `{red-fg}✘{/red-fg} `;
    }
    if (this.type === 'warn') {
      return `{yellow-fg}❗{/yellow-fg} `;
    }
    if (this.type === 'info') {
      return '⇢ ';
    }
    return '';
  }

  renderName() {
    if (this.depth === 0) {
      return this.name ? `{underline}{bold}${this.name}{/bold}{/underline} ` : '';
    }
    if (this.type === 'async') {
      if (this.status === 'resolved') {
        return `{bold}{green-fg}${this.name}{/green-fg}{/bold} (async) `;
      }
      if (this.status === 'rejected') {
        return `{bold}{red-fg}${this.name}{/red-fg}{/bold} (async) `;
      }
      return `{bold}${this.name}{/bold} (async) `;
    }
    if (this.type === 'success') {
      return this.name ? `{bold}{green-fg}${this.name}{/green-fg}{/bold} ` : '';
    }
    if (this.type === 'error') {
      return this.name ? `{bold}{red-fg}${this.name}{/red-fg}{/bold} ` : '';
    }
    if (this.type === 'warn') {
      return this.name ? `{bold}{yellow-fg}${this.name}{/yellow-fg}{/bold} ` : '';
    }
    return this.name ? `{bold}${this.name}{/bold} ` : '';
  }

  renderData() {
    if (this.depth === 0) {
      // console.log(this.data);
    }
    if (!this.data) {
      return '';
    }
    if (Array.isArray(this.data)) {
      return this.data.map(this.renderValue.bind(this)).join(' ') + ' ';
    }
    return this.renderValue(this.data) + ' ';
  }

  renderValue(value) {
    if (Array.isArray(value)) {
      return `{cyan-fg}${this.prune(value)}{/cyan-fg}`;
    }
    if (typeof value === 'object') {
      return `{blue-fg}${this.prune(value)}{/blue-fg}`;
    }
    if (typeof value === 'function') {
      return `{red-fg}{bold}[Function]{/bold}{red-fg}`
    }
    if (typeof value === 'number') {
      return `{yellow-fg}${value}{/yellow-fg}`
    }
    if (typeof value === 'string') {
      if (this.type === 'success') {
        return `{green-fg}${value}{/green-fg}`
      }
      if (this.type === 'error') {
        return `{red-fg}${value}{/red-fg}`
      }
      if (this.type === 'warn') {
        return `{yellow-fg}${value}{/yellow-fg}`
      }
    }
    return value;
  }

  renderMessage() {
    if (this.message) {
      if (this.type === 'success') {
        return `{green-fg}${this.message}{/green-fg} `;
      }
      if (this.type === 'error') {
        return `{red-fg}${this.message}{/red-fg} `;
      }
      if (this.type === 'warn') {
        return `{yellow-fg}${this.message}{/yellow-fg} `;
      }
      return `${this.message} `
    }
    return '';
  }

  renderDate() {
    if (this.depth === 0) {
      return `{magenta-fg}(${dateFormat(this.date, 'dd/mm/yyyy HH:MM:ss.L')}){/magenta-fg} `;
    }
    return '';
  }

  renderDuration() {
    if (this.relativeDuration) {
      return `{grey-fg}+${this.relativeDuration}{/grey-fg} `;
    }
    return '';
  }

  getRelativeDuration() {
    return this.humanizeDuration(this.date - this.previousLog.date);
  }

  humanizeDuration(duration) {
    if (duration < 1000) {
      return `${duration}ms`;
    }
    if (duration < 60000) {
      let milliseconds = duration % 1000;
      milliseconds = ('000' + milliseconds).slice(-3);
      return `${Math.floor(duration / 1000)}.${milliseconds}s`;
    }
    return `${Math.floor(duration / 60000)}m ${Math.round((duration % 60000) / 1000)}s`
  }

  addChild(log) {
    this.children.push(log);
  }

  getLastChild() {
    return this.children[this.children.length - 1];
  }

  getChildren(list) {
    list = list || [];
    list.push.apply(list, this.children);
    this.children.forEach(child => {
      child.getChildren(list);
    });
    return list;
  }

  setStatus(status) {
    this.status = status;
    this.update();
  }

  prune(value) {
    return prune(value, {
      depthDecr: 2,
      arrayMaxLength: 8,
      prunedString: ' [...]'
    });
  }
}
