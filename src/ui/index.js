import blessed from 'blessed';
import transceiver from 'transceiver';

import LogsList from './logsList';
import LogDetails from './logDetails';
import Inspector from './inspector';

export default class Ui {
  constructor() {
    this.channel = transceiver.channel('ui');
    this.screen = blessed.screen({
      smartCSR: true
    });

    this.logsList = new LogsList();
    this.logDetails = new LogDetails();
    this.inspector = new Inspector();

    this.separator = blessed.line({
      bottom: 6,
      orientation: 'horizontal'
    });

    this.screen.append(this.logsList.element);
    this.screen.append(this.logDetails.element);
    this.screen.append(this.separator);
    this.screen.append(this.inspector.element);

    this.logsList.element.focus();

    this.screen.key(['q', 'C-c'], function(ch, key) {
      return process.exit(0);
    });

    this.screen.key(['i'], this.toggleInspector.bind(this));

    this.screen.render();

    this.channel.reply('render', () => this.screen.render());
  }

  toggleInspector() {
    if (this.inspector.opened) {
      this.inspector.close();
      this.logsList.focus();
    } else {
      this.inspector.open(this.logsList.selectedLog);
    }
    this.screen.render();
  }
}
