import blessed from 'blessed';
import transceiver from 'transceiver';

export default class LogsList {
  constructor() {
    this.selectedLog = null;
    this.logs = {};
    this.logsCount = 0;
    this.channel = transceiver.channel('log');
    this.autoScroll = true;
    this.element = blessed.list({
      top: '0',
      left: '0',
      bottom: 7,
      tags: true,
      keys: true,
      mouse: true,
      scrollbar: {
        bg: 'magenta',
      },
      style: {
        selected: {
          fg: 'black',
          bg: 'white',
        }
      }
    });

    this.element.key(['up', 'down', 's', 'b'], (ch, key) => {
      if (key.name === 's') {
        this.autoScroll = !this.autoScroll;
      } else if (key.name === 'b') {
        this.scrollToBottom();
        transceiver.request('ui', 'render');
      } else {
        this.autoScroll = false;
      }
    });

    this.element.on('select item', (element, i) => {
      this.selectedLog = this.getLogFromElement(element);
      if (this.selectedLog) {
        this.channel.emit('select log', this.selectedLog);
      }
    });

    this.channel.reply({
      addLog: this.addLog,
      getSelectedLog: this.getSelectedLog,
    }, this);
  }

  addLog(log) {
    let element;

    this.logs[log.id] = log;
    this.logsCount++;

    if (log.parent) {
      const index = this.element.getItemIndex(log.parent.element) + log.parent.getChildren().length;
      this.element.insertItem(index, log.render());
      element = this.element.getItem(index);
    } else {
      element = this.element.add(log.render());
    }
    element.logId = log.id;
    if (this.autoScroll) {
      this.scrollToBottom();
    }
    if (this.logsCount === 1) {
      this.channel.emit('select log', log);
    }
    return element;
  }

  getSelectedLog() {
    return this.selectedLog;
  }

  scrollToBottom() {
    this.element.move(this.logsCount);
  }

  getLogFromElement(element) {
    return this.logs[element.logId];
  }

  focus() {
    this.element.focus();
  }
}
