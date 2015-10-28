import blessed from 'blessed';
import transceiver from 'transceiver';

import LogsList from './logsList';
import LogDetails from './logDetails';
import Inspecter from './inspecter';

export default class Ui {
  constructor() {
    this.channel = transceiver.channel('ui');
    this.screen = blessed.screen({
      smartCSR: true
    });

    this.logsList = new LogsList();
    this.logDetails = new LogDetails();
    this.inspecter = new Inspecter();

    this.separator = blessed.line({
      bottom: 6,
      orientation: 'horizontal'
    });

    this.screen.append(this.logsList.element);
    this.screen.append(this.logDetails.element);
    this.screen.append(this.separator);
    this.screen.append(this.inspecter.element);

    this.logsList.element.focus();

    this.screen.key(['q', 'C-c'], function(ch, key) {
      return process.exit(0);
    });

    this.screen.key(['i'], this.toggleInspecter.bind(this));

    this.screen.render();

    this.channel.reply('render', () => this.screen.render());
  }

  toggleInspecter() {
    if (this.inspecter.opened) {
      this.inspecter.close();
      this.logsList.focus();
    } else {
      this.inspecter.open(this.logsList.selectedLog);
    }
    this.screen.render();
  }
}
