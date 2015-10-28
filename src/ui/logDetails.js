import blessed from 'blessed';
import transceiver from 'transceiver';
import dateFormat from 'dateformat';

export default class logDetails {
  constructor() {
    this.channel = transceiver.channel('log');
    this.element = blessed.box({
      height: 6,
      left: '0',
      bottom: 0,
      tags: true,
      keys: true,
      padding: {
        left: 1,
        right: 1,
      },
      style: {
        selected: {
          fg: 'black',
          bg: 'white',
          border: {
            fg: 'white'
          },
          hover: {
            bg: 'green'
          }
        }
      }
    });

    this.channel.on('select log', this.updateLogDetails.bind(this));
  }

  updateLogDetails(log) {
    this.element.setContent(this.renderType(log) + this.renderId(log) + this.renderDate(log) + this.renderDuration(log) + this.renderData(log));
  }

  renderType(log) {
    if (log.type === 'root') {
      return '{magenta-fg}{bold}ROOT{/bold}{/magenta-fg}\n';
    }
    if (log.type === 'success') {
      return '{green-fg}✔ {bold}SUCCESS{/bold}{/green-fg}\n';
    }
    if (log.type === 'error') {
      return '{red-fg}✘ {bold}ERROR{/bold}{/red-fg}\n';
    }
    if (log.type === 'warn') {
      return '{yellow-fg}! {bold}WARN{/bold}{/red-fg}\n';
    }
    if (log.type === 'child') {
      return '{grey-fg}{bold}CHILD{/bold}{/grey-fg}\n';
    }
    if (log.type === 'async') {
      if (log.status === 'resolved') {
        return '{bold}{green-fg}ASYNC CHILD{/bold} (RESOLVED ✔){/green-fg}\n';
      }
      if (log.status === 'rejected') {
        return '{bold}{red-fg}ASYNC CHILD{/bold} (REJECTED ✘){/red-fg}\n';
      }
      if (log.status === 'pending') {
        return '{cyan-fg}{bold}ASYNC CHILD{/bold} (PENDING ⌛){/cyan-fg}\n';
      }
    }
    if (log.type === 'info') {
      return '{white-fg}{bold}INFO{/bold}{/white-fg}\n';
    }
    return '';
  }

  renderId(log) {
    return `{bold}ID:{/bold} {underline}${log.id}{/underline}\n`;
  }

  renderDate(log) {
    return `{bold}TIME:{/bold} {magenta-fg}${dateFormat(log.date, 'dddd, mmmm dS yyyy, HH:MM:ss.L')}{/magenta-fg}\n`;
  }

  renderDuration(log) {
    if (log.relativeDuration && log.previousLog) {
      return `{bold}DURATION:{/bold} {yellow-fg}${log.relativeDuration}{/yellow-fg} (from {underline}${log.previousLog.id}{/underline})\n`;
    }
    return '';
  }

  renderData(log) {
    if (log.data) {
      return `{bold}DATA:{/bold} ${log.renderData()}\n`
    }
    return '';
  }
}
